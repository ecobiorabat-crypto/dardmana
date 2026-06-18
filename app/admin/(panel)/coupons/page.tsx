import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { CouponsManager, type CouponRow } from '@/components/admin/coupons/CouponsManager'

export const dynamic = 'force-dynamic'

export default async function CouponsPage() {
  await requirePermission('coupons.update')

  const coupons = await prisma.promoCode
    .findMany({ orderBy: { createdAt: 'desc' } })
    .catch(() => [])

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Codes promotionnels" />
      <CouponsManager coupons={JSON.parse(JSON.stringify(coupons)) as CouponRow[]} />
    </div>
  )
}
