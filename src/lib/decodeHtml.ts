import { decode } from 'he'

export function decodeHtml(input?: string) {
  if (!input) return ''
  return decode(input)
}

export function cleanEncodedPlainText(input?: string | null) {
  if (!input) return ''

  // Remove dangling/truncated entities at the end (common in Substack RSS excerpts)
  const cleaned = input
    .replace(/&#\d{1,7}$/g, '') // e.g. "r&#23"
    .replace(/&#x[0-9a-fA-F]{1,6}$/g, '') // e.g. "&#x201"
    .replace(/&[a-zA-Z]{1,20}$/g, '') // e.g. "&amp" (cut off)

  // Decode entities
  const decoded = decode(cleaned)

  // Strip ASCII control chars that can render as tofu/� in UI
  return decoded.replace(/[\u0000-\u001F\u007F]/g, '')
}
