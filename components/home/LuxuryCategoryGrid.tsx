'use client'

import Image from 'next/image'
import Link from 'next/link'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'
import type { CategoryGridImages } from '@/lib/homepage'

const TILES: { key: keyof CategoryGridImages; label: string; href: string }[] = [
  { key: 'sabhah', label: 'SABHAH', href: '/catalogue' },
  { key: 'bracelets', label: 'BRACELETS', href: '/catalogue' },
  { key: 'huiles', label: 'HUILES PARFUMÉES', href: '/catalogue' },
  { key: 'pierres', label: 'PIERRES NATURELLES', href: '/catalogue' },
]

/** Grille luxe de 4 tuiles catégories (2×2 mobile, 4 colonnes desktop). */
export function LuxuryCategoryGrid({ images }: { images: CategoryGridImages }) {
  const locale = useCurrentLocale()

  return (
    <section className="bg-[var(--sable)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {TILES.map((tile, i) => {
            const img = images[tile.key]
            return (
              <Link
                key={tile.key}
                href={localizedHref(locale, tile.href)}
                className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-[var(--sable-fonce)]"
              >
                {img ? (
                  <Image
                    src={img}
                    alt={tile.label}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    priority={i === 0}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--sable-fonce)] to-[var(--sable)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--noir)]/65 via-[var(--noir)]/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                  <h3 className="font-titre text-lg tracking-wide text-[var(--creme)] sm:text-xl">{tile.label}</h3>
                  <span className="mt-2 inline-block rounded-full bg-[var(--creme)]/15 px-4 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[var(--creme)] backdrop-blur transition-colors group-hover:bg-[var(--vert-fonce)]">
                    Découvrir
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default LuxuryCategoryGrid
