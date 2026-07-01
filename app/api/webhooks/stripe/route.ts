import { type NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe/server'
import { prisma } from '@/lib/prisma'
import { orderOrchestrator } from '@/lib/order-orchestrator'
import { findOrCreateCustomerByPhone } from '@/lib/customer'

export async function POST(request: NextRequest) {
  let body: string
  try {
    body = await request.text()
  } catch {
    return NextResponse.json({ error: 'Impossible de lire le body' }, { status: 400 })
  }

  const sig = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event
  try {
    event = constructWebhookEvent(body, sig, secret)
  } catch (err) {
    console.error('[Stripe Webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // Return 200 immediately; process asynchronously
  const responsePromise = (async () => {
    try {
      if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object
        const orderId = pi.metadata?.orderId

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'PAID',
              stripePaymentIntent: pi.id,
            },
          })

          // Filet de sécurité : lie un Customer si l'order n'en a pas encore.
          const ord = await prisma.order.findUnique({
            where: { id: orderId },
            select: { customerId: true, customerName: true, customerPhone: true, customerEmail: true, totalMad: true, shippingAddress: true },
          })
          if (ord && !ord.customerId && ord.customerPhone) {
            const addr = (ord.shippingAddress ?? {}) as { addressLine1?: string; city?: string; country?: string }
            const customerId = await findOrCreateCustomerByPhone(prisma, {
              name: ord.customerName,
              phone: ord.customerPhone,
              email: ord.customerEmail,
              country: addr.country,
              totalMad: Number(ord.totalMad),
              addressLine1: addr.addressLine1,
              city: addr.city,
            }).catch(() => null)
            if (customerId) {
              await prisma.order.update({ where: { id: orderId }, data: { customerId } })
            }
          }

          await prisma.payment.create({
            data: {
              orderId,
              method: 'STRIPE',
              status: 'PAID',
              amount: pi.amount_received ? pi.amount_received / 100 : pi.amount / 100,
              currency: pi.currency.toUpperCase(),
              providerRef: pi.id,
            },
          })

          await orderOrchestrator.processOrder(orderId)
        }
      }

      if (event.type === 'payment_intent.payment_failed') {
        const pi = event.data.object
        const orderId = pi.metadata?.orderId

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'FAILED' },
          })

          await prisma.payment.create({
            data: {
              orderId,
              method: 'STRIPE',
              status: 'FAILED',
              amount: pi.amount / 100,
              currency: pi.currency.toUpperCase(),
              providerRef: pi.id,
            },
          })
        }
      }
    } catch (err) {
      console.error('[Stripe Webhook] Processing error:', err)
    }
  })()

  // Don't await — return 200 immediately
  void responsePromise

  return NextResponse.json({ received: true })
}
