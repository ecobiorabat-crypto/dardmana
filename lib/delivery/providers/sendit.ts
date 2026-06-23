import type {
  DeliveryPayload,
  DeliveryProvider,
  DeliveryResult,
  TrackingEventData,
} from '@/lib/delivery/types'
import { ManualDeliveryProvider } from '@/lib/delivery/providers/manual'

export const SENDIT_MISSING_KEY =
  'SENDIT_API_KEY manquante — renseignez la clé dans Paramètres → Livraison.'

/** Base de l'API Sendit.ma (surchargeable par SENDIT_API_BASE). */
const SENDIT_BASE = (process.env.SENDIT_API_BASE ?? 'https://app.sendit.ma/api/v1').replace(/\/$/, '')

export interface SenditTestResult {
  ok: boolean
  message: string
  endpoint?: string
}

/**
 * Provider Sendit.ma — création d'expédition déléguée au mode manuel pour
 * l'instant (contrat identique aux autres providers : aucune commande ne crash),
 * mais le test de connexion (`testConnection`) interroge réellement l'API Sendit
 * pour valider la clé du client.
 */
export class SenditDeliveryProvider implements DeliveryProvider {
  name = 'Sendit'
  private fallback = new ManualDeliveryProvider()
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SENDIT_API_KEY || undefined
  }

  private get configured(): boolean {
    return Boolean(this.apiKey)
  }

  assertConfigured(): void {
    if (!this.configured) throw new Error(SENDIT_MISSING_KEY)
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  /**
   * Vérifie que la clé fonctionne en appelant l'API Sendit (lecture seule).
   * Essaie /cities puis /districts puis /account — le premier 2xx valide la clé.
   */
  async testConnection(): Promise<SenditTestResult> {
    if (!this.configured) return { ok: false, message: SENDIT_MISSING_KEY }

    const endpoints = ['/cities', '/districts', '/account', '/balance']
    let lastStatus = 0
    for (const ep of endpoints) {
      try {
        const res = await fetch(`${SENDIT_BASE}${ep}`, { method: 'GET', headers: this.headers() })
        lastStatus = res.status
        if (res.ok) {
          return { ok: true, message: 'Connexion réussie — la clé Sendit est valide.', endpoint: ep }
        }
        if (res.status === 401 || res.status === 403) {
          return { ok: false, message: 'Clé Sendit refusée (401/403) — vérifiez la clé.', endpoint: ep }
        }
        // 404 / autres : on essaie l'endpoint suivant.
      } catch {
        // Erreur réseau : on essaie l'endpoint suivant.
      }
    }
    return {
      ok: false,
      message:
        lastStatus > 0
          ? `Réponse inattendue de Sendit (HTTP ${lastStatus}).`
          : 'Impossible de joindre l’API Sendit (réseau).',
    }
  }

  async createShipment(payload: DeliveryPayload): Promise<DeliveryResult> {
    if (!this.configured) {
      console.warn(`[Sendit] ${SENDIT_MISSING_KEY} — fallback livraison manuelle`)
      return this.fallback.createShipment(payload)
    }
    try {
      // TODO : brancher POST ${SENDIT_BASE}/deliveries (format exact fourni par
      // Sendit). En attendant, on délègue au manuel pour ne bloquer aucune commande.
      throw new Error('Création d’expédition Sendit à finaliser — voir documentation Sendit')
    } catch (error) {
      console.error('[Sendit] Erreur API, fallback manuel:', error)
      return this.fallback.createShipment(payload)
    }
  }

  async getTracking(trackingNumber: string): Promise<{ status: string; events: TrackingEventData[] }> {
    if (!this.configured) return this.fallback.getTracking(trackingNumber)
    try {
      throw new Error('Suivi Sendit à finaliser')
    } catch {
      return this.fallback.getTracking(trackingNumber)
    }
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    if (!this.configured) return this.fallback.cancelShipment(trackingNumber)
    try {
      throw new Error('Annulation Sendit à finaliser')
    } catch {
      return this.fallback.cancelShipment(trackingNumber)
    }
  }
}
