import { requireAdmin } from '@/lib/auth/admin-guard'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/auth/permissions'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()

  const pendingGuestbook = hasPermission(session.role, 'cms.update')
    ? await prisma.guestbookEntry.count({ where: { isApproved: false } }).catch(() => 0)
    : 0

  return (
    <div className="flex min-h-screen bg-[var(--gris-perle)]/40">
      <AdminSidebar
        name={session.name}
        email={session.adminEmail}
        role={session.role}
        pendingGuestbook={pendingGuestbook}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  )
}
