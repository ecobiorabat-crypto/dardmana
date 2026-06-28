'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/store/cart'
import { useHydrated } from '@/components/layout/hooks'
import { trackBeginCheckout } from '@/lib/analytics/events'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { formatMad } from '@/lib/utils/price'

// Chargement différé du module Stripe (lourd) : il n'est requis qu'à l'étape
// de paiement par carte, et uniquement côté client.
function PaymentLoading() {
  const t = useTranslations()
  return <p className="text-sm text-[var(--texte-doux)]">{t('Checkout.loadingPayment')}</p>
}

const StripePayment = dynamic(
  () => import('@/components/checkout/StripePayment').then((m) => m.StripePayment),
  {
    ssr: false,
    loading: () => <PaymentLoading />,
  },
)

// PayPal (commandes internationales) : chargé à la demande, côté client uniquement.
const PayPalPayment = dynamic(
  () => import('@/components/checkout/PayPalPayment').then((m) => m.PayPalPayment),
  {
    ssr: false,
    loading: () => <PaymentLoading />,
  },
)
import { getShippingMethods, getPaymentMethods, type ShippingOption } from '@/lib/utils/shipping'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'
import { cn } from '@/lib/utils/cn'

const COUNTRY_CODES = ['MA', 'FR', 'BE', 'CH', 'ES', 'DE', 'US']

const PAYMENT_LABEL_KEYS: Record<string, string> = {
  COD: 'Checkout.cod',
  CMI: 'Checkout.cmi',
  STRIPE: 'Checkout.stripeInternational',
}

// Passerelles pas encore branchées : affichées mais non sélectionnables
// (évite de créer des commandes non payées). À retirer dès l'intégration.
const COMING_SOON = new Set(['CMI'])

const STEP_KEYS = [
  'Checkout.stepAddress',
  'Checkout.stepShipping',
  'Checkout.stepPayment',
  'Checkout.stepConfirmation',
]

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  postalCode: string
  country: string
}

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  country: 'MA',
}

