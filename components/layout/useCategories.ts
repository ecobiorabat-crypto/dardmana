'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/i18n/routing'

export interface NavCategory {
  id: string
  slug: string
  nameFr: string
  nameAr: string
  nameEn: string
  icon: string | null
  count: number
}

interface ApiCategory {
  id: string
  slug: string
  nameFr: string
  nameAr: string
  nameEn: string
  icon: string | null
  _count?: { products?: number }
}

// Cache module-level : une seule requête /api/categories partagée par la Navbar
// et le MobileMenu (les catégories changent rarement).
let cache: NavCategory[] | null = null
let inflight: Promise<NavCategory[]> | null = null

function load(): Promise<NavCategory[]> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        const list: ApiCategory[] = Array.isArray(d.categories) ? d.categories : []
        cache = list.map((c) => ({
          id: c.id,
          slug: c.slug,
          nameFr: c.nameFr,
          nameAr: c.nameAr,
          nameEn: c.nameEn,
          icon: c.icon ?? null,
          count: c._count?.products ?? 0,
        }))
        return cache
      })
      .catch(() => {
        cache = []
        return cache
      })
  }
  return inflight
}

/** Catégories actives (l'API filtre déjà isActive:true), avec compte produits. */
export function useCategories(): NavCategory[] {
  const [categories, setCategories] = useState<NavCategory[]>(cache ?? [])
  useEffect(() => {
    let active = true
    load().then((c) => active && setCategories(c))
    return () => {
      active = false
    }
  }, [])
  return categories
}

/** Nom localisé d'une catégorie selon la locale active. */
export function categoryName(c: NavCategory, locale: Locale): string {
  return locale === 'ar' ? c.nameAr : locale === 'en' ? c.nameEn : c.nameFr
}
