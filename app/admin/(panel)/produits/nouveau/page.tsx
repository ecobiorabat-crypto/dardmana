import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { ProductForm, EMPTY_PRODUCT, type CategoryOption } from '@/components/admin/produits/ProductForm'

export const dynamic = 'force-dynamic'

export default async function NouveauProduitPage() {
  await requirePermission('products.create')
  const categories: CategoryOption[] = await prisma.category
    .findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, nameFr: true } })
    .catch(() => [])

  return (
    <div>
      <PageHeader title="Nouveau produit" subtitle="Créer une fiche produit complète" />
      <ProductForm initial={EMPTY_PRODUCT} categories={categories} />
    </div>
  )
}
