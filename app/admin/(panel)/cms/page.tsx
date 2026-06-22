import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader, AdminCard, EmptyState } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default async function CmsListPage() {
  await requirePermission('cms.update')

  const pages = await prisma.cMSPage
    .findMany({
      orderBy: { slug: 'asc' },
      select: { slug: true, titleFr: true, isPublished: true, updatedAt: true },
    })
    .catch(() => [])

  return (
    <div>
      <PageHeader
        title="Pages du site"
        subtitle="Modifiez le contenu des pages éditoriales (FR / AR / EN)"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/cms/homepage"
              className="border border-[var(--vert-fonce)] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
            >
              Page d’accueil
            </Link>
            <Link
              href="/admin/cms/nouvelle"
              className="bg-[var(--vert-fonce)] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)]"
            >
              + Nouvelle page
            </Link>
          </div>
        }
      />

      <AdminCard className="!p-0">
        {pages.length === 0 ? (
          <EmptyState
            title="Aucune page"
            hint="Créez une page ou exécutez le script de seed (npm run seed-cms)."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
                  <th className="px-5 py-3 font-medium">Titre</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Modifiée le</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.slug} className="border-b border-[var(--bordure)] last:border-0 hover:bg-[var(--gris-perle)]/40">
                    <td className="px-5 py-3">
                      <Link href={`/admin/cms/${p.slug}`} className="font-medium text-[var(--vert-fonce)] hover:underline">
                        {p.titleFr}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--texte-doux)]">{p.slug}</td>
                    <td className="px-5 py-3">
                      {p.isPublished ? (
                        <span className="text-xs text-[var(--vert-moyen)]">● Publiée</span>
                      ) : (
                        <span className="text-xs text-[var(--texte-doux)]">○ Brouillon</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--texte-doux)]">
                      {new Date(p.updatedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/cms/${p.slug}`} className="text-xs text-[var(--or-royal)] hover:underline">
                        Éditer
                      </Link>
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
