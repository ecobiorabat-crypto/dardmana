import { requirePermission } from '@/lib/auth/admin-guard'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/admin/ui'
import { BrandStatsForm, type BrandStatsData } from '@/components/admin/parametres/BrandStatsForm'

export const dynamic = 'force-dynamic'

export default async function StatsMarquePage() {
  await requirePermission('cms.update')

  const stats = await prisma.brandStats.findFirst().catch(() => null)

  const initial: BrandStatsData = {
    tiktokFollowers: stats?.tiktokFollowers ?? 0,
    tiktokLikes: stats?.tiktokLikes ?? 0,
    tiktokHandle: stats?.tiktokHandle ?? '@dardmana',
    googleRating: stats?.googleRating ?? 0,
    googleReviewsCount: stats?.googleReviewsCount ?? 0,
    satisfactionRate: stats?.satisfactionRate ?? 100,
    updatedAt: stats ? stats.updatedAt.toISOString() : null,
    updatedBy: stats?.updatedBy ?? null,
  }

  return (
    <div>
      <PageHeader title="Statistiques de marque" subtitle="TikTok &amp; Google — mise à jour manuelle" />
      <BrandStatsForm initial={initial} />
    </div>
  )
}
