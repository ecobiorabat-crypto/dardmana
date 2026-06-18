import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/admin-api-guard'
import { ProductSchema } from '@/lib/validations/product'
import type { Prisma, ProductStatus, ProductType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await guardAdminApi(request, 'products.view')
    if (!auth.ok) return auth.response

    const params = request.nextUrl.searchParams
    const page = Number(params.get('page') ?? 1)
    const limit = 20
    const search = params.get('search')?.trim()
    const status = params.get('status') as ProductStatus | null
    const categoryId = params.get('categoryId')

    const where: Prisma.ProductWhereInput = {
      ...(status ? { status } : { status: { not: 'ARCHIVED' } }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { nameFr: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, nameFr: true, slug: true } },
          _count: { select: { variants: true, reviews: true, orderItems: true } },
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
    console.error('[GET /api/admin/products]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardAdminApi(request, 'products.create')
    if (!auth.ok) return auth.response

    const body = await request.json()
    const parsed = ProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const { variants, ...productData } = parsed.data

    const product = await prisma.product.create({
      data: {
        ...productData,
        status: productData.status as ProductStatus,
        type: productData.type as ProductType,
        variants: variants?.length
          ? {
              create: variants.map((v) => ({
                nameFr: v.nameFr,
                nameAr: v.nameAr,
                nameEn: v.nameEn,
                sku: v.sku ?? null,
                priceMad: v.priceMad,
                stock: v.stock,
                attributes: v.attributes as Prisma.InputJsonValue,
                isActive: v.isActive,
              })),
            }
          : undefined,
      },
      include: { category: true, variants: true },
    })

    return NextResponse.json({ product: JSON.parse(JSON.stringify(product)) }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/products]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardAdminApi(request, 'products.update')
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { id, ...rest } = body as { id?: string } & Record<string, unknown>

    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const parsed = ProductSchema.partial().safeParse(rest)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const { variants: _v, ...updateData } = parsed.data

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, variants: true },
    })

    return NextResponse.json({ product: JSON.parse(JSON.stringify(product)) })
  } catch (error) {
    console.error('[PATCH /api/admin/products]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await guardAdminApi(request, 'products.delete')
    if (!auth.ok) return auth.response

    const { id } = (await request.json()) as { id?: string }
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    await prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    return NextResponse.json({ success: true, message: 'Produit archivé' })
  } catch (error) {
    console.error('[DELETE /api/admin/products]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
