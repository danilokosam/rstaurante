import { CmsImage } from '@/components/CmsImage'
import type { Media } from '@/payload-types'

import { Section } from './Section'

type Props = {
  title: string
  paragraphs: string[]
  image: Media | null
}

/** "About us": plain-text paragraphs (no HTML) and an optional image. */
export function About({ title, paragraphs, image }: Props) {
  return (
    <Section id="about" title={title}>
      <div className={image ? 'grid gap-8 md:grid-cols-2 md:items-center' : undefined}>
        <div className="max-w-prose space-y-4 text-lg">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
        {image ? (
          <CmsImage
            image={image}
            size="card"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="h-auto w-full rounded"
          />
        ) : null}
      </div>
    </Section>
  )
}
