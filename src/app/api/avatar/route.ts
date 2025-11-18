// app/api/avatar/route.ts
export async function GET() {
  const token = process.env.IG_ACCESS_TOKEN
  const IG_API_URL = process.env.IG_API_URL ?? 'https://graph.instagram.com/me'

  if (!token) {
    return new Response('Missing IG_ACCESS_TOKEN', { status: 500 })
  }

  // 1) Get profile picture URL from Instagram (cached 1 day by Next)
  const profileRes = await fetch(
    `${IG_API_URL}?fields=id,username,profile_picture_url&access_token=${token}`,
    { next: { revalidate: 86400 } }, // 24h cache on the profile API
  )

  if (!profileRes.ok) {
    return new Response('Failed to fetch profile', { status: 502 })
  }

  const data = await profileRes.json()
  const imageUrl = data.profile_picture_url as string | undefined

  if (!imageUrl) {
    return new Response('No profile picture', { status: 404 })
  }

  // 2) Fetch the actual image bytes from Instagram
  const imageRes = await fetch(imageUrl)

  if (!imageRes.ok) {
    return new Response('Failed to fetch image', { status: 502 })
  }

  const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await imageRes.arrayBuffer()

  // 3) Return the image bytes from *your* domain
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // browser cache 1 day
    },
  })
}
