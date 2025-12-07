import { type Metadata } from 'next'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import { formatDate } from '@/lib/formatDate'
import { type SubstackPost, getSubstackPosts } from '@/lib/getSubstackPosts'

// Static generate + refresh from Substack RSS every hour
export const revalidate = 3600

function Article({ post }: { post: SubstackPost }) {
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
  const substackPosts = await getSubstackPosts(10) // or 5 if you prefer

  return (
    <SimpleLayout
      title="Writing on software design, company building, and the aerospace industry."
      intro="All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order."
    >
      <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
        <div className="flex max-w-3xl flex-col space-y-16">
          {substackPosts.map((post) => (
            <Article key={post.url} post={post} />
          ))}
        </div>
      </div>
    </SimpleLayout>
  )
}