export function CheckoutWizard() {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const router = useRouter()
  const hydrated = useHydrated()

  const paymentLabel = (m: string) =>
    PAYMENT_LABEL_KEYS[m] ? t(PAYMENT_LABEL_KEYS[m]) : m === 'PAYPAL' ? 'PayPal' : m

  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [shippingId, setShippingId] = useState<string>('')
  const [payment, setPayment] = useState<string>('COD')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [stripe, setStripe] = useState<{ clientSecret: string; orderNumber: string } | null>(null)
  const [paypal, setPaypal] = useState<{ orderId: string; orderNumber: string } | null>(null)

  const subtotal = items.reduce((sum, i) => sum + i.priceMad * i.quantity, 0)
  const shippingOptions = useMemo(
    () => getShippingMethods(form.country, subtotal),
    [form.country, subtotal],
  )
  const paymentMethods = useMemo(() => getPaymentMethods(form.country), [form.country])
  const selectedShipping: ShippingOption | undefined =
    shippingOptions.find((s) => s.id === shippingId) ?? shippingOptions[0]
  const shippingCost = selectedShipping?.isFree ? 0 : selectedShipping?.priceMad ?? 0
  const total = subtotal + shippingCost

  // Événement analytics « début de commande » — une fois, dès que le panier est connu.
  const beginCheckoutFired = useRef(false)
  useEffect(() => {
    if (beginCheckoutFired.current || !hydrated || items.length === 0) return
    beginCheckoutFired.current = true
    trackBeginCheckout({
      items: items.map((i) => ({ id: i.productId, name: i.name, price: i.priceMad, quantity: i.quantity })),
      total: subtotal,
    })
  }, [hydrated, items, subtotal])

  // Sauvegarde panier abandonné (debounce 3s) dès qu'un email ou téléphone valide est saisi.
  useEffect(() => {
    if (!hydrated || items.length === 0) return
    const email = form.email.trim()
    const phone = form.phone.trim()
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const phoneValid = phone.replace(/\D/g, '').length >= 8
    if (!emailValid && !phoneValid) return

    const timer = window.setTimeout(() => {
      fetch('/api/abandoned-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailValid ? email : undefined,
          phone: phoneValid ? phone : undefined,
          customerName: `${form.firstName} ${form.lastName}`.trim() || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            image: i.image,
            priceMad: i.priceMad,
            quantity: i.quantity,
          })),
          totalMad: subtotal,
        }),
      }).catch(() => {})
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [hydrated, form.email, form.phone, form.firstName, form.lastName, items, subtotal])

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const addressValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.addressLine1.trim() &&
    form.city.trim()

  function persistAndGoConfirmation(orderNumber: string) {
    const summary = {
      orderNumber,
      items: items.map((i) => ({ productId: i.productId, name: i.name, quantity: i.quantity, priceMad: i.priceMad, image: i.image })),
      subtotal,
      shippingCost,
      total,
      shipping: selectedShipping?.label ?? '',
      estimatedDays: selectedShipping?.estimatedDays ?? '',
      paymentMethod: payment,
      city: form.city,
      country: form.country,
    }
    try {
      sessionStorage.setItem('dd-last-order', JSON.stringify(summary))
    } catch {
      /* ignore */
    }
    clearCart()
    router.push(localizedHref(locale, `/checkout/confirmation?order=${encodeURIComponent(orderNumber)}`))
  }

  async function placeCodOrder() {
    const res = await fetch('/api/checkout/cod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerPhone: form.phone,
        customerEmail: form.email || undefined,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        city: form.city,
        postalCode: form.postalCode || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId })),
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? t('Checkout.orderRefused'))
    return data.orderNumber as string
  }

  async function createOrder(method: string) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: form.email,
        customerPhone: form.phone,
        shippingAddress: {
          label: 'Domicile',
          fullName: `${form.firstName} ${form.lastName}`.trim(),
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || undefined,
          city: form.city,
          postalCode: form.postalCode || undefined,
          country: form.country,
        },
        paymentMethod: method,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId })),
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? t('Checkout.orderRefused'))
    return data as { orderId: string; orderNumber: string }
  }

  async function handleConfirm() {
    setError(null)
    // Garde-fou : une passerelle « bientôt disponible » ne doit jamais aboutir.
    if (COMING_SOON.has(payment)) {
      setError(t('Checkout.comingSoon'))
      return
    }
    setSubmitting(true)
    try {
      if (payment === 'COD') {
        const orderNumber = await placeCodOrder()
        persistAndGoConfirmation(orderNumber)
      } else if (payment === 'STRIPE') {
        const { orderId, orderNumber } = await createOrder('STRIPE')
        const res = await fetch('/api/checkout/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total, currency: 'mad', orderId, orderNumber }),
        })
        const data = await res.json()
        if (!res.ok || !data.clientSecret) throw new Error(data.error ?? t('Checkout.paymentUnavailable'))
        setStripe({ clientSecret: data.clientSecret, orderNumber })
      } else if (payment === 'PAYPAL') {
        // Crée la commande puis affiche le bouton PayPal (order + capture côté API).
        const { orderId, orderNumber } = await createOrder('PAYPAL')
        setPaypal({ orderId, orderNumber })
      } else {
        // CMI : création directe (intégration passerelle à finaliser)
        const { orderNumber } = await createOrder(payment)
        persistAndGoConfirmation(orderNumber)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (hydrated && items.length === 0 && !stripe && !paypal) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <p className="font-titre text-2xl text-[var(--vert-fonce)]">{t('Cart.empty')}</p>
        <Button href={localizedHref(locale, '/catalogue')} variant="gold" size="md">
          {t('Checkout.backToCatalogue')}
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        {/* Stepper */}
        <ol className="mb-10 flex items-center gap-2">
          {STEP_KEYS.map((labelKey, i) => (
            <li key={labelKey} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs',
                  i <= step
                    ? 'border-[var(--vert-fonce)] bg-[var(--vert-fonce)] text-[var(--creme)]'
                    : 'border-[var(--bordure)] text-[var(--texte-doux)]',
                )}
              >
                {i + 1}
              </span>
              <span className={cn('hidden text-xs sm:inline', i === step ? 'text-[var(--vert-fonce)]' : 'text-[var(--texte-doux)]')}>
                {t(labelKey)}
              </span>
              {i < STEP_KEYS.length - 1 && <span className="h-px flex-1 bg-[var(--bordure)]" />}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {/* Étape 1 : Adresse */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="font-titre text-2xl text-[var(--vert-fonce)]">{t('Checkout.addressTitle')}</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Input label={t('Checkout.firstName')} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
                  <Input label={t('Checkout.lastName')} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Input label={t('Checkout.email')} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
                  <Input label={t('Checkout.phone')} value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
                </div>
                <Input label={t('Checkout.address')} value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} required />
                <Input label={`${t('Checkout.addressLine2')} (${t('Common.optional')})`} value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Input label={t('Checkout.city')} value={form.city} onChange={(e) => set('city', e.target.value)} required />
                  <Input label={t('Checkout.postalCode')} value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
                  <div>
                    <label htmlFor="country" className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--texte-doux)]">
                      {t('Checkout.country')}
                    </label>
                    <select
                      id="country"
                      value={form.country}
                      onChange={(e) => {
                        set('country', e.target.value)
                        setShippingId('')
                        const methods = getPaymentMethods(e.target.value)
                        // Sélectionne la 1re méthode réellement disponible.
                        setPayment(methods.find((m) => !COMING_SOON.has(m)) ?? methods[0])
                      }}
                      className="h-12 w-full border border-[var(--bordure)] bg-transparent px-3 text-sm outline-none focus:border-[var(--or-royal)]"
                    >
                      {COUNTRY_CODES.map((code) => (
                        <option key={code} value={code}>{t(`Countries.${code}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="dark" size="lg" disabled={!addressValid} onClick={() => setStep(1)}>
                    {t('Checkout.continue')}
                  </Button>
                </div>
              </div>
            )}

            {/* Étape 2 : Livraison */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-titre text-2xl text-[var(--vert-fonce)]">{t('Checkout.shippingTitle')}</h2>
                <div className="space-y-3">
                  {shippingOptions.map((opt) => {
                    const active = (selectedShipping?.id ?? '') === opt.id
                    return (
                      <label
                        key={opt.id}
                        className={cn(
                          'flex cursor-pointer items-center justify-between border p-4 transition-colors',
                          active ? 'border-[var(--vert-fonce)] bg-[var(--creme)]' : 'border-[var(--bordure)]',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={active}
                            onChange={() => setShippingId(opt.id)}
                            className="h-4 w-4 accent-[var(--vert-fonce)]"
                          />
                          <div>
                            <p className="text-sm font-medium text-[var(--texte)]">{opt.label}</p>
                            <p className="text-xs text-[var(--texte-doux)]">{opt.carrier} · {opt.estimatedDays}</p>
                          </div>
                        </div>
                        <span className="text-sm text-[var(--vert-fonce)]">
                          {opt.isFree ? t('Common.offered') : formatMad(opt.priceMad)}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="lg" onClick={() => setStep(0)}>{t('Common.back')}</Button>
                  <Button variant="dark" size="lg" onClick={() => setStep(2)}>{t('Checkout.continue')}</Button>
                </div>
              </div>
            )}

            {/* Étape 3 : Paiement */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-titre text-2xl text-[var(--vert-fonce)]">{t('Checkout.stepPayment')}</h2>
                <div className="space-y-3">
                  {paymentMethods.map((m) => {
                    const comingSoon = COMING_SOON.has(m)
                    const active = payment === m && !comingSoon
                    return (
                      <label
                        key={m}
                        className={cn(
                          'flex items-center gap-3 border p-4 transition-colors',
                          comingSoon
                            ? 'cursor-not-allowed border-[var(--bordure)] opacity-60'
                            : active
                              ? 'cursor-pointer border-[var(--vert-fonce)] bg-[var(--creme)]'
                              : 'cursor-pointer border-[var(--bordure)]',
                        )}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={active}
                          disabled={comingSoon}
                          onChange={() => !comingSoon && setPayment(m)}
                          className="h-4 w-4 accent-[var(--vert-fonce)]"
                        />
                        <span className="flex-1 text-sm font-medium text-[var(--texte)]">{paymentLabel(m)}</span>
                        {comingSoon && (
                          <span className="rounded-full bg-[var(--gris-perle)] px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--texte-doux)]">
                            {t('Checkout.comingSoon')}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="lg" onClick={() => setStep(1)}>{t('Common.back')}</Button>
                  <Button variant="dark" size="lg" onClick={() => setStep(3)}>{t('Checkout.continue')}</Button>
                </div>
              </div>
            )}

            {/* Étape 4 : Confirmation */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-titre text-2xl text-[var(--vert-fonce)]">{t('Checkout.reviewTitle')}</h2>

                {stripe ? (
                  <div className="border border-[var(--bordure)] p-5">
                    <p className="mb-4 text-sm text-[var(--texte-doux)]">
                      {t('Checkout.stripeInstructions')}
                    </p>
                    <StripePayment
                      clientSecret={stripe.clientSecret}
                      returnUrl={
                        typeof window !== 'undefined'
                          ? `${window.location.origin}${localizedHref(locale, `/checkout/confirmation?order=${stripe.orderNumber}`)}`
                          : '/'
                      }
                      onSuccess={() => persistAndGoConfirmation(stripe.orderNumber)}
                    />
                  </div>
                ) : paypal ? (
                  <div className="border border-[var(--bordure)] p-5">
                    <p className="mb-4 text-sm text-[var(--texte-doux)]">
                      {t('Checkout.paypalInstructions')}
                    </p>
                    <PayPalPayment
                      orderId={paypal.orderId}
                      onSuccess={() => persistAndGoConfirmation(paypal.orderNumber)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 border border-[var(--bordure)] p-5 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--texte-doux)]">{t('Checkout.deliveredTo')}</p>
                        <p className="mt-1 text-[var(--texte)]">
                          {form.firstName} {form.lastName} · {form.phone}
                        </p>
                        <p className="text-[var(--texte-doux)]">
                          {form.addressLine1}, {form.city} {form.postalCode} ({form.country})
                        </p>
                      </div>
                      <div className="border-t border-[var(--bordure)] pt-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--texte-doux)]">{t('Checkout.stepShipping')}</p>
                        <p className="mt-1 text-[var(--texte)]">
                          {selectedShipping?.label} ({selectedShipping?.estimatedDays})
                        </p>
                      </div>
                      <div className="border-t border-[var(--bordure)] pt-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--texte-doux)]">{t('Checkout.stepPayment')}</p>
                        <p className="mt-1 text-[var(--texte)]">{paymentLabel(payment)}</p>
                      </div>
                    </div>

                    {error && <p className="text-sm text-[var(--erreur)]">{error}</p>}

                    <div className="flex justify-between">
                      <Button variant="ghost" size="lg" onClick={() => setStep(2)}>{t('Common.back')}</Button>
                      <Button variant="gold" size="lg" loading={submitting} onClick={handleConfirm}>
                        {t('Checkout.placeOrder')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Récap latéral */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <OrderSummary
          items={hydrated ? items : []}
          subtotal={subtotal}
          shippingCost={shippingCost}
          total={total}
        />
      </aside>
    </div>
  )
}

export default CheckoutWizard
