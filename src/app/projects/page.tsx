import { type Metadata } from 'next'
import Image from 'next/image'
import {} from '@heroicons/react/24/solid'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import Badge from '@/components/Badge'

type GitHubRepo = {
  id: number
  name: string
  html_url: string
  description: string | null
  homepage: string | null
  fork: boolean
  language: string | null
}

function LinkIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M15.712 11.823a.75.75 0 1 0 1.06 1.06l-1.06-1.06Zm-4.95 1.768a.75.75 0 0 0 1.06-1.06l-1.06 1.06Zm-2.475-1.414a.75.75 0 1 0-1.06-1.06l1.06 1.06Zm4.95-1.768a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm3.359.53-.884.884 1.06 1.06.885-.883-1.061-1.06Zm-4.95-2.12 1.414-1.415L12 6.344l-1.415 1.413 1.061 1.061Zm0 3.535a2.5 2.5 0 0 1 0-3.536l-1.06-1.06a4 4 0 0 0 0 5.656l1.06-1.06Zm4.95-4.95a2.5 2.5 0 0 1 0 3.535L17.656 12a4 4 0 0 0 0-5.657l-1.06 1.06Zm1.06-1.06a4 4 0 0 0-5.656 0l1.06 1.06a2.5 2.5 0 0 1 3.536 0l1.06-1.06Zm-7.07 7.07.176.177 1.06-1.06-.176-.177-1.06 1.06Zm-3.183-.353.884-.884-1.06-1.06-.884.883 1.06 1.06Zm4.95 2.121-1.414 1.414 1.06 1.06 1.415-1.413-1.06-1.061Zm0-3.536a2.5 2.5 0 0 1 0 3.536l1.06 1.06a4 4 0 0 0 0-5.656l-1.06 1.06Zm-4.95 4.95a2.5 2.5 0 0 1 0-3.535L6.344 12a4 4 0 0 0 0 5.656l1.06-1.06Zm-1.06 1.06a4 4 0 0 0 5.657 0l-1.061-1.06a2.5 2.5 0 0 1-3.535 0l-1.061 1.06Zm7.07-7.07-.176-.177-1.06 1.06.176.178 1.06-1.061Z"
        fill="currentColor"
      />
    </svg>
  )
}

async function detectJsFramework(repoName: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/PudparK/${repoName}/main/package.json`,
    )

    if (!res.ok) {
      return []
    }

    const pkg = await res.json()
    const deps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    }

    const attributes: string[] = []

    if (deps.next) attributes.push('Next.js')
    if (deps.react) attributes.push('React')
    if (deps['react-native']) attributes.push('React Native')
    if (deps.express) attributes.push('Express')
    if (deps.tailwindcss) attributes.push('Tailwind')
    if (deps.vite) attributes.push('Vite')
    if (deps['@nestjs/core']) attributes.push('NestJS')
    if (deps.prisma) attributes.push('Prisma')

    return attributes
  } catch (err) {
    console.log('❌ Failed to detect framework for', repoName, err)
    return []
  }
}

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Things I’ve built along the way.',
}

async function getProjectsFromGitHub() {
  const res = await fetch(
    'https://api.github.com/users/PudparK/repos?sort=updated&per_page=12',
    {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      // cache / revalidate every 6 hours
      next: { revalidate: 60 * 60 * 6 },
    },
  )

  if (!res.ok) {
    console.log('❌ Failed to fetch GitHub repos', res.status) // 🧪
    return []
  }

  const repos: GitHubRepo[] = await res.json()

  const filtered = repos.filter((repo) => !repo.fork)

  return await Promise.all(
    filtered.map(async (repo, index) => {
      const frameworkAttributes = await detectJsFramework(repo.name)

      const attributes = [
        ...(repo.language ? [repo.language] : []),
        ...frameworkAttributes,
      ]

      return {
        name: repo.name,
        description:
          repo.description ??
          'No description provided yet. Check out the repo for more details.',
        link: {
          href: repo.html_url,
          label: repo.homepage || 'github.com',
        },
        attributes,
      }
    }),
  )
}

export default async function Projects() {
  const projects = await getProjectsFromGitHub()
  return (
    <SimpleLayout
      title="Things I’ve built along the way."
      intro="A collection of things I’ve built, some to learn, some to fix real problems, and some just because I was curious."
    >
      <ul
        role="list"
        className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((project) => (
          <Card as="li" key={project.name} className="group">
            <div className="flex items-center gap-2">
              <div className="relative z-10 h-2 w-2 rounded-full bg-teal-500/60 transition-colors duration-200 group-hover:bg-teal-500"></div>

              <h2 className="text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                <Card.Link href={project.link.href}>{project.name}</Card.Link>
              </h2>
            </div>
            <Card.Description>{project.description}</Card.Description>

            <p className="relative z-10 mt-6 flex text-sm font-medium text-zinc-400 transition group-hover:text-teal-500 dark:text-zinc-200">
              <LinkIcon className="h-6 w-6 flex-none" />
              <span className="ml-2">{project.link.label}</span>
            </p>

            <div className="relative z-10 mt-4 flex flex-wrap gap-2">
              {project.attributes.map((attr) => (
                <Badge
                  key={attr}
                  color="softTeal"
                  customStyles="inline-flex items-center rounded-full px-2 text-xs"
                >
                  {attr}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </ul>
    </SimpleLayout>
  )
}
