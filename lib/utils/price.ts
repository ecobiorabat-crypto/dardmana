import type { PromoCode } from '@prisma/client'

const DEFAULT_EUR_RATE = 0.093

export function formatMad(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' MAD'
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function madToEur(amount: number, rate = DEFAULT_EUR_RATE): number {
  return Math.round(amount * rate * 100) / 100
}

export function eurToMad(amount: number, rate = DEFAULT_EUR_RATE): number {
  return Math.round((amount / rate) * 100) / 100
}

export interface ShippingMethod {
  id: string
  priceMad: number
  priceEur: number | null
  freeThresholdMad: number | null
}

export function calculateShipping(
  country: string,
  subtotalMad: number,
  method: ShippingMethod
): number {
  if (method.freeThresholdMad !== null && subtotalMad >= method.freeThresholdMad) {
    return 0
  }
  if (country === 'MA') {
    return Number(method.priceMad)
  }
  if (method.priceEur !== null) {
    return eurToMad(Number(method.priceEur))
  }
  return Number(method.priceMad)
}

export interface PromoResult {
  discount: number
  newTotal: number
  error?: string
}

export function applyPromoCode(
  subtotalMad: number,
  promo: Pick<PromoCode, 'type' | 'value' | 'minOrderMad' | 'isActive' | 'expiresAt' | 'maxUses' | 'currentUses'>
): PromoResult {
  if (!promo.isActive) {
    return { discount: 0, newTotal: subtotalMad, error: 'Code promo inactif' }
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { discount: 0, newTotal: subtotalMad, error: 'Code promo expiré' }
  }

  if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
    return { discount: 0, newTotal: subtotalMad, error: 'Code promo épuisé' }
  }

  const minOrder = Number(promo.minOrderMad)
  if (subtotalMad < minOrder) {
    return {
      discount: 0,
      newTotal: subtotalMad,
      error: `Commande minimale : ${formatMad(minOrder)}`,
    }
  }

  let discount = 0
  const value = Number(promo.value)

  if (promo.type === 'PERCENT') {
    discount = Math.round(subtotalMad * (value / 100) * 100) / 100
  } else if (promo.type === 'FIXED_MAD') {
    discount = Math.min(value, subtotalMad)
  } else if (promo.type === 'FREE_SHIPPING') {
    discount = 0
  }

  return {
    discount,
    newTotal: Math.max(0, subtotalMad - discount),
  }
}
