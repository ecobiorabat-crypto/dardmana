import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const CustomerSchema = z.object({
  authUserId: z.string().min(1),
  email: z.string().email(),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).nullish(),
  preferredLanguage: z.string().trim().max(8).optional(),
})

// Called internally by lib/auth/client.ts after Supabase signUp
export async function POST(request: NextRequest) {
  try {
    const parsed = CustomerSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }
    const body = parsed.data

    // Idempotent upsert — safe to call multiple times
    const customer = await prisma.customer.upsert({
      where: { authUserId: body.authUserId },
      update: {},
      create: {
        authUserId: body.authUserId,
        email: body.email,
        name: body.name,
        phone: body.phone ?? null,
        preferredLanguage: body.preferredLanguage ?? 'fr',
      },
    })

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/auth/customer]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
