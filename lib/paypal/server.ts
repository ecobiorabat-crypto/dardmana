/**
 * Client minimal de l'API REST PayPal (Orders v2).
 *
 * Flux utilisé pour les commandes internationales :
 *   1. createPaypalOrder()  → crée un order PayPal (intent CAPTURE) et renvoie son id.
 *   2. capturePaypalOrder() → capture le paiement une fois l'acheteur approuvé.
 *
 * Base URL : sandbox par défaut. Définir PAYPAL_API_BASE=https://api-m.paypal.com
 * (et les identifiants « live ») pour passer en production.
 */

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE?.replace(/\/$/, '') || 'https://api-m.sandbox.paypal.com'

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET non configurés')
  }
  return { clientId, clientSecret }
}

/** Récupère un access token OAuth2 (grant_type=client_credentials). */
async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getCredentials()
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`PayPal OAuth échoué (${res.status}): ${detail}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

export interface PaypalOrderResult {
  id: string
  status: string
}

/**
 * Crée un order PayPal (intent CAPTURE).
 * @param amount  Montant à débiter, dans la devise indiquée (ex : 49.90).
 * @param currency Code devise ISO (ex : 'EUR'). PayPal n'accepte pas le MAD.
 * @param referenceId Référence interne (numéro de commande) reportée sur la transaction.
 */
export async function createPaypalOrder(
  amount: number,
  currency: string,
  referenceId: string,
  description?: string,
): Promise<PaypalOrderResult> {
  const token = await getAccessToken()

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: referenceId,
          custom_id: referenceId,
          description: description?.slice(0, 127),
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2),
          },
        },
      ],
    }),
    cache: 'no-store',
  })

  const data = (await res.json()) as PaypalOrderResult & { message?: string }
  if (!res.ok) {
    throw new Error(`Création order PayPal échouée (${res.status}): ${data.message ?? ''}`)
  }
  return data
}

export interface PaypalCaptureResult {
  id: string
  status: string
  referenceId: string | null
  captureId: string | null
  amount: number | null
  currency: string | null
}

/** Capture un order PayPal préalablement approuvé par l'acheteur. */
export async function capturePaypalOrder(paypalOrderId: string): Promise<PaypalCaptureResult> {
  const token = await getAccessToken()

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  const data = (await res.json()) as {
    id: string
    status: string
    message?: string
    purchase_units?: Array<{
      reference_id?: string
      payments?: {
        captures?: Array<{ id: string; amount?: { value: string; currency_code: string } }>
      }
    }>
  }

  if (!res.ok) {
    throw new Error(`Capture PayPal échouée (${res.status}): ${data.message ?? ''}`)
  }

  const unit = data.purchase_units?.[0]
  const capture = unit?.payments?.captures?.[0]

  return {
    id: data.id,
    status: data.status,
    referenceId: unit?.reference_id ?? null,
    captureId: capture?.id ?? null,
    amount: capture?.amount ? Number(capture.amount.value) : null,
    currency: capture?.amount?.currency_code ?? null,
  }
}
