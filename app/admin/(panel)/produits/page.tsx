import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { hasPermission } from '@/lib/auth/permissions'
import { PageHeader, AdminCard, EmptyState } from '@/components/admin/ui'
import { ProductsFilters } from '@/components/admin/produits/ProductsFilters'
import { ProductRowActions } from '@/components/admin/produits/ProductRowActions'
import { formatMad } from '@/lib/utils/price'
import type { Prisma, ProductStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'var(--texte-doux)' },
  ACTIVE: { label: 'Actif', color: 'var(--vert-moyen)' },
  ARCHIVED: { label: 'Archivé', color: 'var(--erreur)' },
}

type SP = Record<string, string | string[] | undefined>
function str(sp: SP, key: string): string | undefined {
  const v = sp[key]
  return typeof v === 'string' && v ? v : undefined
}

export default async function ProduitsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requirePermission('products.view')
  const canCreate = hasPermission(session.role, 'products.create')
  const canUpdate = hasPermission(session.role, 'products.update')
  const canDelete = hasPermission(session.role, 'products.delete')
  const sp = await searchParams

  const page = Math.max(1, Number(str(sp, 'page') ?? 1))
  const search = str(sp, 'search')
  const status = str(sp, 'status') as ProductStatus | undefined
  const categoryId = str(sp, 'categoryId')
  const lowStock = str(sp, 'lowStock') === '1'

  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { nameFr: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  let products: {
    id: string; slug: string; nameFr: string; images: string[]; priceMad: unknown
    stock: number; lowStockThreshold: number; status: string
    category: { nameFr: string } | null
  }[] = []
  let total = 0
  let categories: { id: string; nameFr: string }[] = []

  try {
    ;[products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, slug: true, nameFr: true, images: true, priceMad: true,
          stock: true, lowStockThreshold: true, status: true,
          category: { select: { nameFr: true } },
        },
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, nameFr: true } }),
    ])
  } catch {
    products = []; total = 0; categories = []
  }

  const visible = lowStock ? products.filter((p) => p.stock <= p.lowStockThreshold) : products
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const buildPageHref = (p: number) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (typeof v === 'string' && k !== 'page') next.set(k, v)
    next.set('page', String(p))
    return `/admin/produits?${next.toString()}`
  }

  return (
    <div>
      <PageHeader
        title="Produits"
        subtitle={`${total} produit${total > 1 ? 's' : ''}`}
        action={
          canCreate ? (
            <Link href="/admin/produits/nouveau" className="bg-[var(--or-royal)] px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--noir)]">
              + Nouveau produit
            </Link>
          ) : undefined
        }
      />
      <ProductsFilters categories={categories} />

      <AdminCard className="!p-0">
        {visible.length === 0 ? (
          <EmptyState title="Aucun produit" hint="Créez votre premier produit ou ajustez les filtres." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
                  <th className="px-5 py-3 font-medium">Produit</th>
                  <th className="px-5 py-3 font-medium">Catégorie</th>
                  <th className="px-5 py-3 font-medium">Prix</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const st = STATUS_LABELS[p.status] ?? { label: p.status, color: 'var(--texte-doux)' }
                  const low = p.stock <= p.lowStockThreshold
                  return (
                    <tr key={p.id} className="border-b border-[var(--bordure)] last:border-0 hover:bg-[var(--gris-perle)]/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-10 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
                            {p.images?.[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <span className="font-medium text-[var(--texte)]">{p.nameFr}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[var(--texte-doux)]">{p.category?.nameFr ?? '—'}</td>
                      <td className="px-5 py-3">{formatMad(Number(p.priceMad))}</td>
                      <td className="px-5 py-3">
                        <span style={{ color: p.stock === 0 ? 'var(--erreur)' : low ? 'var(--alerte)' : 'var(--texte)' }}>{p.stock}</span>
                      </td>
                      <td className="px-5 py-3"><span className="text-xs" style={{ color: st.color }}>{st.label}</span></td>
                      <td className="px-5 py-3">
                        <ProductRowActions
                          id={p.id}
                          slug={p.slug}
                          archived={p.status === 'ARCHIVED'}
                          canUpdate={canUpdate}
                          canDelete={canDelete}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {totalPages > 1 && !lowStock && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-[var(--texte-doux)]">Page {page} / {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={buildPageHref(page - 1)} className="border border-[var(--bordure)] px-4 py-2 hover:bg-[var(--gris-perle)]">Précédent</Link>}
            {page < totalPages && <Link href={buildPageHref(page + 1)} className="border border-[var(--bordure)] px-4 py-2 hover:bg-[var(--gris-perle)]">Suivant</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
