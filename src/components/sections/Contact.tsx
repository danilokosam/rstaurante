import type { Dictionary } from '@/i18n/dictionaries'

import { Section } from './Section'

type Props = {
  title: string
  dictionary: Dictionary
  address: string[]
  directionsHref: string | null
  phone: { label: string; href: string } | null
  whatsappHref: string | null
  email: string | null
}

const buttonClass =
  'inline-block rounded bg-accent px-5 py-3 font-medium text-accent-ink hover:brightness-110'
const secondaryClass =
  'inline-block rounded border border-accent px-5 py-3 font-medium text-accent hover:bg-surface'

/** Location and contact with one-tap actions (US-F2 CA1). */
export function Contact({
  title,
  dictionary,
  address,
  directionsHref,
  phone,
  whatsappHref,
  email,
}: Props) {
  return (
    <Section id="contact" title={title} muted>
      {address.length ? (
        <address className="text-lg not-italic">
          {address.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
      ) : null}
      <ul className="mt-6 flex flex-wrap gap-3">
        {directionsHref ? (
          <li>
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass}
            >
              {dictionary.contact.directions}
            </a>
          </li>
        ) : null}
        {phone ? (
          <li>
            <a href={phone.href} className={secondaryClass}>
              <span className="sr-only">{dictionary.contact.phone}: </span>
              {phone.label}
            </a>
          </li>
        ) : null}
        {whatsappHref ? (
          <li>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryClass}
            >
              {dictionary.contact.whatsapp}
            </a>
          </li>
        ) : null}
        {email ? (
          <li>
            <a href={`mailto:${email}`} className={secondaryClass}>
              <span className="sr-only">{dictionary.contact.email}: </span>
              {email}
            </a>
          </li>
        ) : null}
      </ul>
    </Section>
  )
}
