import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/admin-api-guard'
import { CategorySchema } from '@/lib/validations/product'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardAdminApi(request, 'cms.update')
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const parsed = CategorySchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 })
    }

    const data = parsed.data
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.nameFr !== undefined && { nameFr: data.nameFr }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.descriptionFr !== undefined && { descriptionFr: data.descriptionFr || null }),
        ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr || null }),
        ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn || null }),
        ...(data.icon !== undefined && { icon: data.icon || null }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.metaTitleFr !== undefined && { metaTitleFr: data.metaTitleFr || null }),
        ...(data.metaDescriptionFr !== undefined && { metaDescriptionFr: data.metaDescriptionFr || null }),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('[PATCH /api/admin/categories/[id]]', error)
    const msg = error instanceof Error && error.message.includes('Unique') ? 'Ce slug existe déjà' : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardAdminApi(request, 'cms.update')
    if (!auth.ok) return auth.response

    const { id } = await params
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ category, message: 'Catégorie désactivée' })
  } catch (error) {
    console.error('[DELETE /api/admin/categories/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
