import { setRequestLocale } from 'next-intl/server'
import { HeroSection } from '@/components/home/HeroSection'
import { TrustStrip } from '@/components/home/TrustStrip'
import { CategoriesGrid } from '@/components/home/CategoriesGrid'
import { BestSellers } from '@/components/home/BestSellers'
import { StorySection } from '@/components/home/StorySection'
import { Testimonials, type FeaturedTestimonial } from '@/components/home/Testimonials'
import { prisma } from '@/lib/prisma'
import { Newsletter } from '@/components/home/Newsletter'
import { PaymentShipping } from '@/components/home/PaymentShipping'
import { getHomepageSettings } from '@/lib/homepage'
import { getSiteSettings } from '@/lib/settings'
import { pickLocale } from '@/lib/cms'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

// Réseaux sociaux par défaut (repli si non renseignés dans l'admin).
const DEFAULT_SOCIALS = {
  instagram: 'https://www.instagram.com/dardmana',
  facebook: 'https://www.facebook.com/dardmana',
  tiktok: 'https://www.tiktok.com/@dardmana',
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Contenu éditable de la page d'accueil (admin CMS).
  const [homepage, settings] = await Promise.all([getHomepageSettings(), getSiteSettings()])
  const heroTitle = pickLocale(homepage, 'heroTitle', locale)
  const heroSubtitle = pickLocale(homepage, 'heroSubtitle', locale)
  const newsletterTitle = pickLocale(homepage, 'newsletterTitle', locale)

  // sameAs des données structurées : réseaux sociaux configurés en admin.
  const sameAs = [
    settings.socialInstagram || DEFAULT_SOCIALS.instagram,
    settings.socialFacebook || DEFAULT_SOCIALS.facebook,
    settings.socialTikTok || DEFAULT_SOCIALS.tiktok,
  ]
  const phone = settings.phone || '+212600000000'

  // Témoignages mis en avant (fallback statique géré dans le composant si vide).
  const featuredRaw = await prisma.guestbookEntry
    .findMany({
      where: { isApproved: true, isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, customerName: true, customerCity: true, customerCountry: true, message: true, rating: true },
    })
    .catch(() => [])

  const featured: FeaturedTestimonial[] = featuredRaw.map((e) => ({
    id: e.id,
    name: e.customerName,
    message: e.message,
    rating: e.rating ?? 5,
    location: e.customerCity ?? e.customerCountry ?? '',
  }))

  // Note moyenne réelle, combinée à partir des avis produits et du Livre d'Or.
  const [reviewAgg, guestbookAgg] = await Promise.all([
    prisma.review
      .aggregate({ _avg: { rating: true }, _count: { rating: true }, where: { isApproved: true } })
      .catch(() => null),
    prisma.guestbookEntry
      .aggregate({
        _avg: { rating: true },
        _count: { rating: true },
        where: { isApproved: true, rating: { not: null } },
      })
      .catch(() => null),
  ])

  const reviewCount = reviewAgg?._count.rating ?? 0
  const guestbookCount = guestbookAgg?._count.rating ?? 0
  const ratingCount = reviewCount + guestbookCount
  const ratingSum =
    (reviewAgg?._avg.rating ?? 0) * reviewCount + (guestbookAgg?._avg.rating ?? 0) * guestbookCount
  const ratingValue = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0

  const localBusinessLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Dar Dmana',
    description:
      "Dar Dmana — maison d'artisanat marocain de luxe : chapelets, parfums, cosmétiques et créations d'exception.",
    url: `${SITE_URL}/${locale}`,
    image: `${SITE_URL}/icon`,
    email: settings.email || 'contact@dardmana.ma',
    telephone: phone,
    priceRange: 'MAD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address || undefined,
      addressLocality: 'Casablanca',
      addressCountry: 'MA',
    },
    areaServed: 'MA',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '19:00',
      },
    ],
    sameAs,
    ...(ratingCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue,
        reviewCount: ratingCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dar Dmana',
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/logo.png`,
    description: "Dar Dmana — l'artisanat marocain réinventé, créations d'exception et élégance intemporelle.",
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: phone,
      email: settings.email || 'contact@dardmana.ma',
      areaServed: 'MA',
      availableLanguage: ['fr', 'ar', 'en'],
    },
  }

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Dar Dmana',
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/catalogue?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <HeroSection
        titleOverride={heroTitle}
        subtitleOverride={heroSubtitle}
        featuredIds={homepage.featuredProductIds}
      />
      <TrustStrip />
      <CategoriesGrid />
      <BestSellers featuredIds={homepage.featuredProductIds} />
      <StorySection />
      <Testimonials featured={featured} />
      <Newsletter titleOverride={newsletterTitle} />
      <PaymentShipping />
    </>
  )
}
