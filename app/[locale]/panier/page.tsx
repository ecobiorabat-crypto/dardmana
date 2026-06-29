'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import { useUiStore } from '@/store/ui'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/Button'
import { PromoCodeInput } from '@/components/cart/PromoCodeInput'
import { useHydrated } from '@/components/layout/hooks'
import { formatMad } from '@/lib/utils/price'
import { getShippingMethods, getFreeShippingThreshold } from '@/lib/utils/shipping'
import { productName, type ProductCardData } from '@/lib/utils/product'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'
import { cn } from '@/lib/utils/cn'

/** Catégorie la plus fréquente parmi les items du panier. */
function mostFrequent(arr: string[]): string {
  if (arr.length === 0) return ''
  const counts = new Map<string, number>()
  let best = arr[0]
  let bestN = 0
  for (const v of arr) {
    const n = (counts.get(v) ?? 0) + 1
    counts.set(v, n)
    if (n > bestN) {
      bestN = n
      best = v
    }
  }
  return best
}

type ByIdsProduct = ProductCardData & { category?: { slug: string } | null }

export default function CartPage() {
  const t = useTranslations()
  const locale = useCurrentLocale()
  const hydrated = useHydrated()
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const addItem = useCartStore((s) => s.addItem)
  const appliedPromo = useCartStore((s) => s.appliedPromo)
  const showToast = useUiStore((s) => s.showToast)

  const [suggested, setSuggested] = useState<ProductCardData[]>([])
  const [complementary, setComplementary] = useState<ProductCardData[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/products?isFeatured=true&limit=4', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setSuggested(d.products ?? []))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  // « Complète ton look » : produits de la même catégorie que le panier,
  // sinon best-sellers. Recalculé quand la composition du panier change.
  const cartIdsKey = items.map((i) => i.productId).join(',')
  useEffect(() => {
    if (!hydrated) return
    const controller = new AbortController()
    const ids = cartIdsKey ? cartIdsKey.split(',') : []

    async function load() {
      try {
        let categorySlug = ''
        if (ids.length > 0) {
          const res = await fetch('/api/products/by-ids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
            signal: controller.signal,
          })
          const data = await res.json()
          const slugs: string[] = (data.products ?? [])
            .map((p: ByIdsProduct) => p.category?.slug)
            .filter((s: string | undefined): s is string => Boolean(s))
          categorySlug = mostFrequent(slugs)
        }

        const inCart = new Set(ids)
        const primaryUrl = categorySlug
          ? `/api/products?categorySlug=${encodeURIComponent(categorySlug)}&limit=8`
          : '/api/products?sortBy=salesCount&sortOrder=desc&limit=8'
        const res2 = await fetch(primaryUrl, { signal: controller.signal })
        const data2 = await res2.json()
        let list: ProductCardData[] = (data2.products ?? []).filter(
          (p: ProductCardData) => !inCart.has(p.id),
        )

        // Complète avec des best-sellers si la catégorie ne suffit pas.
        if (list.length < 3 && categorySlug) {
          const res3 = await fetch('/api/products?sortBy=salesCount&sortOrder=desc&limit=8', {
            signal: controller.signal,
          })
          const data3 = await res3.json()
          const extra: ProductCardData[] = (data3.products ?? []).filter(
            (p: ProductCardData) => !inCart.has(p.id) && !list.some((x) => x.id === p.id),
          )
          list = [...list, ...extra]
        }

        setComplementary(list.slice(0, 3))
      } catch {
        /* ignore */
      }
    }

    void load()
    return () => controller.abort()
  }, [hydrated, cartIdsKey])

  const quickAdd = (p: ProductCardData) => {
    addItem({
      productId: p.id,
      name: productName(p, locale),
      image: p.images?.[0] ?? '',
      priceMad: Number(p.priceMad),
      quantity: 1,
    })
    showToast(t('Products.addedToCart'), 'success')
  }

  const subtotal = items.reduce((sum, i) => sum + i.priceMad * i.quantity, 0)
  const discount = appliedPromo?.discount ?? 0
  const afterDiscount = Math.max(0, subtotal - discount)
  const shipping = getShippingMethods('MA', afterDiscount)[0]
  const shippingCost = shipping?.priceMad ?? 0
  const total = afterDiscount + shippingCost
  const freeThreshold = getFreeShippingThreshold('MA') ?? 0
  const remainingForFree = Math.max(0, freeThreshold - afterDiscount)

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-4 pt-40 pb-24 text-center">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[var(--texte-doux)]">
          <path d="M6 6h15l-1.5 9h-12L5 3H2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="20" r="1.4" fill="currentColor" />
          <circle cx="18" cy="20" r="1.4" fill="currentColor" />
        </svg>
        <h1 className="font-titre text-3xl text-[var(--vert-fonce)]">
          {t('Cart.empty')}
        </h1>
        <p className="max-w-sm text-sm text-[var(--texte-doux)]">
          {t('Cart.emptyText')}
        </p>
        <Button href={localizedHref(locale, '/catalogue')} variant="gold" size="lg">
          {t('Cart.discoverCatalogue')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      <h1 className="mb-10 font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">
        {t('Cart.title')}
      </h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div>
          <ul className="divide-y divide-[var(--bordure)] border-y border-[var(--bordure)]">
            {(hydrated ? items : []).map((item) => {
              const key = item.variantId ? `${item.productId}__${item.variantId}` : item.productId
              return (
                <li key={key} className="flex gap-4 py-6">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-[var(--texte)]">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        aria-label={`${t('Cart.remove')} ${item.name}`}
                        className="-me-2 inline-flex h-11 w-11 shrink-0 items-center justify-center text-[var(--texte-doux)] transition-colors hover:text-[var(--erreur)]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-[var(--or-royal)]">{formatMad(item.priceMad)}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-[var(--bordure)]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          aria-label={t('Cart.decrease')}
                          className="flex h-11 w-11 items-center justify-center hover:text-[var(--vert-fonce)]"
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          aria-label={t('Cart.increase')}
                          className="flex h-11 w-11 items-center justify-center hover:text-[var(--vert-fonce)]"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-medium text-[var(--texte)]">
                        {formatMad(item.priceMad * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Résumé */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-[var(--bordure)] bg-[var(--creme)] p-6">
            <h2 className="font-titre text-xl text-[var(--vert-fonce)]">{t('Cart.summary')}</h2>

            {remainingForFree > 0 && (
              <p className="mt-3 text-xs text-[var(--texte-doux)]">
                {t.rich('Cart.freeShippingRemaining', {
                  amount: formatMad(remainingForFree),
                  highlight: (chunks) => (
                    <span className="text-[var(--vert-fonce)]">{chunks}</span>
                  ),
                })}
              </p>
            )}

            {/* Code promo */}
            <div className="mt-5">
              <PromoCodeInput subtotal={subtotal} />
            </div>

            <dl className="mt-6 space-y-3 border-t border-[var(--bordure)] pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--texte-doux)]">{t('Cart.subtotal')}</dt>
                <dd>{formatMad(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[var(--vert-moyen)]">
                  <dt>{t('Cart.discount')}</dt>
                  <dd>−{formatMad(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[var(--texte-doux)]">{t('Cart.shipping')}</dt>
                <dd>{shippingCost === 0 ? t('Common.free') : formatMad(shippingCost)}</dd>
              </div>
              <div className="flex justify-between border-t border-[var(--bordure)] pt-3 text-base">
                <dt className="font-medium">{t('Cart.total')}</dt>
                <dd className="font-titre text-xl text-[var(--vert-fonce)]">{formatMad(total)}</dd>
              </div>
            </dl>

            <Button
              href={localizedHref(locale, '/checkout')}
              variant="dark"
              size="lg"
              fullWidth
              className="mt-6"
            >
              {t('Cart.checkout')}
            </Button>
          </div>
        </aside>
      </div>

      {/* Complète ton look */}
      {complementary.length > 0 && (
        <section className="mt-16 border-t border-[var(--bordure)] pt-10">
          <h2 className="mb-6 font-titre text-2xl text-[var(--vert-fonce)] sm:text-3xl">
            {t('Cart.completeLook')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {complementary.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 border border-[var(--bordure)] p-3"
              >
                <Link
                  href={localizedHref(locale, `/produit/${p.slug}`)}
                  className="relative h-16 w-14 shrink-0 overflow-hidden bg-[var(--gris-perle)]"
                >
                  {p.images?.[0] && (
                    <Image src={p.images[0]} alt={productName(p, locale)} fill sizes="56px" className="object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={localizedHref(locale, `/produit/${p.slug}`)}
                    className="block truncate text-sm font-medium text-[var(--texte)] transition-colors hover:text-[var(--vert-fonce)]"
                  >
                    {productName(p, locale)}
                  </Link>
                  <p className="mt-0.5 text-sm text-[var(--or-royal)]">{formatMad(Number(p.priceMad))}</p>
                </div>
                <button
                  type="button"
                  onClick={() => quickAdd(p)}
                  className="shrink-0 whitespace-nowrap border border-[var(--vert-fonce)] px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
                >
                  {t('Cart.quickAdd')}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggested.length > 0 && (
        <section className={cn('mt-20 border-t border-[var(--bordure)] pt-12')}>
          <h2 className="mb-8 font-titre text-2xl text-[var(--vert-fonce)] sm:text-3xl">
            {t('Products.similar')}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {suggested.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
