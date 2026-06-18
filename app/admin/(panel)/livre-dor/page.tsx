import { requirePermission } from '@/lib/auth/admin-guard'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/admin/ui'
import {
  GuestbookModeration,
  type AdminGuestbookEntry,
} from '@/components/admin/guestbook/GuestbookModeration'

export const dynamic = 'force-dynamic'

export default async function AdminGuestbookPage() {
  await requirePermission('cms.update')

  const [entriesRaw, pending] = await Promise.all([
    prisma.guestbookEntry
      .findMany({ where: { isApproved: false }, orderBy: { createdAt: 'desc' }, take: 200 })
      .catch(() => []),
    prisma.guestbookEntry.count({ where: { isApproved: false } }).catch(() => 0),
  ])

  const entries = JSON.parse(JSON.stringify(entriesRaw)) as AdminGuestbookEntry[]

  return (
    <div>
      <PageHeader title="Livre d'Or" subtitle="Modération des témoignages clients" />
      <GuestbookModeration initialEntries={entries} initialPending={pending} />
    </div>
  )
}
