'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useUiStore } from '@/store/ui'
import { Badge } from '@/components/ui/Badge'
import { RatingStars } from '@/components/ui/RatingStars'
import { formatMad } from '@/lib/utils/price'
import { productName, type ProductCardData } from '@/lib/utils/product'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'
import { useHydrated } from '@/components/layout/hooks'
import { cn } from '@/lib/utils/cn'

export interface ProductCardProps {
  product: ProductCardData
  className?: string
  priority?: boolean
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const t = useTranslations()
  const locale = useCurrentLocale()
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const inWishlistRaw = useWishlistStore((s) => s.items.includes(product.id))
  const showToast = useUiStore((s) => s.showToast)
  // Garde anti-mismatch : l'état persisté n'est lu qu'après hydratation client.
  const inWishlist = useHydrated() && inWishlistRaw

  const name = productName(product, locale)
  const price = Number(product.priceMad)
  const compare = product.comparePriceMad != null ? Number(product.comparePriceMad) : null
  const hasDiscount = compare != null && compare > price
  const outOfStock = typeof product.stock === 'number' && product.stock <= 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (outOfStock) return
    addItem({
      productId: product.id,
      name,
      image: product.images?.[0] ?? '',
      priceMad: price,
      quantity: 1,
    })
    showToast(t('Products.addedToCart'), 'success')
    openCart()
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleWishlist(product.id)
    showToast(inWishlist ? t('Products.removedFromWishlist') : t('Products.addedToWishlist'), 'info')
  }

  return (
    <Link
      href={localizedHref(locale, `/produit/${product.slug}`)}
      className={cn('group block', className)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--gris-perle)]">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={`${name} — Dar Dmana`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className={cn(
              'object-cover transition-transform duration-700 ease-out',
              outOfStock ? 'opacity-70' : 'group-hover:scale-105',
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--vert-fonce)] to-[var(--vert-moyen)]">
            <span className="font-titre text-3xl text-[var(--or-clair)]/60">DD</span>
          </div>
        )}

        {/* Filigrane de marque (overlay discret, n'entrave pas l'interaction) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/watermark-overlay.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute bottom-2 end-2 w-12 select-none opacity-35"
        />

        <div className="absolute start-3 top-3 flex flex-col gap-1.5">
          {outOfStock ? (
            <Badge variant="outofstock" />
          ) : (
            <>
              {product.isNew && <Badge variant="new" />}
              {hasDiscount && <Badge variant="sale" />}
              {product.isFeatured && !product.isNew && <Badge variant="bestseller" />}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={inWishlist ? t('Products.removeFromWishlist') : t('Common.addToWishlist')}
          aria-pressed={inWishlist}
          className={cn(
            'absolute end-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full',
            'bg-[var(--creme)]/85 backdrop-blur-sm transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
            inWishlist ? 'text-[var(--erreur)]' : 'text-[var(--texte)] hover:text-[var(--erreur)]',
          )}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} aria-hidden="true">
            <path
              d="M12 20s-7-4.35-9.2-8.3C1.3 8.9 2.6 5.8 5.6 5.2c1.9-.4 3.5.6 4.4 2 .9-1.4 2.5-2.4 4.4-2 3 .6 4.3 3.7 2.8 6.5C19 15.65 12 20 12 20z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {!outOfStock && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-300 ease-out group-hover:translate-y-0">
            <button
              type="button"
              onClick={handleAdd}
              className={cn(
                'w-full bg-[var(--vert-fonce)] py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[var(--creme)]',
                'transition-colors duration-200 hover:bg-[var(--vert-moyen)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
              )}
            >
              {t('Common.addToCart')}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {typeof product.ratingAvg === 'number' && product.ratingAvg > 0 && (
          <RatingStars rating={product.ratingAvg} reviewCount={product.ratingCount} size="sm" />
        )}
        <h3 className="font-titre text-base leading-snug text-[var(--texte)] transition-colors group-hover:text-[var(--vert-fonce)]">
          {name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--vert-fonce)]">{formatMad(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-[var(--texte-doux)] line-through">{formatMad(compare!)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
