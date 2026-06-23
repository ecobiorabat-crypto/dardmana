// Contrat générique d'un transporteur. Tout nouveau provider (Amana, CTM,
// Aramex, agrégateur…) n'a qu'à implémenter cette interface.

export interface DeliveryPayload {
  orderNumber: string
  customerName: string
  customerPhone: string
  address: string
  city: string
  country: string
  items: {
    name: string
    quantity: number
    unitPrice: number
  }[]
  totalMad: number
  paymentMethod: string
  notes?: string
}

export interface TrackingEventData {
  status: string
  description: string
  location?: string
  occurredAt: Date
}

export interface DeliveryResult {
  trackingNumber: string
  success: boolean
}

export interface DeliveryProvider {
  /** Nom lisible, stocké dans Order.carrier. */
  name: string
  createShipment(payload: DeliveryPayload): Promise<DeliveryResult>
  getTracking(trackingNumber: string): Promise<{ status: string; events: TrackingEventData[] }>
  cancelShipment(trackingNumber: string): Promise<void>
}

/** Identifiants des providers disponibles (sélecteur admin). */
export type DeliveryProviderId = 'MANUAL' | 'AMANA' | 'CTM' | 'SENDIT'
