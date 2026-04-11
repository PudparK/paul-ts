import assert from 'node:assert/strict'
import { test } from 'node:test'

const attrs = {
  url: 'https://x.com/RampLabs/status/2036165188899012655?s=20',
  full_text: 'https://t.co/26LQlUoVas',
  username: 'RampLabs',
  name: 'Ramp Labs',
  profile_image_url:
    'https://pbs.substack.com/profile_images/1953463704529362944/gv1pUgYO_normal.jpg',
  date: '2026-03-23T19:36:25.000Z',
  reply_count: 54,
  retweet_count: 86,
  like_count: 1205,
  impression_count: 839056,
}

async function normalizeSubstackHtml(
  html: string,
  options: { fetchOEmbed?: typeof fetch } = {},
) {
  const helperPath: string = './normalizeSubstackHtml.ts'
  const mod = await import(helperPath)
  return mod.normalizeSubstackHtml(html, options) as Promise<string>
}

function twitterEmbedHtml(rawAttrs = JSON.stringify(attrs)) {
  return `<p>Before</p><div class="twitter-embed" data-attrs="${rawAttrs.replace(
    /"/g,
    '&quot;',
  )}" data-component-name="Twitter2ToDOM"></div><p>After</p>`
}

test('replaces Substack Twitter embeds with static X cards enriched by oEmbed', async () => {
  const fetchOEmbed: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        html: `<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Signals make the system easier to operate.</p></blockquote>`,
      }),
      { status: 200 },
    )

  const html = await normalizeSubstackHtml(twitterEmbedHtml(), { fetchOEmbed })

  assert.match(html, /<aside class="not-prose substack-x-card/)
  assert.match(html, /Signals make the system easier to operate\./)
  assert.match(html, /Ramp Labs/)
  assert.match(html, /@RampLabs/)
  assert.match(html, /2:36 PM · Mar 23, 2026 · 839K Views/)
  assert.match(html, /54 Replies · 86 Reposts · 1\.21K Likes/)
  assert.doesNotMatch(html, /twitter-embed/)
})

test('uses graph metadata when tweet content is only a link', async () => {
  const fetchOEmbed: typeof fetch = async (input) => {
    const url = input.toString()
    if (url === 'https://t.co/26LQlUoVas') {
      return new Response('', {
        status: 301,
        headers: { location: 'https://example.com/ramp-sheets' },
      })
    }
    if (url === 'https://example.com/ramp-sheets') {
      return new Response(
        `<html><head>
          <meta property="og:site_name" content="Ramp Engineering">
          <meta property="og:title" content="How Ramp Sheets stays reliable">
          <meta property="og:description" content="Operational signals, monitoring, and a self-maintaining workflow.">
          <meta property="og:image" content="https://example.com/card.png">
        </head></html>`,
      )
    }

    return new Response(
      JSON.stringify({
        html: `<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="https://t.co/26LQlUoVas">https://t.co/26LQlUoVas</a></p></blockquote>`,
      }),
      { status: 200 },
    )
  }

  const html = await normalizeSubstackHtml(twitterEmbedHtml(), { fetchOEmbed })

  assert.match(html, /substack-x-preview/)
  assert.match(html, /Ramp Engineering/)
  assert.match(html, /How Ramp Sheets stays reliable/)
  assert.match(html, /Operational signals, monitoring/)
  assert.doesNotMatch(html, /https:\/\/t\.co\/26LQlUoVas/)
})

test('uses image-only graph metadata when tweet content is only a link', async () => {
  const fetchOEmbed: typeof fetch = async (input) => {
    const url = input.toString()
    if (url === 'https://t.co/26LQlUoVas') {
      return new Response('', {
        status: 301,
        headers: { location: 'https://example.com/image-only' },
      })
    }
    if (url === 'https://example.com/image-only') {
      return new Response(
        `<html><head>
          <meta property="og:image" content="https://example.com/card.png">
        </head></html>`,
      )
    }

    return new Response(
      JSON.stringify({
        html: `<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="https://t.co/26LQlUoVas">https://t.co/26LQlUoVas</a></p></blockquote>`,
      }),
      { status: 200 },
    )
  }

  const html = await normalizeSubstackHtml(twitterEmbedHtml(), { fetchOEmbed })

  assert.match(html, /substack-x-preview/)
  assert.match(html, /https:\/\/example.com\/card.png/)
  assert.doesNotMatch(html, /https:\/\/t\.co\/26LQlUoVas/)
})

test('falls back to a useful card when oEmbed fails', async () => {
  const fetchOEmbed: typeof fetch = async () =>
    new Response('', { status: 503 })
  const html = await normalizeSubstackHtml(
    twitterEmbedHtml(
      JSON.stringify({
        ...attrs,
        full_text: 'Ramp shared a clean signal-driven monitoring setup.',
      }),
    ),
    { fetchOEmbed },
  )

  assert.match(html, /Ramp shared a clean signal-driven monitoring setup\./)
  assert.match(html, /54 Replies · 86 Reposts · 1\.21K Likes/)
})

test('leaves malformed Substack Twitter embeds untouched', async () => {
  const fetchOEmbed: typeof fetch = async () =>
    new Response('', { status: 200 })
  const html = await normalizeSubstackHtml(twitterEmbedHtml('{not-json'), {
    fetchOEmbed,
  })

  assert.match(html, /twitter-embed/)
  assert.match(html, /\{not-json/)
})
