import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  SubstackIcon,
} from '@/components/SocialIcons'
import portraitImage from '@/images/portrait.jpg'
import Badge from '@/components/Badge'

const attributes = [
  'Father',
  'Hip Hop Head',
  'Tech Professional',
  'Gym Rat',
  'Hiker',
  'Runner',
  'Reader',
]

function SocialLink({
  className,
  href,
  children,
  icon: Icon,
}: {
  className?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <li className={clsx(className, 'flex')}>
      <Link
        href={href}
        target="_blank"
        className="group flex text-sm font-medium text-zinc-800 transition hover:text-teal-500 dark:text-zinc-200 dark:hover:text-teal-500"
      >
        <Icon className="h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-teal-500" />
        <span className="ml-4">{children}</span>
      </Link>
    </li>
  )
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  )
}

export const metadata: Metadata = {
  title: 'About',
  description:
    'I’m Paul Barrón, a Houston-based engineer building things with tech.',
}

export default function About() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
        <div className="lg:pl-20">
          <div className="max-w-xs px-2.5 lg:max-w-none">
            <Image
              src={portraitImage}
              alt=""
              sizes="(min-width: 1024px) 32rem, 20rem"
              className="-aspect-square rotate-3 rounded-xl bg-zinc-100 object-cover dark:bg-zinc-800"
            />
          </div>
        </div>
        <div className="lg:order-first lg:row-span-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            I’m Paul Barrón, a Houston-based engineer building things with tech.
          </h1>
          <div className="mt-4 space-y-7 text-base text-zinc-600 dark:text-zinc-400">
            <div className="flex flex-wrap gap-2">
              {attributes.map((attribute) => (
                <Badge key={attribute} color="teal">
                  {attribute}
                </Badge>
              ))}
            </div>
            <p>
              I’ve always been the type who needs to know how things work. I
              started tinkering in the dial-up and AOL days, breaking and fixing
              anything I could. Before I wrote a line of code, I spent years
              doing design, video editing, and running a small marketing agency.
              That mix of experience eventually led me into software
              engineering.
            </p>
            <figure className="mt-10 border-l border-teal-600 pl-9 dark:border-teal-400">
              <blockquote className="font-semibold text-gray-900 dark:text-white">
                <p>
                  “Before I wrote a line of code, I spent years designing, video
                  editing, and running a small marketing agency. That mix of
                  experience eventually led me into software engineering.”
                </p>
              </blockquote>
            </figure>
            <p>
              I never took the traditional CS route. No coding camps, no early
              classes. I learned by doing. Trial and error, late nights, broken
              builds, and those tiny wins that make the whole grind worth it.
              Getting into product later on taught me something important:
              defining the real problem is just as valuable as building the
              solution.
            </p>
            <p>
              Over the years, I’ve worked at three different health tech
              startups, and each stop pushed my skills further in engineering,
              product thinking, and operations. Working in healthcare showed me
              how messy real-world systems can be and how much good software
              matters when it affects people’s lives.
            </p>
            <figure className="mt-10 border-l border-teal-600 pl-9 dark:border-teal-400">
              <blockquote className="font-semibold text-gray-900 dark:text-white">
                <p>
                  "...I taught for years, which means I naturally lean toward
                  breaking things down in a way that feels clear and welcoming."
                </p>
              </blockquote>
            </figure>
            <p>
              Today, I work at the overlap of engineering, systems design, and
              operations, building systems that help real people in complex,
              high-stakes environments. Before tech, I taught for years, which
              means I naturally lean toward breaking things down in a way that
              feels clear and welcoming. This space lets me do that. It’s where
              I show the work, the process, and the things I’m still figuring
              out, so others — especially young Latino professionals — can see a
              path into tech that feels a little more like theirs.
            </p>
          </div>
        </div>
        <div className="lg:pl-20">
          <ul role="list">
            <SocialLink
              href="https://substack.com/@paulbarron36"
              icon={SubstackIcon}
            >
              Follow on Substack
            </SocialLink>
            <SocialLink
              href="https://www.instagram.com/paulgorithm/"
              icon={InstagramIcon}
              className="mt-4"
            >
              Follow on Instagram
            </SocialLink>
            <SocialLink
              href="https://github.com/PudparK"
              icon={GitHubIcon}
              className="mt-4"
            >
              Follow on GitHub
            </SocialLink>
            <SocialLink
              href="https://www.linkedin.com/in/paul-barron/"
              icon={LinkedInIcon}
              className="mt-4"
            >
              Follow on LinkedIn
            </SocialLink>
            <SocialLink
              href="mailto:hello@paulbarron.dev"
              icon={MailIcon}
              className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
            >
              hello@paulbarron.dev
            </SocialLink>
          </ul>
        </div>
      </div>
    </Container>
  )
}
