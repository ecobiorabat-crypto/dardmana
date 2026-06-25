import type { Metadata } from 'next'
import { ensurePageEnabled } from "@/lib/nav-config"
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { pickLocale } from '@/lib/utils/product'
import { routing } from '@/i18n/routing'
import { GuestbookFeed, type CategoryOption } from '@/components/guestbook/GuestbookFeed'
import { GuestbookForm, type ProductOption } from '@/components/guestbook/GuestbookForm'
import type { GuestbookEntryDTO } from '@/components/guestbook/GuestbookCard'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')
const PAGE_SIZE = 12

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Guestbook' })
  const url = `${SITE_URL}/${locale}/livre-dor`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/livre-dor`

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: url, languages },
    openGraph: {
      title: `${t('metaTitle')} · Dar Dmana`,
      description: t('metaDescription'),
      url,
      siteName: 'Dar Dmana',
      type: 'website',
    },
  }
}

function compact(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export default async function LivreDorPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await ensurePageEnabled("livreDor", locale)
  const t = await getTranslations('Guestbook')

  const [stats, approvedCount, videoCount, categoriesRaw, productsRaw, entriesRaw, entriesTotal] =
    await Promise.all([
      prisma.brandStats.findFirst().catch(() => null),
      prisma.guestbookEntry.count({ where: { isApproved: true } }).catch(() => 0),
      prisma.guestbookEntry
        .count({ where: { isApproved: true, mediaType: 'VIDEO' } })
        .catch(() => 0),
      prisma.category
        .findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })
        .catch(() => []),
      prisma.product
        .findMany({
          where: { status: 'ACTIVE' },
          orderBy: { nameFr: 'asc' },
          select: { id: true, nameFr: true, nameAr: true, nameEn: true },
        })
        .catch(() => []),
      prisma.guestbookEntry
        .findMany({
          where: { isApproved: true },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: PAGE_SIZE,
          select: {
            id: true, customerName: true, customerCity: true, customerCountry: true,
            message: true, rating: true, mediaUrl: true, mediaType: true, productTag: true,
            source: true, likesCount: true, isVerifiedBuyer: true, isFeatured: true, createdAt: true,
          },
        })
        .catch(() => []),
      prisma.guestbookEntry.count({ where: { isApproved: true } }).catch(() => 0),
    ])

  const initialEntries = JSON.parse(JSON.stringify(entriesRaw)) as GuestbookEntryDTO[]
  const totalPages = Math.max(1, Math.ceil(entriesTotal / PAGE_SIZE))

  const categories: CategoryOption[] = categoriesRaw.map((c) => {
    const label = pickLocale({ fr: c.nameFr, ar: c.nameAr, en: c.nameEn }, locale)
    return { label, value: c.nameFr }
  })

  const products: ProductOption[] = productsRaw.map((p) => {
    const name = pickLocale({ fr: p.nameFr, ar: p.nameAr, en: p.nameEn }, locale)
    return { value: name, label: name }
  })

  const satisfaction = stats?.satisfactionRate ?? 100
  const googleRating = stats?.googleRating ?? 0
  const googleReviews = stats?.googleReviewsCount ?? 0
  const tiktokFollowers = stats?.tiktokFollowers ?? 0
  const tiktokLikes = stats?.tiktokLikes ?? 0
  const tiktokHandle = stats?.tiktokHandle ?? '@dardmana'

  const googleUrl = process.env.GOOGLE_REVIEWS_URL || '#'
  const googlePlaceId = process.env.GOOGLE_PLACE_ID || ''
  const googleWriteReviewUrl = googlePlaceId
    ? `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
    : ''
  // Le lien TikTok dérive du pseudo (modifiable en admin) → source unique de vérité.
  // NEXT_PUBLIC_TIKTOK_URL ne sert que de repli si aucun pseudo n'est défini.
  const tiktokSlug = tiktokHandle.trim().replace(/^@+/, '')
  const tiktokUrl = tiktokSlug
    ? `https://www.tiktok.com/@${tiktokSlug}`
    : process.env.NEXT_PUBLIC_TIKTOK_URL || '#'

  return (
    <div className="pb-24">
      {/* 1. Header */}
      <header
        className="px-4 pb-28 pt-32 text-center sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(160deg, #1a5c2a 0%, #0f3a1a 100%)' }}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-[var(--or-clair)]">
          {t('eyebrow')}
        </p>
        <h1 className="font-titre text-4xl text-[var(--creme)] sm:text-5xl lg:text-6xl">
          {t('titleLead')}{' '}
          <em className="italic text-[var(--or-royal)]">{t('titleHighlight')}</em>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--creme)]/85">
          {t('description')}
        </p>

        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {[
            { value: `${Math.round(satisfaction)}%`, label: t('statSatisfied') },
            { value: compact(approvedCount, locale), label: t('statTestimonials') },
            { value: googleRating ? googleRating.toFixed(1) : '—', label: t('statRating') },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-titre text-4xl text-[var(--or-clair)]">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--creme)]/70">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* 2. Barre CTA flottante */}
        <div className="-mt-12 flex flex-col items-center justify-between gap-4 rounded-[14px] bg-[var(--blanc)] px-6 py-5 shadow-[0_18px_50px_-18px_rgba(20,19,15,0.4)] sm:flex-row">
          <p className="text-center font-titre text-lg text-[var(--vert-fonce)] sm:text-start">
            {t('ctaText')}
          </p>
          <a
            href="#temoigner"
            className="shrink-0 whitespace-nowrap bg-[var(--or-royal)] px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--noir)] transition-colors hover:bg-[var(--or-clair)]"
          >
            {t('ctaButton')}
          </a>
        </div>

        {/* 3. Bandeau Google */}
        {googleReviews > 0 && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-[var(--bordure)] bg-[var(--blanc)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gris-perle)] font-titre text-lg font-bold text-[#4285F4]">
                G
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--texte)]">
                  <span className="text-[var(--or-royal)]">★★★★★</span>{' '}
                  {t('googleScore', { rating: googleRating ? googleRating.toFixed(1) : '0' })}
                </p>
                <p className="text-xs text-[var(--texte-doux)]">
                  {t('googleReviews', { count: googleReviews })}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {googleWriteReviewUrl && (
                <a
                  href={googleWriteReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap border border-[var(--vert-fonce)] px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
                >
                  {t('googleWriteReview')}
                </a>
              )}
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] hover:text-[var(--or-royal)]"
              >
                {t('see')} →
              </a>
            </div>
          </div>
        )}

        {/* 4. Bandeau TikTok */}
        {tiktokFollowers > 0 && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-[var(--bordure)] bg-[var(--blanc)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#14130f] text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16 3v3.2a4.8 4.8 0 003.6 1.6V11a8 8 0 01-3.6-.9V15a5.5 5.5 0 11-5.5-5.5c.3 0 .6 0 .9.1v3.1a2.5 2.5 0 102 2.4V3h2.6z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--texte)]">{tiktokHandle}</p>
                <p className="text-xs text-[var(--texte-doux)]">
                  {t('tiktokStats', {
                    followers: compact(tiktokFollowers, locale),
                    likes: compact(tiktokLikes, locale),
                  })}
                </p>
              </div>
            </div>
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] hover:text-[var(--or-royal)]"
            >
              {t('tiktokCta')} →
            </a>
          </div>
        )}

        {/* 5 + 6 + 7. Feed */}
        <div className="mt-12">
          <GuestbookFeed
            initialEntries={initialEntries}
            initialTotalPages={totalPages}
            categories={categories}
            hasVideos={videoCount > 0}
            locale={locale}
          />
        </div>

        {/* 8. Formulaire */}
        <section id="temoigner" className="mt-20 scroll-mt-28">
          <div className="mb-8 text-center">
            <h2 className="font-titre text-3xl text-[var(--vert-fonce)]">{t('formTitle')}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--texte-doux)]">
              {t('formSubtitle')}
            </p>
          </div>
          <div className="mx-auto max-w-2xl border border-[var(--bordure)] bg-[var(--blanc)] p-6 sm:p-8">
            <GuestbookForm products={products} />
          </div>
        </section>
      </div>
    </div>
  )
}
