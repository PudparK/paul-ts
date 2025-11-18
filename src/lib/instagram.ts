// lib/instagram.ts
export async function getAvatarUrl() {
  const token = process.env.IG_ACCESS_TOKEN
  const IG_API_URL = process.env.IG_API_URL ?? 'https://graph.instagram.com/me'

  if (!token) {
    console.error('Missing IG_ACCESS_TOKEN env var')
    return null
  }

  const res = await fetch(
    `${IG_API_URL}?fields=id,username,profile_picture_url&access_token=${token}`,
    { next: { revalidate: 86400 } }, // cache for 1 day
  )

  if (!res.ok) {
    console.error('Failed to fetch Instagram profile picture', res.status)
    return null
  }

  const data = await res.json()
  return (data.profile_picture_url ?? null) as string | null
}
