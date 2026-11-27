import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { About } from '@/components/sections/About'
import { Contact } from '@/components/sections/Contact'
import { Featured } from '@/components/sections/Featured'
import { Gallery } from '@/components/sections/Gallery'
import { Hero } from '@/components/sections/Hero'
import { Hours } from '@/components/sections/Hours'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getFeaturedDishes, getGalleryImages, getHomepage, getSiteSettings } from '@/lib/content'
import { ogImage } from '@/lib/content/seo'
import { getEnv } from '@/lib/env'
import { heroCtaHref, paragraphs } from '@/lib/home'
import { groupOpeningHours } from '@/lib/hours'
import { restaurantJsonLd, serializeJsonLd } from '@/lib/jsonLd'
import { addressLines, mapsHref, phoneHref, whatsappHref } from '@/lib/links'
import { pageMetadata } from '@/lib/seo'
import type { Media } from '@/payload-types'

type Props = {
  params: Promise<{ locale: string }>
}

const media = (value: number | Media | null | undefined): Media | null =>
  typeof value === 'object' && value !== null ? value : null

const text = (value: string | null | undefined): string => value?.trim() ?? ''

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const [settings, homepage] = await Promise.all([getSiteSettings(locale), getHomepage(locale)])
  const name = text(settings.name) || getDictionary(locale).site.defaultName
  return pageMetadata({
    locale,
    title: { absolute: text(homepage.seo?.title) || text(settings.seo?.title) || name },
    description:
      text(homepage.seo?.description) ||
      text(settings.seo?.description) ||
      text(settings.description) ||
      null,
    siteName: name,
    image: ogImage(settings.seo?.image) ?? ogImage(homepage.hero?.image),
  })
}

/**
 * Home page: hero, about, featured dishes, gallery, opening hours and
 * location/contact, in this fixed order; sections without content are not
 * rendered (RF-WEB-01).
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dictionary = getDictionary(locale)
  const [settings, homepage, featured, gallery] = await Promise.all([
    getSiteSettings(locale),
    getHomepage(locale),
    getFeaturedDishes(locale),
    getGalleryImages(locale),
  ])
  const sections = homepage.sections
  const name = text(settings.name) || dictionary.site.defaultName

  const ctaHref = heroCtaHref(homepage.hero?.cta, settings.contact, locale)
  const aboutParagraphs = paragraphs(homepage.about?.body)
  const hours = groupOpeningHours(settings.openingHours?.slots)
  const address = addressLines(settings.location)
  const directions = mapsHref(settings.location)
  const phone = text(settings.contact?.phone)
  const phoneLink = phoneHref(phone)
  const whatsapp = whatsappHref(settings.contact?.whatsappNumber, settings.contact?.whatsappMessage)
  const email = text(settings.contact?.email)
  const hasContact = Boolean(address.length || directions || phoneLink || whatsapp || email)

  const jsonLd = restaurantJsonLd({
    baseUrl: getEnv().serverUrl,
    locale,
    name,
    description: text(settings.description) || text(settings.seo?.description) || null,
    image: (ogImage(settings.seo?.image) ?? ogImage(homepage.hero?.image))?.url ?? null,
    settings,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Hero
        title={text(homepage.hero?.title) || name}
        subtitle={text(homepage.hero?.subtitle) || text(settings.tagline) || null}
        image={media(homepage.hero?.image)}
        cta={ctaHref ? { label: text(homepage.hero?.cta?.label), href: ctaHref } : null}
      />
      {aboutParagraphs.length ? (
        <About
          title={text(homepage.about?.title) || dictionary.sections.about}
          paragraphs={aboutParagraphs}
          image={media(homepage.about?.image)}
        />
      ) : null}
      {featured.length ? (
        <Featured
          title={text(sections?.featuredTitle) || dictionary.sections.featured}
          dishes={featured}
          locale={locale}
          dictionary={dictionary}
        />
      ) : null}
      {gallery.length ? (
        <Gallery
          title={text(sections?.galleryTitle) || dictionary.sections.gallery}
          images={gallery}
        />
      ) : null}
      {hours.length ? (
        <Hours
          title={text(sections?.hoursTitle) || dictionary.sections.hours}
          hours={hours}
          note={text(settings.openingHours?.note) || null}
          dictionary={dictionary}
        />
      ) : null}
      {hasContact ? (
        <Contact
          title={text(sections?.contactTitle) || dictionary.sections.contact}
          dictionary={dictionary}
          address={address}
          directionsHref={directions}
          phone={phoneLink ? { label: phone, href: phoneLink } : null}
          whatsappHref={whatsapp}
          email={email || null}
        />
      ) : null}
    </>
  )
}
