import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { CategoryForm, type CategoryInitial } from '@/components/admin/categories/CategoryForm'

export const dynamic = 'force-dynamic'

const s = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

export default async function EditCategoriePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('cms.update')
  const { id } = await params

  const category = await prisma.category.findUnique({ where: { id } }).catch(() => null)
  if (!category) notFound()

  const initial: CategoryInitial = {
    id: category.id,
    slug: s(category.slug),
    nameFr: s(category.nameFr),
    nameAr: s(category.nameAr),
    nameEn: s(category.nameEn),
    descriptionFr: s(category.descriptionFr),
    descriptionAr: s(category.descriptionAr),
    descriptionEn: s(category.descriptionEn),
    icon: s(category.icon),
    imageUrl: s(category.imageUrl),
    sortOrder: s(category.sortOrder),
    isActive: category.isActive,
  }

  return (
    <div>
      <PageHeader title="Modifier la catégorie" subtitle={category.nameFr} />
      <CategoryForm initial={initial} />
    </div>
  )
}
