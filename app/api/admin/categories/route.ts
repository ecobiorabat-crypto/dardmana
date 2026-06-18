import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/admin-api-guard'
import { CategorySchema } from '@/lib/validations/product'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardAdminApi(request, 'cms.update')
    if (!auth.ok) return auth.response

    const body = await request.json()
    const parsed = CategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const data = parsed.data
    const slug = data.slug?.trim() || slugify(data.nameFr)

    const category = await prisma.category.create({
      data: {
        slug,
        nameFr: data.nameFr,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        descriptionFr: data.descriptionFr || null,
        descriptionAr: data.descriptionAr || null,
        descriptionEn: data.descriptionEn || null,
        icon: data.icon || null,
        imageUrl: data.imageUrl || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        metaTitleFr: data.metaTitleFr || null,
        metaDescriptionFr: data.metaDescriptionFr || null,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/categories]', error)
    const msg = error instanceof Error && error.message.includes('Unique') ? 'Ce slug existe déjà' : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
