'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/ui/Reveal'
import { Skeleton } from '@/components/ui/Skeleton'
import { pickLocale } from '@/lib/utils/product'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'
import { cn } from '@/lib/utils/cn'

interface Category {
  id: string
  slug: string
  nameFr: string
  nameAr: string | null
  nameEn: string | null
  imageUrl: string | null
  _count?: { products: number }
}

export function CategoriesGrid() {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const [categories, setCategories] = useState<Category[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/categories', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setCategories((d.categories ?? []).slice(0, 6)))
      .catch(() => setCategories([]))
    return () => controller.abort()
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <Reveal>
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
            {t('Categories.explore')}
          </p>
          <h2 className="font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">
            {t('Categories.title')}
          </h2>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="image" className="aspect-[4/5]" />
            ))
          : categories.map((cat, i) => {
              const name = pickLocale({ fr: cat.nameFr, ar: cat.nameAr, en: cat.nameEn }, locale)
              return (
                <Reveal key={cat.id} delay={i * 0.05}>
                  <Link
                    href={localizedHref(locale, `/catalogue/${cat.slug}`)}
                    className="group relative block aspect-[4/5] overflow-hidden bg-[var(--gris-perle)]"
                  >
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[var(--vert-fonce)] to-[var(--vert-moyen)]" />
                    )}

                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-t from-[rgba(20,19,15,0.7)] via-transparent to-transparent',
                        'transition-opacity duration-300 group-hover:from-[rgba(20,19,15,0.82)]',
                      )}
                    />

                    <div className="absolute inset-x-0 bottom-0 p-6 transition-transform duration-300 ease-out group-hover:-translate-y-1">
                      <h3 className="font-titre text-2xl text-[var(--creme)]">{name}</h3>
                      {cat._count && (
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--or-clair)]">
                          {cat._count.products} {t('Categories.products')}
                        </p>
                      )}
                    </div>
                  </Link>
                </Reveal>
              )
            })}
      </div>
    </section>
  )
}

export default CategoriesGrid
