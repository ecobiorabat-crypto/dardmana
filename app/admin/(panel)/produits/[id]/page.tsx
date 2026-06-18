import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { ProductForm, type CategoryOption, type ProductInitial } from '@/components/admin/produits/ProductForm'

export const dynamic = 'force-dynamic'

const s = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

export default async function EditProduitPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('products.update')
  const { id } = await params

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: true } }).catch(() => null),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, nameFr: true } }).catch(() => [] as CategoryOption[]),
  ])

  if (!product) notFound()

  const initial: ProductInitial = {
    id: product.id,
    slug: s(product.slug),
    sku: s(product.sku),
    nameFr: s(product.nameFr), nameAr: s(product.nameAr), nameEn: s(product.nameEn),
    descriptionFr: s(product.descriptionFr), descriptionAr: s(product.descriptionAr), descriptionEn: s(product.descriptionEn),
    shortDescFr: s(product.shortDescFr), shortDescAr: s(product.shortDescAr), shortDescEn: s(product.shortDescEn),
    priceMad: s(Number(product.priceMad)),
    priceEur: product.priceEur ? s(Number(product.priceEur)) : '',
    comparePriceMad: product.comparePriceMad ? s(Number(product.comparePriceMad)) : '',
    categoryId: s(product.categoryId),
    type: s(product.type),
    status: s(product.status),
    images: product.images ?? [],
    stock: s(product.stock),
    lowStockThreshold: s(product.lowStockThreshold),
    weightG: product.weightG ? s(product.weightG) : '',
    dimensions: s(product.dimensions),
    materialFr: s(product.materialFr), materialAr: s(product.materialAr), materialEn: s(product.materialEn),
    tags: (product.tags ?? []).join(', '),
    metaTitleFr: s(product.metaTitleFr),
    metaDescriptionFr: s(product.metaDescriptionFr),
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    variants: product.variants.map((v) => ({
      nameFr: s(v.nameFr), nameAr: s(v.nameAr), nameEn: s(v.nameEn),
      sku: s(v.sku), priceMad: s(Number(v.priceMad)), stock: s(v.stock),
    })),
  }

  return (
    <div>
      <PageHeader title="Modifier le produit" subtitle={product.nameFr} />
      <ProductForm initial={initial} categories={categories} />
    </div>
  )
}
