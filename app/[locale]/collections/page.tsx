import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import { prisma } from '@/lib/prisma'
import { localizedHref } from '@/lib/utils/locale'
import { pickLocale } from '@/lib/utils/product'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils/cn'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Collections' })
  const url = `${SITE_URL}/${locale}/collections`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/collections`

  return {
    title: t('title'),
    description: t('intro'),
    alternates: { canonical: url, languages },
    openGraph: {
      title: `${t('title')} · Dar Dmana`,
      description: t('intro'),
      url,
      siteName: 'Dar Dmana',
      type: 'website',
    },
  }
}

async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { status: 'ACTIVE' } } } },
      },
    })
  } catch {
    return []
  }
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  const categories = await getCategories()

  return (
    <div className="pt-28 pb-20 lg:pt-32">
      {/* Header / intro */}
      <header className="mx-auto mb-16 max-w-3xl px-4 text-center sm:px-6 lg:mb-24 lg:px-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
          {t('Collections.eyebrow')}
        </p>
        <h1 className="font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">
          {t('Collections.title')}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-[var(--texte-doux)]">
          {t('Collections.intro')}
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="px-4 py-24 text-center text-sm text-[var(--texte-doux)]">
          {t('Collections.noCategories')}
        </p>
      ) : (
        <div className="mx-auto flex max-w-7xl flex-col gap-20 px-4 sm:px-6 lg:gap-32 lg:px-8">
          {categories.map((cat, i) => {
            const name = pickLocale({ fr: cat.nameFr, ar: cat.nameAr, en: cat.nameEn }, locale)
            const description = pickLocale(
              { fr: cat.descriptionFr ?? '', ar: cat.descriptionAr, en: cat.descriptionEn },
              locale,
            )
            const reversed = i % 2 === 1
            return (
              <section
                key={cat.id}
                className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16"
              >
                {/* Image */}
                <Reveal
                  direction={reversed ? 'left' : 'right'}
                  className={cn('w-full', reversed && 'lg:order-2')}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--gris-perle)]">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[var(--vert-fonce)] via-[var(--vert-moyen)] to-[var(--vert-fonce)]">
                        <div className="flex h-full items-center justify-center">
                          <span className="font-titre text-5xl text-[var(--or-clair)]/30">
                            {name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Reveal>

                {/* Texte */}
                <Reveal
                  direction={reversed ? 'right' : 'left'}
                  className={cn(reversed && 'lg:order-1')}
                >
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
                      {t('Catalogue.collection')}
                    </p>
                    <h2 className="font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">
                      {name}
                    </h2>
                    {description && (
                      <p className="mt-5 text-base leading-relaxed text-[var(--texte-doux)]">
                        {description}
                      </p>
                    )}
                    <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--texte-doux)]">
                      {cat._count.products} {t('Collections.products')}
                    </p>
                    <div className="mt-8">
                      <Button
                        href={localizedHref(locale, `/catalogue/${cat.slug}`)}
                        variant="outline"
                        size="md"
                      >
                        {t('Collections.discover')}
                      </Button>
                    </div>
                  </div>
                </Reveal>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
