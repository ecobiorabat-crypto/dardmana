import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { applyPromoCode } from '@/lib/utils/price'

const PromoSchema = z.object({
  code: z.string().trim().min(1).max(64),
  subtotal: z.number().nonnegative(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = PromoSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }
    const body = parsed.data

    const promo = await prisma.promoCode.findUnique({
      where: { code: body.code.toUpperCase() },
    })

    if (!promo) {
      return NextResponse.json({ valid: false, message: 'Code promo invalide' })
    }

    const result = applyPromoCode(body.subtotal, promo)

    if (result.error) {
      return NextResponse.json({ valid: false, message: result.error })
    }

    return NextResponse.json({
      valid: true,
      type: promo.type,
      discount: result.discount,
      newTotal: result.newTotal,
      message:
        promo.type === 'PERCENT'
          ? `${Number(promo.value)}% de réduction appliquée`
          : promo.type === 'FIXED_MAD'
            ? `${Number(promo.value)} MAD de réduction`
            : 'Livraison gratuite',
    })
  } catch (error) {
    console.error('[POST /api/promo]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
