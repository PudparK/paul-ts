// next.config.mjs
import nextMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  outputFileTracingIncludes: {
    '/articles/*': ['./src/app/articles/**/*.mdx'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net', // Instagram sometimes proxies here
      },
      {
        protocol: 'https',
        hostname: 'instagram.f*', // fallback for regional sharded hosts
      },
    ],
  },
}

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    // IMPORTANT: use strings here, NOT imported functions
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: ['@mapbox/rehype-prism'],
  },
})

export default withMDX(nextConfig)
