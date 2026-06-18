import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { CategoryForm, EMPTY_CATEGORY } from '@/components/admin/categories/CategoryForm'

export const dynamic = 'force-dynamic'

export default async function NouvelleCategoriePage() {
  await requirePermission('cms.update')

  return (
    <div>
      <PageHeader title="Nouvelle catégorie" subtitle="Créer une catégorie pour le catalogue" />
      <CategoryForm initial={EMPTY_CATEGORY} />
    </div>
  )
}
