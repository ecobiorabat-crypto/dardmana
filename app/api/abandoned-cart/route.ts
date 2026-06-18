import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const ItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  image: z.string().optional().default(''),
  priceMad: z.number(),
  quantity: z.number().int().positive(),
})

const BodySchema = z
  .object({
    email: z.string().trim().email().optional().or(z.literal('')),
    phone: z.string().trim().min(6).max(40).optional().or(z.literal('')),
    customerName: z.string().trim().max(120).optional().or(z.literal('')),
    items: z.array(ItemSchema).min(1),
    totalMad: z.number().nonnegative(),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phone), {
    message: 'Email ou téléphone requis',
  })

// POST : enregistre / met à jour un panier abandonné (appelé en debounce depuis le checkout).
export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { email, phone, customerName, items, totalMad } = parsed.data
    const cleanEmail = email || null
    const cleanPhone = phone || null

    // Recherche d'un panier ACTIVE déjà associé à cet email ou téléphone.
    const or: Prisma.AbandonedCartWhereInput[] = []
    if (cleanEmail) or.push({ email: cleanEmail })
    if (cleanPhone) or.push({ phone: cleanPhone })

    const existing = await prisma.abandonedCart.findFirst({
      where: { status: 'ACTIVE', OR: or },
      orderBy: { createdAt: 'desc' },
    })

    const data = {
      email: cleanEmail,
      phone: cleanPhone,
      customerName: customerName || null,
      items: items as unknown as Prisma.InputJsonValue,
      totalMad,
    }

    if (existing) {
      await prisma.abandonedCart.update({ where: { id: existing.id }, data })
    } else {
      await prisma.abandonedCart.create({ data })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/abandoned-cart]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
