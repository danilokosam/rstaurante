import type { Dictionary } from '@/i18n/dictionaries'
import { groupOpeningHours } from '@/lib/hours'
import { addressLines, mapsHref, phoneHref } from '@/lib/links'
import type { SiteSetting } from '@/payload-types'

import { OpeningHours } from './OpeningHours'

type Props = {
  dictionary: Dictionary
  name: string
  settings: SiteSetting
}

const linkClass = 'rounded text-accent underline underline-offset-4 hover:no-underline'

/** Footer with contact, opening hours and social links (RF-WEB-03); empty blocks are not rendered. */
export function SiteFooter({ dictionary, name, settings }: Props) {
  const address = addressLines(settings.location)
  const directions = mapsHref(settings.location)
  const phone = settings.contact?.phone?.trim()
  const email = settings.contact?.email?.trim()
  const hours = groupOpeningHours(settings.openingHours?.slots)
  const hoursNote = settings.openingHours?.note?.trim()
  const socialLinks = settings.socialLinks ?? []
  const hasContact = address.length > 0 || Boolean(directions || phone || email)

  return (
    <footer className="mt-16 border-t border-line bg-surface-muted">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        {hasContact ? (
          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact" className="mb-3 text-base font-semibold">
              {dictionary.contact.title}
            </h2>
            {address.length ? (
              <address className="not-italic">
                {address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : null}
            <ul className="mt-3 space-y-1">
              {directions ? (
                <li>
                  <a
                    href={directions}
                    className={linkClass}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {dictionary.contact.directions}
                  </a>
                </li>
              ) : null}
              {phone ? (
                <li>
                  <span className="text-ink-muted">{dictionary.contact.phone}: </span>
                  <a href={phoneHref(phone) ?? undefined} className={linkClass}>
                    {phone}
                  </a>
                </li>
              ) : null}
              {email ? (
                <li>
                  <span className="text-ink-muted">{dictionary.contact.email}: </span>
                  <a href={`mailto:${email}`} className={linkClass}>
                    {email}
                  </a>
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        {hours.length ? (
          <section aria-labelledby="footer-hours">
            <h2 id="footer-hours" className="mb-3 text-base font-semibold">
              {dictionary.hours.title}
            </h2>
            <OpeningHours hours={hours} dictionary={dictionary} />
            {hoursNote ? <p className="mt-3 text-sm text-ink-muted">{hoursNote}</p> : null}
          </section>
        ) : null}

        {socialLinks.length ? (
          <section aria-labelledby="footer-social">
            <h2 id="footer-social" className="mb-3 text-base font-semibold">
              {dictionary.social.title}
            </h2>
            <ul className="space-y-1">
              {socialLinks.map((link) => (
                <li key={link.id ?? link.url}>
                  <a
                    href={link.url}
                    className={linkClass}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {dictionary.social[link.platform]}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <p className="border-t border-line px-4 py-4 text-center text-sm text-ink-muted">© {name}</p>
    </footer>
  )
}
