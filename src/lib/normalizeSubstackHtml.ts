import * as cheerio from 'cheerio'
import he from 'he'
import { X_ICON_PATH } from '../components/socialIconPaths.js'

type TwitterEmbedAttrs = {
  url?: string
  full_text?: string
  username?: string
  name?: string
  profile_image_url?: string
  date?: string
  reply_count?: number
  retweet_count?: number
  like_count?: number
  impression_count?: number
}

type XEmbedResponse = {
  html?: string
}

type LinkPreview = {
  url: string
  title: string
  description: string
  image: string
  siteName: string
}

type TweetEmbedData = {
  text: string
  preview: LinkPreview | null
}

type NormalizeOptions = {
  fetchOEmbed?: typeof fetch
}

const shouldDebugSubstackEmbeds =
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_SUBSTACK_EMBEDS === '1'

function debugSubstackEmbed(message: string, details?: unknown) {
  if (!shouldDebugSubstackEmbeds) return

  if (details === undefined) {
    console.info(`[substack-embed] ${message}`)
    return
  }

  console.info(`[substack-embed] ${message}`, details)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseTwitterEmbedAttrs(rawAttrs?: string) {
  if (!rawAttrs) return null

  try {
    return JSON.parse(he.decode(rawAttrs)) as TwitterEmbedAttrs
  } catch {
    return null
  }
}

function normalizeTweetText(text?: string) {
  if (!text) return ''

  return he
    .decode(text)
    .replace(/\s+/g, ' ')
    .replace(/\s+pic\.x\.com\/\S+$/i, '')
    .trim()
}

function safeHttpUrl(value?: string | null) {
  if (!value) return ''

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''

    return url.toString()
  } catch {
    return ''
  }
}

function extractTweetTextFromOEmbed(html?: string) {
  if (!html) return ''

  const $ = cheerio.load(html)
  const text = $('blockquote.twitter-tweet p').first().text()

  return normalizeTweetText(text)
}

function extractFirstLinkFromOEmbed(html?: string) {
  if (!html) return ''

  const $ = cheerio.load(html)
  return safeHttpUrl($('blockquote.twitter-tweet p a').first().attr('href'))
}

function isOnlyUrl(value: string) {
  return /^https?:\/\/\S+$/i.test(value.trim())
}

function resolveMetaContent($: cheerio.CheerioAPI, name: string) {
  return (
    $(`meta[property="${name}"]`).attr('content') ||
    $(`meta[name="${name}"]`).attr('content') ||
    ''
  )
}

async function resolveRedirectUrl(url: string, fetchOEmbed: typeof fetch) {
  try {
    const res = await fetchOEmbed(url, { redirect: 'manual' })
    const location = safeHttpUrl(res.headers.get('location'))
    debugSubstackEmbed('resolved preview redirect', {
      inputUrl: url,
      status: res.status,
      location,
    })

    return location || url
  } catch (err) {
    debugSubstackEmbed('failed to resolve preview redirect', {
      inputUrl: url,
      error: err instanceof Error ? err.message : String(err),
    })
    return url
  }
}

