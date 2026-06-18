'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export interface CODItem {
  productId: string
  quantity: number
  variantId?: string
}

export interface CODFormProps {
  items: CODItem[]
  /** Appelé avec le numéro de commande après création réussie. */
  onSuccess: (orderNumber: string) => void
  className?: string
}

interface CODState {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  postalCode: string
}

const EMPTY: CODState = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postalCode: '',
}

/**
 * Formulaire autonome de paiement à la livraison (Maroc).
 * Valide les champs requis puis poste vers /api/checkout/cod.
 */
export function CODForm({ items, onSuccess, className }: CODFormProps) {
  const t = useTranslations()
  const [form, setForm] = useState<CODState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof CODState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const valid =
    form.fullName.trim() &&
    form.phone.trim() &&
    form.addressLine1.trim() &&
    form.city.trim() &&
    items.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.fullName.trim(),
          customerPhone: form.phone.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          city: form.city.trim(),
          postalCode: form.postalCode.trim() || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            variantId: i.variantId,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('Checkout.orderRefused'))
      onSuccess(data.orderNumber as string)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-5">
        <Input
          label={t('Checkout.fullName')}
          value={form.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          required
        />
        <Input
          label={t('Checkout.phone')}
          type="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          required
        />
        <Input
          label={t('Checkout.address')}
          value={form.addressLine1}
          onChange={(e) => set('addressLine1', e.target.value)}
          required
        />
        <Input
          label={`${t('Checkout.addressLine2')} (${t('Common.optional')})`}
          value={form.addressLine2}
          onChange={(e) => set('addressLine2', e.target.value)}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label={t('Checkout.city')}
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            required
          />
          <Input
            label={t('Checkout.postalCode')}
            value={form.postalCode}
            onChange={(e) => set('postalCode', e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-[var(--erreur)]">{error}</p>}

        <Button type="submit" variant="gold" size="lg" fullWidth loading={submitting} disabled={!valid}>
          {`${t('Checkout.placeOrder')} (${t('Checkout.cod')})`}
        </Button>
      </div>
    </form>
  )
}

export default CODForm
