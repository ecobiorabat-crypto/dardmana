'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { PromoCodeInput } from '@/components/cart/PromoCodeInput'
import { useHydrated } from '@/components/layout/hooks'
import { formatMad } from '@/lib/utils/price'
import { localizedHref, useCurrentLocale } from './nav'
import { cn } from '@/lib/utils/cn'

function QtyButton({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center border border-[var(--bordure)]',
        'text-[var(--texte)] transition-colors duration-150 hover:border-[var(--or-royal)]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
      )}
    >
      {children}
    </button>
  )
}

export function CartDrawer() {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const appliedPromo = useCartStore((s) => s.appliedPromo)
  const hydrated = useHydrated()

  const subtotal = items.reduce((sum, i) => sum + i.priceMad * i.quantity, 0)
  const discount = hydrated ? (appliedPromo?.discount ?? 0) : 0
  const total = Math.max(0, subtotal - discount)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      position="right"
      title={count > 0 ? t('Cart.count', { count }) : t('Nav.cart')}
      className="flex flex-col"
    >
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[var(--texte-doux)]">
            <path d="M6 6h15l-1.5 9h-12L5 3H2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="20" r="1.4" fill="currentColor" />
            <circle cx="18" cy="20" r="1.4" fill="currentColor" />
          </svg>
          <p className="text-sm text-[var(--texte-doux)]">{t('Cart.empty')}</p>
          <Button href={localizedHref(locale, '/collections')} variant="outline" size="md" onClick={closeCart}>
            {t('Cart.discoverCatalogue')}
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <ul className="flex-1 divide-y divide-[var(--bordure)]">
            {items.map((item) => {
              const key = item.variantId ? `${item.productId}__${item.variantId}` : item.productId
              return (
                <li key={key} className="flex gap-4 py-4">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-[var(--texte)]">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        aria-label={`${t('Cart.remove')} — ${item.name}`}
                        className="text-[var(--texte-doux)] transition-colors hover:text-[var(--erreur)]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    <p className="mt-1 text-sm text-[var(--or-royal)]">{formatMad(item.priceMad)}</p>

                    <div className="mt-auto flex items-center gap-3 pt-2">
                      <QtyButton
                        label={t('Cart.decrease')}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </QtyButton>
                      <span className="min-w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                      <QtyButton
                        label={t('Cart.increase')}
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </QtyButton>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="border-t border-[var(--bordure)] pt-4">
            {/* Code promo — saisissable directement dans le panier latéral. */}
            <div className="mb-4">
              <PromoCodeInput subtotal={subtotal} />
            </div>

            {discount > 0 && (
              <div className="mb-2 flex items-center justify-between text-sm text-[var(--vert-moyen)]">
                <span>{t('Cart.discount')}</span>
                <span>−{formatMad(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.14em] text-[var(--texte-doux)]">{t('Cart.total')}</span>
              <span className="font-titre text-2xl text-[var(--vert-fonce)]">{formatMad(total)}</span>
            </div>
            <Button
              href={localizedHref(locale, '/checkout')}
              variant="dark"
              size="lg"
              fullWidth
              onClick={closeCart}
              className="mt-4"
            >
              {t('Cart.checkout')}
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  )
}

export default CartDrawer