async function fetchLinkPreview(
  url: string,
  fetchOEmbed: typeof fetch,
): Promise<LinkPreview | null> {
  const resolvedUrl = await resolveRedirectUrl(url, fetchOEmbed)

  try {
    const res = await fetchOEmbed(resolvedUrl)
    if (!res.ok) {
      debugSubstackEmbed('preview metadata fetch failed', {
        inputUrl: url,
        resolvedUrl,
        status: res.status,
        statusText: res.statusText,
      })
      return null
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const title =
      resolveMetaContent($, 'og:title') ||
      resolveMetaContent($, 'twitter:title') ||
      $('title').first().text()
    const description =
      resolveMetaContent($, 'og:description') ||
      resolveMetaContent($, 'twitter:description')
    const image = safeHttpUrl(
      resolveMetaContent($, 'og:image') ||
        resolveMetaContent($, 'twitter:image'),
    )
    const siteName = resolveMetaContent($, 'og:site_name')

    debugSubstackEmbed('preview metadata parsed', {
      inputUrl: url,
      resolvedUrl,
      hasTitle: Boolean(title),
      hasDescription: Boolean(description),
      hasImage: Boolean(image),
      siteName,
    })

    if (!title && !description && !image) {
      debugSubstackEmbed('preview metadata skipped: no usable fields', {
        inputUrl: url,
        resolvedUrl,
      })
      return null
    }

    return {
      url: resolvedUrl,
      title: normalizeTweetText(title),
      description: normalizeTweetText(description),
      image,
      siteName: normalizeTweetText(siteName),
    }
  } catch (err) {
    debugSubstackEmbed('preview metadata fetch errored', {
      inputUrl: url,
      resolvedUrl,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

async function fetchTweetEmbedData(
  url: string,
  fetchOEmbed: typeof fetch,
): Promise<TweetEmbedData> {
  const params = new URLSearchParams({
    url,
    omit_script: '1',
    dnt: 'true',
    hide_thread: 'true',
    maxwidth: '550',
  })

  try {
    const res = await fetchOEmbed(`https://publish.x.com/oembed?${params}`)
    if (!res.ok) {
      debugSubstackEmbed('x oEmbed fetch failed', {
        url,
        status: res.status,
        statusText: res.statusText,
      })
      return { text: '', preview: null }
    }

    const data = (await res.json()) as XEmbedResponse
    const text = extractTweetTextFromOEmbed(data.html)
    const previewUrl = isOnlyUrl(text)
      ? extractFirstLinkFromOEmbed(data.html) || text
      : ''
    debugSubstackEmbed('x oEmbed parsed', {
      url,
      text,
      isOnlyUrl: isOnlyUrl(text),
      previewUrl,
    })
    const preview = previewUrl
      ? await fetchLinkPreview(previewUrl, fetchOEmbed)
      : null

    debugSubstackEmbed('x embed data resolved', {
      url,
      renderMode: preview ? 'preview' : text ? 'text' : 'empty',
      hasPreview: Boolean(preview),
      previewUrl: preview?.url,
    })

    return { text, preview }
  } catch (err) {
    debugSubstackEmbed('x oEmbed fetch errored', {
      url,
      error: err instanceof Error ? err.message : String(err),
    })
    return { text: '', preview: null }
  }
}

function formatEmbedDate(value?: string) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  })
}

function formatEmbedTime(value?: string) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  })
}

