import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProductFilterSchema } from '@/lib/validations/product'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries())

    const parsed = ProductFilterSchema.safeParse({
      ...params,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      isFeatured: params.isFeatured === 'true' ? true : params.isFeatured === 'false' ? false : undefined,
      isNew: params.isNew === 'true' ? true : params.isNew === 'false' ? false : undefined,
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 24,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const { categorySlug, minPrice, maxPrice, status, isFeatured, isNew, ids, search, page, limit, sortBy, sortOrder } = parsed.data

    const idList = ids ? ids.split(',').map((s) => s.trim()).filter(Boolean) : []

    const where: Prisma.ProductWhereInput = {
      status: status ?? 'ACTIVE',
      ...(idList.length > 0 && { id: { in: idList } }),
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(minPrice !== undefined && { priceMad: { gte: minPrice } }),
      ...(maxPrice !== undefined && { priceMad: { lte: maxPrice } }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(isNew !== undefined && { isNew }),
      ...(search && {
        OR: [
          { nameFr: { contains: search, mode: 'insensitive' as const } },
          { nameAr: { contains: search, mode: 'insensitive' as const } },
          { nameEn: { contains: search, mode: 'insensitive' as const } },
          { tags: { hasSome: [search.toLowerCase()] } },
        ],
      }),
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = { [sortBy]: sortOrder }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { slug: true, nameFr: true, nameAr: true, nameEn: true } },
          _count: { select: { reviews: { where: { isApproved: true } } } },
        },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products: JSON.parse(JSON.stringify(products)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[GET /api/products]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
