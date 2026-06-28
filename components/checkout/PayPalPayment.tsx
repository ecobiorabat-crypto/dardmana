'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

/**
 * Bouton PayPal officiel pour les commandes internationales.
 * - createOrder : crée l'order PayPal côté serveur (POST /api/checkout/paypal).
 * - onApprove   : capture le paiement (GET /api/checkout/paypal?token=…).
 * Le montant (EUR) est entièrement calculé côté serveur à partir de la commande.
 */
export function PayPalPayment({
  orderId,
  onSuccess,
}: {
  orderId: string
  onSuccess: () => void
}) {
  const t = useTranslations()
  const [error, setError] = useState<string | null>(null)

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  if (!clientId) {
    return <p className="text-sm text-[var(--erreur)]">{t('Checkout.paymentUnavailable')}</p>
  }

  return (
    <div>
      <PayPalScriptProvider options={{ clientId, currency: 'EUR', intent: 'capture' }}>
        <PayPalButtons
          style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' }}
          createOrder={async () => {
            setError(null)
            const res = await fetch('/api/checkout/paypal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId }),
            })
            const data = await res.json()
            if (!res.ok || !data.id) throw new Error(data.error ?? t('Checkout.paymentUnavailable'))
            return data.id as string
          }}
          onApprove={async (data) => {
            const res = await fetch(
              `/api/checkout/paypal?token=${encodeURIComponent(data.orderID)}`,
              { method: 'GET' },
            )
            const result = await res.json()
            if (!res.ok || !result.success) {
              setError(result.error ?? t('Checkout.paymentFailed'))
              return
            }
            onSuccess()
          }}
          onError={() => setError(t('Checkout.paymentFailed'))}
        />
      </PayPalScriptProvider>
      {error && <p className="mt-3 text-sm text-[var(--erreur)]">{error}</p>}
    </div>
  )
}

export default PayPalPayment
