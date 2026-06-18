import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader, AdminCard, EmptyState } from '@/components/admin/ui'
import { CategoryRowActions } from '@/components/admin/categories/CategoryRowActions'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  await requirePermission('products.view')

  const categories = await prisma.category
    .findMany({
      orderBy: [{ sortOrder: 'asc' }, { nameFr: 'asc' }],
      include: { _count: { select: { products: true } } },
    })
    .catch(() => [])

  const activeCount = categories.filter((c) => c.isActive).length

  return (
    <div>
      <PageHeader
        title="Catégories"
        subtitle={`${categories.length} catégorie${categories.length > 1 ? 's' : ''} · ${activeCount} active${activeCount > 1 ? 's' : ''}`}
        action={
          <Link
            href="/admin/categories/nouvelle"
            className="bg-[var(--or-royal)] px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--noir)]"
          >
            + Nouvelle catégorie
          </Link>
        }
      />

      <AdminCard className="!p-0">
        {categories.length === 0 ? (
          <EmptyState title="Aucune catégorie" hint="Créez votre première catégorie pour organiser le catalogue." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
                  <th className="px-5 py-3 font-medium">Icône</th>
                  <th className="px-5 py-3 font-medium">Nom (FR)</th>
                  <th className="px-5 py-3 font-medium">Produits</th>
                  <th className="px-5 py-3 font-medium">Ordre</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-b border-[var(--bordure)] last:border-0 hover:bg-[var(--gris-perle)]/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden bg-[var(--gris-perle)] text-xl">
                        {cat.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cat.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span aria-hidden="true">{cat.icon ?? '—'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[var(--texte)]">{cat.nameFr}</p>
                      <p className="text-xs text-[var(--texte-doux)]">{cat.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-[var(--texte-doux)]">{cat._count.products}</td>
                    <td className="px-5 py-3 tabular-nums text-[var(--texte-doux)]">{cat.sortOrder}</td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs"
                        style={{ color: cat.isActive ? 'var(--vert-moyen)' : 'var(--texte-doux)' }}
                      >
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <CategoryRowActions id={cat.id} isActive={cat.isActive} nameFr={cat.nameFr} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  )
}
