import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { ReviewSchema } from '@/lib/validations/order'

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('productId')
    const page = Number(request.nextUrl.searchParams.get('page') ?? 1)
    const limit = 10

    if (!productId) {
      return NextResponse.json({ error: 'productId requis' }, { status: 400 })
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId, isApproved: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, customerName: true, customerCountry: true,
          rating: true, title: true, content: true,
          isVerified: true, createdAt: true,
        },
      }),
      prisma.review.count({ where: { productId, isApproved: true } }),
    ])

    const ratingStats = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      avgRating: ratingStats._avg.rating ?? 0,
    })
  } catch (error) {
    console.error('[GET /api/reviews]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = ReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const { productId, customerName, customerCountry, rating, title, content } = parsed.data

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
    if (!product) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    }

    // Check if the user purchased this product
    const customer = await prisma.customer.findUnique({
      where: { authUserId: user.id },
      select: { id: true },
    })

    let isVerified = false
    if (customer) {
      const hasPurchased = await prisma.orderItem.findFirst({
        where: {
          productId,
          order: { customerId: customer.id, paymentStatus: 'PAID' },
        },
      })
      isVerified = !!hasPurchased
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerId: customer?.id ?? null,
        customerName,
        customerCountry: customerCountry ?? null,
        rating,
        title: title ?? null,
        content,
        isVerified,
        isApproved: false, // requires admin moderation
      },
    })

    return NextResponse.json({ review, message: 'Avis soumis — en attente de modération' }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/reviews]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
