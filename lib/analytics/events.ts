/**
 * Tracking analytics typé — dispatche vers Meta Pixel (window.fbq) et
 * Google Analytics 4 (window.gtag). Toutes les fonctions sont no-op côté
 * serveur ou si les scripts ne sont pas chargés (IDs absents).
 */

const CURRENCY = 'MAD'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// ─── Types d'entrée ────────────────────────────────────────────────────────────

export interface AnalyticsProduct {
  id: string
  name: string
  price: number
  category?: string
}

export interface AnalyticsCartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface AnalyticsCart {
  items: AnalyticsCartItem[]
  total: number
}

export interface AnalyticsOrder {
  orderNumber: string
  total: number
  items: AnalyticsCartItem[]
}

// ─── Dispatchers bas niveau ────────────────────────────────────────────────────

function fbq(...args: unknown[]): void {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args)
  }
}

function gtag(...args: unknown[]): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

/**
 * Pousse un événement e-commerce au format Google Tag Manager (GA4) dans le
 * dataLayer. Permet de brancher GTM sans modifier le code si GA4 est préféré.
 */
function dl(event: string, ecommerce: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  // Réinitialise l'objet ecommerce (recommandation Google) avant le nouvel event.
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({ event, ecommerce })
}

function gaItems(items: AnalyticsCartItem[]) {
  return items.map((i) => ({
    item_id: i.id,
    item_name: i.name,
    price: i.price,
    quantity: i.quantity,
  }))
}

// ─── Événements ────────────────────────────────────────────────────────────────

export function trackPageView(path?: string): void {
  fbq('track', 'PageView')
  gtag('event', 'page_view', path ? { page_path: path } : {})
}

export function trackViewProduct(product: AnalyticsProduct): void {
  fbq('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: CURRENCY,
  })
  const items = [
    { item_id: product.id, item_name: product.name, price: product.price, item_category: product.category },
  ]
  gtag('event', 'view_item', { currency: CURRENCY, value: product.price, items })
  dl('view_item', { currency: CURRENCY, value: product.price, items })
}

export function trackAddToCart(product: AnalyticsProduct, quantity: number): void {
  const value = product.price * quantity
  fbq('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value,
    currency: CURRENCY,
  })
  const items = [
    { item_id: product.id, item_name: product.name, price: product.price, quantity },
  ]
  gtag('event', 'add_to_cart', { currency: CURRENCY, value, items })
  dl('add_to_cart', { currency: CURRENCY, value, items })
}

export function trackBeginCheckout(cart: AnalyticsCart): void {
  const numItems = cart.items.reduce((sum, i) => sum + i.quantity, 0)
  fbq('track', 'InitiateCheckout', {
    content_ids: cart.items.map((i) => i.id),
    content_type: 'product',
    num_items: numItems,
    value: cart.total,
    currency: CURRENCY,
  })
  gtag('event', 'begin_checkout', {
    currency: CURRENCY,
    value: cart.total,
    items: gaItems(cart.items),
  })
  dl('begin_checkout', { currency: CURRENCY, value: cart.total, items: gaItems(cart.items) })
}

export function trackPurchase(order: AnalyticsOrder): void {
  fbq('track', 'Purchase', {
    content_ids: order.items.map((i) => i.id),
    content_type: 'product',
    num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
    value: order.total,
    currency: CURRENCY,
    order_id: order.orderNumber,
  })
  gtag('event', 'purchase', {
    transaction_id: order.orderNumber,
    currency: CURRENCY,
    value: order.total,
    items: gaItems(order.items),
  })
  dl('purchase', {
    transaction_id: order.orderNumber,
    currency: CURRENCY,
    value: order.total,
    items: gaItems(order.items),
  })
}

export function trackSearch(query: string): void {
  const term = query.trim()
  if (!term) return
  fbq('track', 'Search', { search_string: term })
  gtag('event', 'search', { search_term: term })
}
