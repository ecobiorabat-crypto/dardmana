'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe/client'
import { Button } from '@/components/ui/Button'

function CardForm({ returnUrl, onSuccess }: { returnUrl: string; onSuccess: () => void }) {
  const t = useTranslations()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    })
    if (error) {
      setError(error.message ?? t('Checkout.paymentFailed'))
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && <p className="text-sm text-[var(--erreur)]">{error}</p>}
      <Button type="submit" variant="gold" size="lg" fullWidth loading={loading} disabled={!stripe}>
        {t('Checkout.payNow')}
      </Button>
    </form>
  )
}

export function StripePayment({
  clientSecret,
  returnUrl,
  onSuccess,
}: {
  clientSecret: string
  returnUrl: string
  onSuccess: () => void
}) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: 'flat',
          variables: { colorPrimary: '#c9a84c', borderRadius: '0px', fontFamily: 'Jost, sans-serif' },
        },
      }}
    >
      <CardForm returnUrl={returnUrl} onSuccess={onSuccess} />
    </Elements>
  )
}

export default StripePayment
