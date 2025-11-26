import { NextRequest, NextResponse } from 'next/server'

const IG_API_URL = process.env.IG_API_URL ?? 'https://graph.instagram.com/me'
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN

export const runtime = 'nodejs' // just to be explicit

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const debug = searchParams.get('debug') === '1'

  if (!IG_ACCESS_TOKEN) {
    const msg = '[avatar] Missing IG_ACCESS_TOKEN in this environment'
    console.error(msg)
    return debug
      ? NextResponse.json({ error: msg }, { status: 500 })
      : NextResponse.redirect('/fallback-avatar.png')
  }

  const url = `${IG_API_URL}?fields=id,username,profile_picture_url&access_token=${IG_ACCESS_TOKEN}`

  try {
    console.log('[avatar] Calling IG API:', url)

    const igRes = await fetch(url, { cache: 'no-store' })
    const text = await igRes.text()

    if (!igRes.ok) {
      // For debug mode, send the raw error up so you can see it in the browser
      if (debug) {
        return NextResponse.json(
          { status: igRes.status, body: text },
          { status: igRes.status },
        )
      }
      console.error('[avatar] IG API not ok, using fallback')
      return NextResponse.redirect('/fallback-avatar.png')
    }

    const data = JSON.parse(text) as { profile_picture_url?: string }

    if (!data.profile_picture_url) {
      const msg = '[avatar] No profile_picture_url in IG response'
      console.error(msg, data)
      return debug
        ? NextResponse.json({ error: msg, data }, { status: 500 })
        : NextResponse.redirect('/fallback-avatar.png')
    }

    // Normal (non-debug) path: actually fetch & stream the image
    const imgRes = await fetch(data.profile_picture_url)

    if (!imgRes.ok) {
      const msg = '[avatar] Failed to fetch avatar image'
      console.error(msg, imgRes.status)
      return debug
        ? NextResponse.json(
            { error: msg, status: imgRes.status },
            { status: 500 },
          )
        : NextResponse.redirect('/fallback-avatar.png')
    }

    const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await imgRes.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err) {
    console.error('[avatar] Unexpected error:', err)
    return debug
      ? NextResponse.json(
          { error: 'unexpected error', detail: String(err) },
          { status: 500 },
        )
      : NextResponse.redirect('/fallback-avatar.png')
  }
}
