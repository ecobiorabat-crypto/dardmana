import type {
  DeliveryPayload,
  DeliveryProvider,
  DeliveryResult,
  TrackingEventData,
} from '@/lib/delivery/types'

/**
 * Provider par défaut : génère une fiche d'expédition à traiter manuellement.
 * Sert aussi de fallback pour les providers externes non configurés.
 */
export class ManualDeliveryProvider implements DeliveryProvider {
  name = 'Manual'

  async createShipment(payload: DeliveryPayload): Promise<DeliveryResult> {
    const trackingNumber = `DD-TRACK-${Date.now().toString(36).toUpperCase()}`

    console.log('[ManualDelivery] Fiche livraison:', JSON.stringify({
      trackingNumber,
      orderNumber: payload.orderNumber,
      customer: payload.customerName,
      phone: payload.customerPhone,
      address: `${payload.address}, ${payload.city} (${payload.country})`,
      items: payload.items,
      totalMad: payload.totalMad,
      paymentMethod: payload.paymentMethod,
      notes: payload.notes ?? '',
    }, null, 2))

    return { trackingNumber, success: true }
  }

  async getTracking(trackingNumber: string): Promise<{ status: string; events: TrackingEventData[] }> {
    return {
      status: 'IN_TRANSIT',
      events: [
        {
          status: 'CREATED',
          description: `Expédition manuelle créée — ${trackingNumber}`,
          occurredAt: new Date(),
        },
      ],
    }
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    console.log(`[ManualDelivery] Annulation expédition : ${trackingNumber}`)
  }
}
