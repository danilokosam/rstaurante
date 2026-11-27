import Link from 'next/link'

import { CmsImage } from '@/components/CmsImage'
import type { Media } from '@/payload-types'

type Props = {
  title: string
  subtitle: string | null
  image: Media | null
  cta: { label: string; href: string } | null
}

const ctaClass =
  'mt-8 inline-block rounded bg-accent px-6 py-3 text-lg font-medium text-accent-ink hover:brightness-110'

/** Hero with the page's only h1; text over a darkened image when there is one. */
export function Hero({ title, subtitle, image, cta }: Props) {
  const external = cta && !cta.href.startsWith('/')
  const button = cta ? (
    external ? (
      <a
        href={cta.href}
        className={ctaClass}
        {...(cta.href.startsWith('https://')
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {cta.label}
      </a>
    ) : (
      <Link href={cta.href} className={ctaClass}>
        {cta.label}
      </Link>
    )
  ) : null

  if (!image) {
    return (
      <section className="bg-surface-muted">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
          <h1 className="text-4xl font-semibold text-balance sm:text-5xl">{title}</h1>
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-2xl text-lg whitespace-pre-line text-ink-muted">
              {subtitle}
            </p>
          ) : null}
          {button}
        </div>
      </section>
    )
  }

  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <CmsImage
        image={image}
        size="hero"
        sizes="100vw"
        className="-z-10 object-cover"
        fill
        priority
        decorative
      />
      <div className="absolute inset-0 -z-10 bg-ink/60" aria-hidden="true" />
      <div className="mx-auto max-w-5xl px-4 py-28 text-center text-white sm:py-40">
        <h1 className="text-4xl font-semibold text-balance sm:text-6xl">{title}</h1>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-lg whitespace-pre-line">{subtitle}</p>
        ) : null}
        {button}
      </div>
    </section>
  )
}
