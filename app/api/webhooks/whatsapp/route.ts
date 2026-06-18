import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import type { Prisma } from '@prisma/client'

interface WAMessage {
  from: string
  id: string
  type: string
  text?: { body: string }
}

interface WAWebhookBody {
  object: string
  entry?: Array<{
    id: string
    changes?: Array<{
      value: {
        messaging_product: string
        messages?: WAMessage[]
      }
    }>
  }>
}

async function sendWhatsAppReply(to: string, message: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) {
    console.log(`[WhatsApp] Reply to ${to}: ${message}`)
    return
  }
  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    })
  } catch (err) {
    console.error('[WhatsApp] Send reply error:', err)
  }
}

// GET — WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — Incoming WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WAWebhookBody

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ received: true })
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const message of change.value.messages ?? []) {
          if (message.type !== 'text' || !message.text?.body) continue

          const from = message.from
          const text = message.text.body.trim()

          // Try to parse a structured order from the message
          // Expected format: "COMMANDE\nNom: ...\nProduit: ...\nQuantité: ...\nVille: ..."
          try {
            if (text.toUpperCase().startsWith('COMMANDE')) {
              const lines = text.split('\n').map((l) => l.trim())
              const get = (prefix: string) =>
                lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()))
                  ?.replace(new RegExp(`^${prefix}:?\\s*`, 'i'), '') ?? ''

              const customerName = get('Nom') || get('Name')
              const productName = get('Produit') || get('Product')
              const quantityStr = get('Quantité') || get('Quantity') || '1'
              const city = get('Ville') || get('City') || 'Maroc'

              if (customerName && productName) {
                const product = await prisma.product.findFirst({
                  where: {
                    OR: [
                      { nameFr: { contains: productName, mode: 'insensitive' } },
                      { nameAr: { contains: productName, mode: 'insensitive' } },
                    ],
                    status: 'ACTIVE',
                  },
                  select: { id: true, nameFr: true, priceMad: true, images: true },
                })

                if (product) {
                  const quantity = Math.max(1, parseInt(quantityStr, 10) || 1)
                  const totalMad = Number(product.priceMad) * quantity

                  const orderNumber = `DD-WA-${Date.now().toString(36).toUpperCase()}`
                  const shippingAddress = { fullName: customerName, city, country: 'MA', addressLine1: city }

                  await prisma.order.create({
                    data: {
                      orderNumber,
                      customerName,
                      customerEmail: `wa-${from}@dardmana.internal`,
                      customerPhone: `+${from}`,
                      shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
                      items: [{ productId: product.id, name: product.nameFr, quantity, unitPriceMad: Number(product.priceMad), totalMad }] as unknown as Prisma.InputJsonValue,
                      subtotalMad: totalMad,
                      shippingCostMad: 35,
                      discountMad: 0,
                      totalMad: totalMad + 35,
                      currency: 'MAD',
                      paymentMethod: 'COD',
                      paymentStatus: 'PENDING',
                      orderStatus: 'NEW',
                      source: 'WHATSAPP',
                      orderItems: {
                        create: {
                          productId: product.id,
                          productName: product.nameFr,
                          productImage: product.images[0] ?? '',
                          quantity,
                          unitPriceMad: Number(product.priceMad),
                          totalMad,
                        },
                      },
                    },
                  })

                  await sendWhatsAppReply(
                    from,
                    `✅ Merci ${customerName} ! Votre commande #${orderNumber} a bien été reçue.\n\n📦 ${product.nameFr} × ${quantity} — ${totalMad.toFixed(0)} MAD\n🚚 Livraison : 35 MAD (paiement à la livraison)\n\n💳 Total : ${(totalMad + 35).toFixed(0)} MAD\n\nNous vous contacterons sous 24h pour confirmer la livraison. شكراً!`
                  )

                  continue
                }
              }

              // Parsing failed — send help message
              await sendWhatsAppReply(
                from,
                `Bonjour ! Pour passer commande via WhatsApp, envoyez :\n\nCOMMANDE\nNom: Votre nom\nProduit: Nom du produit\nQuantité: 1\nVille: Votre ville\n\nOu visitez notre boutique : ${process.env.NEXT_PUBLIC_APP_URL}`
              )
            } else {
              // General message — send welcome
              await sendWhatsAppReply(
                from,
                `Bienvenue chez Dar Dmana ! 🌟\n\nDécouvrez notre artisanat marocain de luxe :\n👉 ${process.env.NEXT_PUBLIC_APP_URL}\n\nPour commander via WhatsApp, envoyez "COMMANDE" suivi de vos informations.`
              )
            }
          } catch (parseError) {
            console.error('[WhatsApp] Parsing error:', parseError)

            // Alert admin
            await resend.emails.send({
              from: 'Dar Dmana System <no-reply@dardmana.ma>',
              to: [process.env.ADMIN_EMAIL ?? 'admin@dardmana.ma'],
              subject: '⚠️ Message WhatsApp non traité',
              html: `<p>Message de <strong>+${from}</strong> impossible à traiter:</p><pre>${text}</pre>`,
            }).catch(console.error)
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[POST /api/webhooks/whatsapp]', error)
    // Still return 200 to avoid WhatsApp retries
    return NextResponse.json({ received: true })
  }
}
