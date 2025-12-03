import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pbarron.dev',
  ),
  title: {
    template: '%s - Paul Barrón',
    default: 'Paul Barrón - Software engineer, founder, and amateur astronaut',
  },
  description:
    'I’m Paul Barrón, a software designer and entrepreneur based in New York City. I write about tech, product, and the messy middle of building things.',
  alternates: {
    types: {
      'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    title: 'Paul Barrón - Software engineer, founder, and amateur astronaut',
    description:
      'Portfolio, essays, and projects from Paul Barrón, a software engineer and product-minded problem solver.',
    url: '/',
    type: 'website',
    images: [
      {
        url: '/og-image.png', // lives in /public
        width: 1200,
        height: 630,
        alt: 'Preview image for Paul Barrón’s site',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paul Barrón - Software engineer, founder, and amateur astronaut',
    description:
      'Portfolio, essays, and projects from Paul Barrón, a software engineer and product-minded problem solver.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
