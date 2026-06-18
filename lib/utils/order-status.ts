export type OrderStatusKey =
  | 'NEW'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

interface StatusMeta {
  label: string
  color: string
}

export const ORDER_STATUS: Record<OrderStatusKey, StatusMeta> = {
  NEW: { label: 'Nouvelle', color: 'var(--texte-doux)' },
  CONFIRMED: { label: 'Confirmée', color: 'var(--vert-moyen)' },
  PROCESSING: { label: 'En préparation', color: 'var(--alerte)' },
  SHIPPED: { label: 'Expédiée', color: 'var(--vert-moyen)' },
  DELIVERED: { label: 'Livrée', color: 'var(--vert-fonce)' },
  CANCELLED: { label: 'Annulée', color: 'var(--erreur)' },
  REFUNDED: { label: 'Remboursée', color: 'var(--erreur)' },
}

export function orderStatusMeta(status: string): StatusMeta {
  return ORDER_STATUS[status as OrderStatusKey] ?? { label: status, color: 'var(--texte-doux)' }
}

const CARRIER_TRACKING: Record<string, string> = {
  Amana: 'https://www.poste.ma/particuliers/suivi-de-courrier',
  DHL: 'https://www.dhl.com/fr-fr/home/tracking.html',
}

export function trackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null
  for (const [key, url] of Object.entries(CARRIER_TRACKING)) {
    if (carrier.toLowerCase().includes(key.toLowerCase())) return url
  }
  return null
}
