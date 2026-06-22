'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useUiStore } from '@/store/ui'
import { RatingStars } from '@/components/ui/RatingStars'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ImageGallery } from '@/components/product/ImageGallery'
import { VariantSelector } from '@/components/product/VariantSelector'
import { StockIndicator } from '@/components/product/StockIndicator'
import { formatMad, formatEur, madToEur } from '@/lib/utils/price'
import { pickLocale } from '@/lib/utils/product'
import { useHydrated } from '@/components/layout/hooks'
import { trackViewProduct } from '@/lib/analytics/events'
import { cn } from '@/lib/utils/cn'

export interface ProductVariantData {
  id: string
  nameFr: string
  nameAr: string
  nameEn: string
  priceMad: number | string
  stock: number
}

export interface ProductDetailData {
  id: string
  slug: string
  nameFr: string
  nameAr: string
  nameEn: string
  descriptionFr: string
  descriptionAr: string
  descriptionEn: string
  shortDescFr: string | null
  shortDescAr: string | null
  shortDescEn: string | null
  materialFr: string | null
  materialAr: string | null
  materialEn: string | null
  priceMad: number | string
  priceEur: number | string | null
  comparePriceMad: number | string | null
  images: string[]
  stock: number
  lowStockThreshold: number
  ratingAvg: number
  ratingCount: number
  isNew: boolean
  isFeatured: boolean
  variants: ProductVariantData[]
}

const GUARANTEES = [
  { key: 'Products.guaranteeAuthentic', icon: 'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z' },
  { key: 'Trust.delivery', icon: 'M3 7h11v8H3zM14 10h4l3 3v2h-7z' },
  { key: 'Products.guaranteeReturns', icon: 'M9 14l-4-4 4-4M5 10h9a5 5 0 015 5v1' },
] as const

