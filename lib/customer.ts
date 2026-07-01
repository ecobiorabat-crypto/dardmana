import type { Prisma, PrismaClient } from '@prisma/client'
import { normalizePhone } from '@/lib/utils/phone'

type Db = PrismaClient | Prisma.TransactionClient

export interface CustomerLinkInput {
  name: string
  phone: string
  email?: string | null
  country?: string | null
  totalMad: number
  addressLine1?: string | null
  city?: string | null
}

/**
 * Retrouve un Customer par téléphone (normalisé +212…) ou le crée, met à jour
 * ses stats (totalOrders / totalSpentMad) et renvoie son id.
 *
 * Utilisé par les commandes SITE (COD, Stripe/PayPal) pour lier un Customer,
 * exactement comme le fait déjà /api/admin/orders. Renvoie null si le téléphone
 * est vide/invalide (l'Order est alors créé sans customerId, sans planter).
 */
export async function findOrCreateCustomerByPhone(
  db: Db,
  input: CustomerLinkInput,
): Promise<string | null> {
  const phone = normalizePhone(input.phone)
  if (!phone) return null

  const email = input.email?.trim() || null
  const country = (input.country || 'MA').toUpperCase()

  const existing = await db.customer.findUnique({ where: { phone }, select: { id: true } })
  if (existing) {
    await db.customer.update({
      where: { id: existing.id },
      data: {
        totalOrders: { increment: 1 },
        totalSpentMad: { increment: input.totalMad },
        ...(email && { email }),
      },
    })
    return existing.id
  }

  const created = await db.customer.create({
    data: {
      name: input.name,
      phone,
      email,
      country,
      totalOrders: 1,
      totalSpentMad: input.totalMad,
      ...(input.addressLine1 && {
        addresses: {
          create: {
            label: 'Livraison',
            fullName: input.name,
            phone,
            addressLine1: input.addressLine1,
            city: input.city || '',
            country,
            isDefault: true,
          },
        },
      }),
    },
    select: { id: true },
  })
  return created.id
}
