import { type Metadata } from 'next'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import { type ArticleWithSlug, getAllArticles } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'
import { type SubstackPost, getSubstackPosts } from '@/lib/getSubstackPosts'

// ✅ Static generation + periodic refresh of Substack RSS
export const revalidate = 3600 // seconds (1 hour)

function Article({ article }: { article: ArticleWithSlug }) {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title href={`/articles/${article.slug}`}>
          {article.title}
        </Card.Title>
        <Card.Eyebrow
          as="time"
          dateTime={article.date}
          className="md:hidden"
          decorate
        >
          {formatDate(article.date)}
        </Card.Eyebrow>
        <Card.Description>{article.description}</Card.Description>
        <Card.Cta>Read article</Card.Cta>
      </Card>
      <Card.Eyebrow
        as="time"
        dateTime={article.date}
        className="mt-1 max-md:hidden"
      >
        {formatDate(article.date)}
      </Card.Eyebrow>
    </article>
  )
}

function SubstackArticle({ post }: { post: SubstackPost }) {
  const preview = post.description ?? ''
  const hasDate = post.date && !Number.isNaN(new Date(post.date).getTime())
  const displayDate = hasDate ? formatDate(post.date) : ''

  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title href={`/articles/${post.slug}`}>{post.title}</Card.Title>
        <Card.Eyebrow
          as="time"
          dateTime={hasDate ? post.date : undefined}
          className="md:hidden"
          decorate
        >
          {displayDate}
        </Card.Eyebrow>
        <Card.Description>
          {preview}
          {preview.length >= 280 ? '…' : ''}
        </Card.Description>
        <Card.Cta>Read article</Card.Cta>
      </Card>
      {hasDate && (
        <Card.Eyebrow
          as="time"
          dateTime={post.date}
          className="mt-1 max-md:hidden"
        >
          {displayDate}
        </Card.Eyebrow>
      )}
    </article>
  )
}

export const metadata: Metadata = {
  title: 'Articles',
  description:
    'All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order.',
}

export default async function ArticlesIndex() {
  const [articles, substackPosts] = await Promise.all([
    getAllArticles(),
    getSubstackPosts(5), // tweak limit as you like
  ])

  return (
    <SimpleLayout
      title="Writing on software design, company building, and the aerospace industry."
      intro="All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order."
    >
      <div className="space-y-12">
        {/* Local MDX articles */}
        <section className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
          <h2 className="mb-6 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            On this site
          </h2>
          <div className="flex max-w-3xl flex-col space-y-16">
            {articles.map((article) => (
              <Article key={article.slug} article={article} />
            ))}
          </div>
        </section>

        {/* Substack feed */}
        {substackPosts.length > 0 && (
          <section className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
            <h2 className="mb-6 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              From my Substack
            </h2>
            <div className="flex max-w-3xl flex-col space-y-16">
              {substackPosts.map((post) => (
                <SubstackArticle key={post.url} post={post} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SimpleLayout>
  )
}
