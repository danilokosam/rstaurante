import { CmsImage } from '@/components/CmsImage'
import type { Media } from '@/payload-types'

import { Section } from './Section'

type Props = {
  title: string
  images: Media[]
}

/** Simple image grid in the gallery order (no lightbox in the MVP). */
export function Gallery({ title, images }: Props) {
  return (
    <Section id="gallery" title={title} muted>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {images.map((image) => (
          <li key={image.id}>
            <CmsImage
              image={image}
              size="card"
              sizes="(min-width: 768px) 33vw, 50vw"
              className="aspect-square h-auto w-full rounded object-cover"
            />
          </li>
        ))}
      </ul>
    </Section>
  )
}
