import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import React from 'react'

import { ArticleLayout } from '@/components/ArticleLayout'
import type { ArticleWithSlug } from '@/lib/articles'
import { getAllArticles } from '@/lib/articles'
import { SubstackContent } from '@/components/SubstackContent'

import {
  getSubstackPostBySlug,
  getSubstackPosts,
  type SubstackPost,
} from '@/lib/getSubstackPosts'

type PageProps = {
  params: Promise<{ slug: string }>
}

type MdxArticleLoaded = {
  type: 'mdx'
  Component: React.ComponentType<any>
  article: ArticleWithSlug
}

type SubstackArticleLoaded = {
  type: 'substack'
  post: SubstackPost
}

type LoadedArticle = MdxArticleLoaded | SubstackArticleLoaded

function extractFirstImageUrlFromHtml(html?: string | null): string | null {
  if (!html) return null

  // Simple regex: find the first <img ... src="...">
  const match = html.match(/<img[^>]+src="([^"]+)"/i)
  if (match && match[1]) {
    return match[1]
  }

  return null
}

async function loadMdxArticle(slug: string): Promise<MdxArticleLoaded | null> {
  try {
    const mod = await import(`../${slug}/page.mdx`)

    const { article } = mod as {
      default: React.ComponentType<any>
      article: Omit<ArticleWithSlug, 'slug'>
    }

    const Component = mod.default as React.ComponentType<any>

    const articleWithSlug: ArticleWithSlug = {
      ...article,
      slug,
    }

    return {
      type: 'mdx',
      Component,
      article: articleWithSlug,
    }
  } catch (err) {
    // console.log('No MDX article for slug', slug, err)
    return null
  }
}

async function loadArticle(slug: string): Promise<LoadedArticle | null> {
  // 1. Try MDX first
  const mdx = await loadMdxArticle(slug)
  if (mdx) return mdx

  // 2. Fallback to Substack
  const post = await getSubstackPostBySlug(slug)
  if (post) {
    return { type: 'substack', post }
  }

  return null
}

export async function generateStaticParams() {
  const [articles, substackPosts] = await Promise.all([
    getAllArticles(),
    getSubstackPosts(20), // adjust how many Substack posts you want prebuilt
  ])

  return [
    ...articles.map((article) => ({ slug: article.slug })),
    ...substackPosts.map((post) => ({ slug: post.slug })),
  ]
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const loaded = await loadArticle(slug)

  if (!loaded) {
    return {
      title: 'Article not found',
      description: 'This article could not be found.',
    }
  }

  if (loaded.type === 'mdx') {
    const { article } = loaded
    return {
      title: article.title,
      description: article.description,
    }
  }

  const { post } = loaded
  const ogImageUrl = extractFirstImageUrlFromHtml(post.contentHtml)

  return {
    title: post.title,
    description: post.description,
    openGraph: ogImageUrl
      ? {
          title: post.title,
          description: post.description ?? undefined,
          images: [
            {
              url: ogImageUrl,
              alt: post.title,
            },
          ],
        }
      : {
          title: post.title,
          description: post.description ?? undefined,
        },
    twitter: ogImageUrl
      ? {
          card: 'summary_large_image',
          title: post.title,
          description: post.description ?? undefined,
          images: [ogImageUrl],
        }
      : {
          card: 'summary',
          title: post.title,
          description: post.description ?? undefined,
        },
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const loaded = await loadArticle(slug)

  if (!loaded) {
    notFound()
  }

  if (loaded.type === 'mdx') {
    const { Component, article } = loaded
    return <Component article={article} />
  }

  const { post } = loaded

  const article: ArticleWithSlug = {
    title: post.title,
    date: post.date,
    author: post.author,
    description: post.description,
    slug,
  }

  return (
    <ArticleLayout article={article}>
      <SubstackContent html={post.contentHtml} />
      <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
        Originally published on{' '}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Substack
        </a>
        .
      </p>
    </ArticleLayout>
  )
}
