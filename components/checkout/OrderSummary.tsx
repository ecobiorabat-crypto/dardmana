'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { formatMad } from '@/lib/utils/price'
import { cn } from '@/lib/utils/cn'

export interface OrderSummaryItem {
  productId: string
  variantId?: string
  name: string
  image: string
  priceMad: number
  quantity: number
}

export interface OrderSummaryProps {
  items: OrderSummaryItem[]
  subtotal: number
  shippingCost: number
  total: number
  discount?: number
  title?: string
  className?: string
}

/** Récapitulatif de commande réutilisable (panier latéral, checkout). */
export function OrderSummary({
  items,
  subtotal,
  shippingCost,
  total,
  discount = 0,
  title,
  className,
}: OrderSummaryProps) {
  const t = useTranslations()
  return (
    <div className={cn('border border-[var(--bordure)] bg-[var(--creme)] p-6', className)}>
      <h2 className="font-titre text-xl text-[var(--vert-fonce)]">{title ?? t('Checkout.yourOrder')}</h2>

      <ul className="mt-4 space-y-3">
        {items.map((i) => {
          const key = i.variantId ? `${i.productId}__${i.variantId}` : i.productId
          return (
            <li key={key} className="flex items-center gap-3">
              <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
                {i.image ? (
                  <Image
                    src={i.image}
                    alt={i.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--texte)]">{i.name}</p>
                <p className="text-xs text-[var(--texte-doux)]">× {i.quantity}</p>
              </div>
              <span className="text-sm">{formatMad(i.priceMad * i.quantity)}</span>
            </li>
          )
        })}
      </ul>

      <dl className="mt-5 space-y-2 border-t border-[var(--bordure)] pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-[var(--texte-doux)]">{t('Cart.subtotal')}</dt>
          <dd>{formatMad(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-[var(--texte-doux)]">{t('Cart.discount')}</dt>
            <dd className="text-[var(--vert-moyen)]">− {formatMad(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-[var(--texte-doux)]">{t('Cart.shipping')}</dt>
          <dd>{shippingCost === 0 ? t('Common.offered') : formatMad(shippingCost)}</dd>
        </div>
        <div className="flex justify-between border-t border-[var(--bordure)] pt-2 text-base">
          <dt className="font-medium">{t('Cart.total')}</dt>
          <dd className="font-titre text-xl text-[var(--vert-fonce)]">{formatMad(total)}</dd>
        </div>
      </dl>
    </div>
  )
}

export default OrderSummary
