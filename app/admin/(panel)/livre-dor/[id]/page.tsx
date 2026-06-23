import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/auth/admin-guard'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/admin/ui'
import { GuestbookEditForm } from '@/components/admin/guestbook/GuestbookEditForm'
import type { AdminGuestbookEntry } from '@/components/admin/guestbook/GuestbookModeration'

export const dynamic = 'force-dynamic'

export default async function GuestbookEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission('cms.update')
  const { id } = await params

  const entryRaw = await prisma.guestbookEntry.findUnique({ where: { id } }).catch(() => null)
  if (!entryRaw) notFound()

  const entry = JSON.parse(JSON.stringify(entryRaw)) as AdminGuestbookEntry

  return (
    <div>
      <PageHeader
        title="Modifier le témoignage"
        subtitle={`${entry.customerName}${entry.isApproved ? ' · approuvé' : ' · en attente'}`}
      />
      <GuestbookEditForm entry={entry} />
    </div>
  )
}