function formatCompactNumber(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''

  if (value >= 100000) return `${Math.round(value / 1000)}K`
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`

  return new Intl.NumberFormat('en-US').format(value)
}

function formatStat(value: number | undefined, label: string) {
  const formatted = formatCompactNumber(value)
  if (!formatted) return ''

  return `${formatted} ${label}`
}

function renderXCard(attrs: TwitterEmbedAttrs, embedData: TweetEmbedData) {
  const url = safeHttpUrl(attrs.url)
  if (!url) return null

  const name = attrs.name || attrs.username || 'X'
  const username = attrs.username ? `@${attrs.username}` : ''
  const displayDate = formatEmbedDate(attrs.date)
  const fallbackText = normalizeTweetText(attrs.full_text)
  const text = embedData.text || fallbackText
  const profileImageUrl = safeHttpUrl(attrs.profile_image_url)
  const timestamp = [formatEmbedTime(attrs.date), displayDate]
    .filter(Boolean)
    .join(' · ')
  const reach = formatStat(attrs.impression_count, 'Views')
  const engagement = [
    formatStat(attrs.reply_count, 'Replies'),
    formatStat(attrs.retweet_count, 'Reposts'),
    formatStat(attrs.like_count, 'Likes'),
  ].filter(Boolean)
  const preview = embedData.preview
  debugSubstackEmbed('rendering x card', {
    url,
    name,
    username,
    renderMode: preview ? 'preview' : text ? 'text' : 'empty',
    hasProfileImage: Boolean(profileImageUrl),
    hasTimestamp: Boolean(timestamp),
    hasReach: Boolean(reach),
    engagement,
    preview: preview
      ? {
          url: preview.url,
          hasTitle: Boolean(preview.title),
          hasDescription: Boolean(preview.description),
          hasImage: Boolean(preview.image),
          siteName: preview.siteName,
        }
      : null,
  })

  return `
<aside class="not-prose substack-x-card">
  <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="substack-x-link">
    <div class="substack-x-header">
      ${
        profileImageUrl
          ? `<img src="${escapeHtml(profileImageUrl)}" alt="" class="substack-x-avatar" />`
          : ''
      }
      <div class="substack-x-meta">
        <p class="substack-x-name">${escapeHtml(name)}</p>
        <p class="substack-x-byline">${escapeHtml(username)}</p>
      </div>
      <svg class="substack-x-mark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="${X_ICON_PATH}"></path>
      </svg>
    </div>
    ${
      preview
        ? `<div class="substack-x-preview">
            ${
              preview.image
                ? `<img src="${escapeHtml(preview.image)}" alt="" class="substack-x-preview-image" />`
                : ''
            }
            <div class="substack-x-preview-body">
              ${
                preview.siteName
                  ? `<p class="substack-x-preview-site">${escapeHtml(preview.siteName)}</p>`
                  : ''
              }
              ${
                preview.title
                  ? `<p class="substack-x-preview-title">${escapeHtml(preview.title)}</p>`
                  : ''
              }
              ${
                preview.description
                  ? `<p class="substack-x-preview-description">${escapeHtml(preview.description)}</p>`
                  : ''
              }
            </div>
          </div>`
        : text
          ? `<p class="substack-x-text">${escapeHtml(text)}</p>`
          : ''
    }
    ${
      timestamp || reach
        ? `<p class="substack-x-timestamp">${escapeHtml(
            [timestamp, reach].filter(Boolean).join(' · '),
          )}</p>`
        : ''
    }
    ${
      engagement.length > 0
        ? `<div class="substack-x-divider"></div><p class="substack-x-stats">${escapeHtml(
            engagement.join(' · '),
          )}</p>`
        : ''
    }
  </a>
</aside>`
}

export async function normalizeSubstackHtml(
  html: string,
  { fetchOEmbed = fetch }: NormalizeOptions = {},
) {
  if (!html.includes('twitter-embed')) return html

  const $ = cheerio.load(html, null, false)
  const embeds = $('div.twitter-embed[data-attrs]').toArray()
  debugSubstackEmbed('found twitter embeds', { count: embeds.length })

  await Promise.all(
    embeds.map(async (element) => {
      const $embed = $(element)
      const componentName = $embed.attr('data-component-name')

      if (componentName && componentName !== 'Twitter2ToDOM') {
        debugSubstackEmbed('skipping non-twitter component', { componentName })
        return
      }

      const attrs = parseTwitterEmbedAttrs($embed.attr('data-attrs'))
      if (!attrs?.url) {
        debugSubstackEmbed('skipping twitter embed: missing or malformed attrs', {
          componentName,
          hasDataAttrs: Boolean($embed.attr('data-attrs')),
        })
        return
      }
      debugSubstackEmbed('parsed twitter embed attrs', {
        url: attrs.url,
        username: attrs.username,
        name: attrs.name,
        fullText: attrs.full_text,
        date: attrs.date,
        counts: {
          replies: attrs.reply_count,
          reposts: attrs.retweet_count,
          likes: attrs.like_count,
          impressions: attrs.impression_count,
        },
      })

      const embedData = await fetchTweetEmbedData(attrs.url, fetchOEmbed)
      const card = renderXCard(attrs, embedData)
      if (!card) return

      $embed.replaceWith(card)
    }),
  )

  return $.html()
}