export function ProductDetail({
  product,
  locale,
}: {
  product: ProductDetailData
  locale: string
}) {
  const t = useTranslations()
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const inWishlist = useWishlistStore((s) => s.items.includes(product.id))
  const showToast = useUiStore((s) => s.showToast)
  const hydrated = useHydrated()

  const [variantId, setVariantId] = useState<string | undefined>(
    product.variants[0]?.id,
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [tab, setTab] = useState<'description' | 'composition' | 'livraison'>('description')

  const name = pickLocale({ fr: product.nameFr, ar: product.nameAr, en: product.nameEn }, locale)
  const shortDesc = pickLocale(
    { fr: product.shortDescFr ?? '', ar: product.shortDescAr, en: product.shortDescEn },
    locale,
  )
  const description = pickLocale(
    { fr: product.descriptionFr, ar: product.descriptionAr, en: product.descriptionEn },
    locale,
  )
  const material = pickLocale(
    { fr: product.materialFr ?? '', ar: product.materialAr, en: product.materialEn },
    locale,
  )

  const selectedVariant = product.variants.find((v) => v.id === variantId)
  const price = Number(selectedVariant?.priceMad ?? product.priceMad)
  const stock = selectedVariant?.stock ?? product.stock
  const compare = product.comparePriceMad != null ? Number(product.comparePriceMad) : null
  const hasDiscount = compare != null && compare > price
  const priceEur = product.priceEur != null ? Number(product.priceEur) : madToEur(price)
  const outOfStock = stock <= 0

  // Événement analytics « voir produit » — une fois par produit affiché.
  useEffect(() => {
    trackViewProduct({ id: product.id, name, price: Number(product.priceMad) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  // Valeur déterministe dérivée de l'ID (stable SSR/CSR, simule un "live count")
  const watchingCount = useMemo(() => {
    let h = 0
    for (let i = 0; i < product.id.length; i++) {
      h = (h * 31 + product.id.charCodeAt(i)) >>> 0
    }
    return 6 + (h % 18)
  }, [product.id])

  const handleAdd = () => {
    if (outOfStock) return
    addItem({
      productId: product.id,
      variantId,
      name: selectedVariant
        ? `${name} — ${pickLocale({ fr: selectedVariant.nameFr, ar: selectedVariant.nameAr, en: selectedVariant.nameEn }, locale)}`
        : name,
      image: product.images[0] ?? '',
      priceMad: price,
      quantity,
    })
    setAdded(true)
    showToast(t('Products.addedToCart'), 'success')
    openCart()
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[55fr_45fr] lg:gap-14">
      {/* Galerie */}
      <ImageGallery images={product.images} alt={`${name} — Dar Dmana`} />

      {/* Infos */}
      <div className="lg:py-2">
        <div className="flex flex-wrap gap-1.5">
          {product.isNew && <Badge variant="new" />}
          {product.isFeatured && <Badge variant="bestseller" />}
          {hasDiscount && <Badge variant="sale" />}
          {outOfStock && <Badge variant="outofstock" />}
        </div>

        <h1 className="mt-3 font-titre text-3xl leading-tight text-[var(--texte)] sm:text-4xl">
          {name}
        </h1>

        {product.ratingCount > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <RatingStars rating={product.ratingAvg} size="sm" />
            <a href="#avis" className="text-xs text-[var(--texte-doux)] underline-offset-2 hover:underline">
              ({t('Products.reviewsCount', { count: product.ratingCount })})
            </a>
          </div>
        )}

        <div className="mt-5 flex items-end gap-3">
          <span className="font-titre text-3xl text-[var(--vert-fonce)]">
            {formatMad(price)}
          </span>
          {hasDiscount && (
            <span className="text-base text-[var(--texte-doux)] line-through">{formatMad(compare!)}</span>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--texte-doux)]">≈ {formatEur(priceEur)} {t('Products.forInternational')}</p>

        {shortDesc && (
          <p className="mt-5 text-sm leading-relaxed text-[var(--texte-doux)]">{shortDesc}</p>
        )}

        {/* Variantes */}
        <VariantSelector
          className="mt-6"
          variants={product.variants}
          value={variantId}
          onChange={setVariantId}
          locale={locale}
        />

        {/* Stock */}
        {!outOfStock && <StockIndicator className="mt-6" stock={stock} threshold={10} />}

        {/* Quantité + actions */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center border border-[var(--bordure)]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label={t('Cart.decrease')}
              className="flex h-11 w-11 items-center justify-center text-[var(--texte)] hover:text-[var(--vert-fonce)]"
            >
              −
            </button>
            <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(stock || 99, q + 1))}
              aria-label={t('Cart.increase')}
              className="flex h-11 w-11 items-center justify-center text-[var(--texte)] hover:text-[var(--vert-fonce)]"
            >
              +
            </button>
          </div>
          <span className="text-xs text-[var(--texte-doux)]">
            {outOfStock ? t('Products.unavailable') : t('Products.inStockCount', { count: stock })}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button variant="gold" size="lg" fullWidth disabled={outOfStock} onClick={handleAdd}>
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="inline-flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t('Products.added')}
                </motion.span>
              ) : (
                <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {outOfStock ? t('Products.unavailable') : t('Common.addToCart')}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              toggleWishlist(product.id)
              showToast(inWishlist ? t('Products.removedFromWishlist') : t('Products.addedToWishlist'), 'info')
            }}
            aria-pressed={inWishlist}
          >
            {inWishlist ? `♥ ${t('Products.favorited')}` : `♡ ${t('Products.wishlist')}`}
          </Button>
        </div>

        {/* Social proof */}
        {hydrated && (
          <p className="mt-4 flex items-center gap-2 text-xs text-[var(--texte-doux)]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--vert-moyen)]" />
            {t('Products.watching', { count: watchingCount })}
          </p>
        )}

        {/* Garanties */}
        <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[var(--bordure)] pt-6">
          {GUARANTEES.map((g) => (
            <div key={g.key} className="flex flex-col items-center gap-2 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[var(--vert-fonce)]">
                <path d={g.icon} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[0.7rem] leading-tight text-[var(--texte-doux)]">{t(g.key)}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-10">
          <div className="flex gap-6 border-b border-[var(--bordure)]">
            {([
              ['description', 'Products.description'],
              ['composition', 'Products.composition'],
              ['livraison', 'Products.shippingInfo'],
            ] as const).map(([key, labelKey]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'relative pb-3 text-xs font-medium uppercase tracking-[0.12em] transition-colors',
                  tab === key ? 'text-[var(--vert-fonce)]' : 'text-[var(--texte-doux)] hover:text-[var(--texte)]',
                )}
              >
                {t(labelKey)}
                {tab === key && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--or-royal)]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="py-5 text-sm leading-relaxed text-[var(--texte-doux)]">
            {tab === 'description' && (
              <div dangerouslySetInnerHTML={{ __html: description }} />
            )}
            {tab === 'composition' && (
              <p>{material || t('Products.compositionOnRequest')}</p>
            )}
            {tab === 'livraison' && (
              <ul className="space-y-2">
                <li>{t('Products.shippingDomestic')}</li>
                <li>{t('Products.shippingInternational')}</li>
                <li>{t('Products.returnsPolicy')}</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
