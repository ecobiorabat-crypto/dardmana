import Stripe from 'stripe'

let _stripe: Stripe | undefined

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    _stripe = new Stripe(key)
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver)
  },
})

export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata: Stripe.MetadataParam
): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.create({ amount, currency, metadata })
}

export async function retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(id)
}

export function constructWebhookEvent(
  payload: string | Buffer,
  sig: string,
  secret: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, sig, secret)
}
