import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createPaymentIntent } from '@/lib/stripe/server'

const SessionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().trim().min(1).max(8).optional(),
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = SessionSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }
    const body = parsed.data

    const currency = (body.currency ?? 'mad').toLowerCase()
    // Stripe amounts are in smallest unit (centimes). MAD doesn't have sub-units in Stripe.
    const amountInCents = Math.round(body.amount * 100)

    const paymentIntent = await createPaymentIntent(amountInCents, currency, {
      orderId: body.orderId,
      orderNumber: body.orderNumber,
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('[POST /api/checkout/session]', error)
    return NextResponse.json({ error: 'Erreur création paiement' }, { status: 500 })
  }
}
