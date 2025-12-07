import Parser from 'rss-parser'

type SubstackItem = {
  title: string
  link: string
  isoDate?: string
  contentSnippet?: string
  ['content:encoded']?: string
  content?: string
  creator?: string
}

const parser = new Parser<{}, SubstackItem>()

export interface SubstackPost {
  title: string
  url: string
  slug: string
  date: string // ISO string, we’ll pass this through to ArticleLayout
  description: string
  contentHtml: string
  author: string
}

function extractSlug(link: string): string {
  try {
    const url = new URL(link)
    const parts = url.pathname.split('/').filter(Boolean)
    // e.g. /p/lorem-testsum -> "lorem-testsum"
    return parts[parts.length - 1] || ''
  } catch {
    const raw = link.split('?')[0]
    const parts = raw.split('/').filter(Boolean)
    return parts[parts.length - 1] || ''
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

export async function getSubstackPosts(limit = 10): Promise<SubstackPost[]> {
  try {
    const res = await fetch('https://paulbarron36.substack.com/feed', {
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      console.error(
        '❌ Failed to fetch Substack RSS:',
        res.status,
        res.statusText,
      )
      return []
    }

    const xml = await res.text()
    const feed = await parser.parseString(xml)
    const items = feed.items ?? []

    return items.slice(0, limit).map((item) => {
      const contentHtml =
        item['content:encoded'] || item.content || item.contentSnippet || ''

      const description = stripHtml(contentHtml).slice(0, 280)

      // ✅ Normalize to YYYY-MM-DD like your MDX frontmatter
      const rawDate = item.isoDate ? new Date(item.isoDate) : new Date()
      const normalizedDate = isNaN(rawDate.getTime())
        ? ''
        : rawDate.toISOString().split('T')[0]

      return {
        title: item.title,
        url: item.link,
        slug: extractSlug(item.link),
        date: normalizedDate, // <-- now looks like "2025-12-02"
        description,
        contentHtml,
        author: item.creator || 'Paul Barron',
      }
    })
  } catch (err) {
    console.error('❌ Error while parsing Substack RSS:', err)
    return []
  }
}

export async function getSubstackPostBySlug(
  slug: string,
): Promise<SubstackPost | null> {
  const posts = await getSubstackPosts(50)
  const match = posts.find((p) => p.slug === slug)
  return match ?? null
}
