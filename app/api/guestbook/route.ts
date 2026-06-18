import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { GuestbookEntrySchema } from '@/lib/validations/guestbook'
import type { Prisma } from '@prisma/client'

const PAGE_SIZE = 12

// ─── GET : feed public (entrées approuvées uniquement) ──────────────────────────

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const page = Math.max(1, Number(sp.get('page') ?? 1) || 1)
    const category = sp.get('category')?.trim() || ''
    const videosOnly = sp.get('videos') === 'true'

    const where: Prisma.GuestbookEntryWhereInput = {
      isApproved: true,
      ...(category && { productTag: { contains: category, mode: 'insensitive' } }),
      ...(videosOnly && { mediaType: 'VIDEO' }),
    }

    const [entries, total] = await Promise.all([
      prisma.guestbookEntry.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          customerName: true,
          customerCity: true,
          customerCountry: true,
          message: true,
          rating: true,
          mediaUrl: true,
          mediaType: true,
          productTag: true,
          source: true,
          likesCount: true,
          isVerifiedBuyer: true,
          isFeatured: true,
          createdAt: true,
        },
      }),
      prisma.guestbookEntry.count({ where }),
    ])

    return NextResponse.json({
      entries: JSON.parse(JSON.stringify(entries)),
      page,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    })
  } catch (error) {
    console.error('[GET /api/guestbook]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST : soumission publique (créée non approuvée) ───────────────────────────

const CreateSchema = GuestbookEntrySchema.extend({
  mediaUrl: z.string().trim().url().optional().or(z.literal('')),
  mediaType: z.enum(['PHOTO', 'VIDEO']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { customerName, customerCity, message, rating, productTag, mediaUrl, mediaType } =
      parsed.data

    await prisma.guestbookEntry.create({
      data: {
        customerName,
        customerCity: customerCity || null,
        message,
        rating: rating ?? null,
        productTag: productTag || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaUrl ? mediaType ?? null : null,
        source: 'WEBSITE',
        isApproved: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/guestbook]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
