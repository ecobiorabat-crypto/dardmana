import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { getHomepageSettings } from '@/lib/homepage'
import { PageHeader } from '@/components/admin/ui'
import { HomepageForm } from '@/components/admin/cms/HomepageForm'

export const dynamic = 'force-dynamic'

export default async function HomepageSettingsPage() {
  await requirePermission('cms.update')

  const [settings, products] = await Promise.all([
    getHomepageSettings(),
    prisma.product
      .findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, nameFr: true },
        orderBy: { nameFr: 'asc' },
      })
      .catch(() => []),
  ])

  return (
    <div>
      <PageHeader
        title="Page d’accueil"
        subtitle="Bandeau d’annonce, hero, produits mis en avant et newsletter"
      />
      <HomepageForm initial={settings} products={products} />
    </div>
  )
}
