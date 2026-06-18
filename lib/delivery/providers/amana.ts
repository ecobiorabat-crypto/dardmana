import type {
  DeliveryPayload,
  DeliveryProvider,
  DeliveryResult,
  TrackingEventData,
} from '@/lib/delivery/types'
import { ManualDeliveryProvider } from '@/lib/delivery/providers/manual'

export const AMANA_MISSING_KEY =
  'AMANA_API_KEY manquante — voir documentation transporteur (README → Connecter un vrai transporteur)'

/**
 * Stub Amana (Poste Maroc) — prêt à connecter.
 *
 * Tant qu'aucune clé n'est fournie (constructeur ou AMANA_API_KEY), le provider
 * journalise un message clair et **délègue à ManualDeliveryProvider** : aucune
 * commande ne crash faute de transporteur. La vraie intégration HTTP reste à
 * brancher une fois les accès commerciaux obtenus.
 */
export class AmanaDeliveryProvider implements DeliveryProvider {
  name = 'Amana'
  private fallback = new ManualDeliveryProvider()
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.AMANA_API_KEY || undefined
  }

  private get configured(): boolean {
    return Boolean(this.apiKey)
  }

  /** Lève une erreur explicite — utilisable par les tests / health-checks. */
  assertConfigured(): void {
    if (!this.configured) throw new Error(AMANA_MISSING_KEY)
  }

  async createShipment(payload: DeliveryPayload): Promise<DeliveryResult> {
    if (!this.configured) {
      console.warn(`[Amana] ${AMANA_MISSING_KEY} — fallback livraison manuelle`)
      return this.fallback.createShipment(payload)
    }

    try {
      // TODO: brancher l'API Amana réelle ici (endpoint + format fournis par
      // le service commercial Poste Maroc). En attendant, on délègue au manuel.
      throw new Error('Intégration Amana à finaliser — voir documentation transporteur')
    } catch (error) {
      console.error('[Amana] Erreur API, fallback manuel:', error)
      return this.fallback.createShipment(payload)
    }
  }

  async getTracking(trackingNumber: string): Promise<{ status: string; events: TrackingEventData[] }> {
    if (!this.configured) return this.fallback.getTracking(trackingNumber)
    try {
      throw new Error('Suivi Amana à finaliser')
    } catch {
      return this.fallback.getTracking(trackingNumber)
    }
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    if (!this.configured) return this.fallback.cancelShipment(trackingNumber)
    try {
      throw new Error('Annulation Amana à finaliser')
    } catch {
      return this.fallback.cancelShipment(trackingNumber)
    }
  }
}
