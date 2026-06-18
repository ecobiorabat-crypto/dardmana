export interface ShippingOption {
  id: string
  label: string
  carrier: string
  priceMad: number
  estimatedDays: string
  isFree: boolean
}

export const SHIPPING_RULES = {
  MA: {
    standard: { priceMad: 25, days: '48-72h' },
    express: { priceMad: 50, days: '24h' },
    freeThreshold: 500,
  },
  EU: {
    standard: { priceEur: 12, days: '7-10j' },
    express: { priceEur: 25, days: '3-5j' },
    freeThreshold: 150,
  },
  WORLD: {
    standard: { priceEur: 20, days: '10-20j' },
    freeThreshold: 200,
  },
} as const

export const EU_COUNTRIES = [
  'FR', 'BE', 'CH', 'LU', 'DE', 'ES', 'IT', 'NL', 'PT', 'AT',
  'PL', 'SE', 'DK', 'FI', 'NO', 'IE', 'GR', 'CZ', 'HU', 'RO',
]

export const PAYMENT_METHODS_BY_COUNTRY: Record<string, string[]> = {
  MA: ['COD', 'CMI'],
  EU: ['STRIPE'],
  DEFAULT: ['STRIPE', 'PAYPAL'],
}

const EUR_TO_MAD = 10.72

function eurToMad(eur: number): number {
  return Math.ceil(eur * EUR_TO_MAD)
}

function getRegion(country: string): 'MA' | 'EU' | 'WORLD' {
  if (country === 'MA') return 'MA'
  if (EU_COUNTRIES.includes(country)) return 'EU'
  return 'WORLD'
}

export function getPaymentMethods(country: string): string[] {
  if (country === 'MA') return PAYMENT_METHODS_BY_COUNTRY.MA
  if (EU_COUNTRIES.includes(country)) return PAYMENT_METHODS_BY_COUNTRY.EU
  return PAYMENT_METHODS_BY_COUNTRY.DEFAULT
}

export function getShippingMethods(country: string, subtotalMad = 0): ShippingOption[] {
  const region = getRegion(country)

  if (region === 'MA') {
    const rules = SHIPPING_RULES.MA
    const stdFree = subtotalMad >= rules.freeThreshold
    return [
      {
        id: 'ma-standard',
        label: 'Livraison Standard',
        carrier: 'Amana',
        priceMad: stdFree ? 0 : rules.standard.priceMad,
        estimatedDays: rules.standard.days,
        isFree: stdFree,
      },
      {
        id: 'ma-express',
        label: 'Livraison Express',
        carrier: 'Amana Express',
        priceMad: rules.express.priceMad,
        estimatedDays: rules.express.days,
        isFree: false,
      },
    ]
  }

  if (region === 'EU') {
    const rules = SHIPPING_RULES.EU
    const stdFree = subtotalMad >= eurToMad(rules.freeThreshold)
    return [
      {
        id: 'eu-standard',
        label: 'Livraison Internationale Standard',
        carrier: 'La Poste / DHL',
        priceMad: stdFree ? 0 : eurToMad(rules.standard.priceEur),
        estimatedDays: rules.standard.days,
        isFree: stdFree,
      },
      {
        id: 'eu-express',
        label: 'Livraison Internationale Express',
        carrier: 'DHL Express',
        priceMad: eurToMad(rules.express.priceEur),
        estimatedDays: rules.express.days,
        isFree: false,
      },
    ]
  }

  const rules = SHIPPING_RULES.WORLD
  const stdFree = subtotalMad >= eurToMad(rules.freeThreshold)
  return [
    {
      id: 'world-standard',
      label: 'Livraison Internationale',
      carrier: 'DHL / La Poste',
      priceMad: stdFree ? 0 : eurToMad(rules.standard.priceEur),
      estimatedDays: rules.standard.days,
      isFree: stdFree,
    },
  ]
}

export function getFreeShippingThreshold(country: string): number | null {
  const region = getRegion(country)
  if (region === 'MA') return SHIPPING_RULES.MA.freeThreshold
  if (region === 'EU') return eurToMad(SHIPPING_RULES.EU.freeThreshold)
  return eurToMad(SHIPPING_RULES.WORLD.freeThreshold)
}
