import type {
  DeliveryPayload,
  DeliveryProvider,
  DeliveryResult,
  TrackingEventData,
} from '@/lib/delivery/types'
import { ManualDeliveryProvider } from '@/lib/delivery/providers/manual'

export const CTM_MISSING_KEY =
  'CTM_API_KEY manquante — voir documentation transporteur (README → Connecter un vrai transporteur)'

/**
 * Stub CTM Messagerie — prêt à connecter.
 *
 * Même contrat que les autres providers : sans clé (constructeur ou CTM_API_KEY),
 * message clair + délégation à ManualDeliveryProvider, jamais de crash.
 */
export class CTMDeliveryProvider implements DeliveryProvider {
  name = 'CTM'
  private fallback = new ManualDeliveryProvider()
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CTM_API_KEY || undefined
  }

  private get configured(): boolean {
    return Boolean(this.apiKey)
  }

  assertConfigured(): void {
    if (!this.configured) throw new Error(CTM_MISSING_KEY)
  }

  async createShipment(payload: DeliveryPayload): Promise<DeliveryResult> {
    if (!this.configured) {
      console.warn(`[CTM] ${CTM_MISSING_KEY} — fallback livraison manuelle`)
      return this.fallback.createShipment(payload)
    }

    try {
      // TODO: brancher l'API CTM réelle ici (endpoint + format fournis par le
      // service commercial CTM Messagerie). En attendant, on délègue au manuel.
      throw new Error('Intégration CTM à finaliser — voir documentation transporteur')
    } catch (error) {
      console.error('[CTM] Erreur API, fallback manuel:', error)
      return this.fallback.createShipment(payload)
    }
  }

  async getTracking(trackingNumber: string): Promise<{ status: string; events: TrackingEventData[] }> {
    if (!this.configured) return this.fallback.getTracking(trackingNumber)
    try {
      throw new Error('Suivi CTM à finaliser')
    } catch {
      return this.fallback.getTracking(trackingNumber)
    }
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    if (!this.configured) return this.fallback.cancelShipment(trackingNumber)
    try {
      throw new Error('Annulation CTM à finaliser')
    } catch {
      return this.fallback.cancelShipment(trackingNumber)
    }
  }
}
