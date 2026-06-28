import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createPaypalOrder, capturePaypalOrder } from '@/lib/paypal/server'
import { madToEur } from '@/lib/utils/shipping'
import { orderOrchestrator } from '@/lib/order-orchestrator'

const CreateSchema = z.object({
  orderId: z.string().min(1),
})

/**
 * POST : crée un order PayPal (API REST) pour une commande existante.
 * Le montant est converti en EUR côté serveur (PayPal ne supporte pas le MAD) ;
 * on ne fait jamais confiance à un montant fourni par le client.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = CreateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { id: true, orderNumber: true, totalMad: true, paymentStatus: true },
    })
    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Commande déjà payée' }, { status: 409 })
    }

    const amountEur = madToEur(Number(order.totalMad))
    if (amountEur <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    const paypalOrder = await createPaypalOrder(
      amountEur,
      'EUR',
      order.orderNumber,
      `Dar Dmana — Commande ${order.orderNumber}`,
    )

    // Mémorise le montant EUR facturé sur la commande.
    await prisma.order.update({
      where: { id: order.id },
      data: { totalEur: amountEur },
    })

    return NextResponse.json({ id: paypalOrder.id })
  } catch (error) {
    console.error('[POST /api/checkout/paypal]', error)
    return NextResponse.json({ error: 'Erreur création paiement PayPal' }, { status: 500 })
  }
}

/**
 * GET : capture le paiement après approbation de l'acheteur.
 * Query : ?token=<paypalOrderId>  (PayPal renomme l'id en « token » au retour).
 * Marque la commande PAID, journalise le paiement, déclenche l'orchestrateur.
 */
export async function GET(request: NextRequest) {
  try {
    const paypalOrderId =
      request.nextUrl.searchParams.get('token') ?? request.nextUrl.searchParams.get('paypalOrderId')
    if (!paypalOrderId) {
      return NextResponse.json({ error: 'Identifiant PayPal manquant' }, { status: 400 })
    }

    const capture = await capturePaypalOrder(paypalOrderId)
    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Paiement non finalisé', status: capture.status }, { status: 402 })
    }

    // reference_id = numéro de commande interne (posé à la création de l'order PayPal).
    const order = capture.referenceId
      ? await prisma.order.findUnique({
          where: { orderNumber: capture.referenceId },
          select: { id: true, orderNumber: true, paymentStatus: true },
        })
      : null

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable pour ce paiement' }, { status: 404 })
    }

    // Idempotence : si déjà payée, on renvoie simplement le succès.
    if (order.paymentStatus !== 'PAID') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID', stripePaymentIntent: capture.captureId ?? capture.id },
      })

      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: 'PAYPAL',
          status: 'PAID',
          amount: capture.amount ?? 0,
          currency: capture.currency ?? 'EUR',
          providerRef: capture.captureId ?? capture.id,
        },
      })

      await orderOrchestrator.processOrder(order.id).catch((err) => {
        console.error(`[GET /api/checkout/paypal] Orchestrator error for ${order.id}:`, err)
      })
    }

    return NextResponse.json({ success: true, orderNumber: order.orderNumber })
  } catch (error) {
    console.error('[GET /api/checkout/paypal]', error)
    return NextResponse.json({ error: 'Erreur capture paiement PayPal' }, { status: 500 })
  }
}
