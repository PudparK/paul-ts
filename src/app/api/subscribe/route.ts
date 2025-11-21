// app/api/subscribe/route.ts
import { NextResponse } from 'next/server'

const API_KEY = process.env.MAILCHIMP_API_KEY
const SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX
const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID

export async function POST(request: Request) {
  try {
    if (!API_KEY || !SERVER_PREFIX || !AUDIENCE_ID) {
      console.error('❌ Missing Mailchimp env vars')
      return NextResponse.json(
        { error: 'Server is not configured correctly.' },
        { status: 500 },
      )
    }

    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim() : ''

    if (!email) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 },
      )
    }

    const url = `https://${SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`

    const payload = {
      email_address: email,
      status: 'subscribed', // or 'pending' for double opt-in
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Mailchimp accepts this form: "Authorization: apikey YOUR_KEY"
        Authorization: `apikey ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('❌ Mailchimp error:', data)

      // Handle "already subscribed" as a soft success
      if (data?.title === 'Member Exists') {
        return NextResponse.json({
          ok: true,
          message: 'You are already subscribed.',
        })
      }

      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again later.' },
        { status: res.status },
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Thanks for subscribing!',
    })
  } catch (error) {
    console.error('❌ Error in subscribe handler:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
