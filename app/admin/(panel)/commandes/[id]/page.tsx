import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { OrderDetailAdmin, type AdminOrder } from '@/components/admin/commandes/OrderDetailAdmin'
import { AdminParamToast } from '@/components/admin/AdminParamToast'

export const dynamic = 'force-dynamic'

export default async function CommandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('orders.view')
  const canDelete = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN'
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: { include: { product: { select: { slug: true } } } },
      payments: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  }).catch(() => null)

  if (!order) notFound()

  return (
    <>
      <Suspense fallback={null}>
        <AdminParamToast param="created" message="Commande créée avec succès" />
      </Suspense>
      <OrderDetailAdmin order={JSON.parse(JSON.stringify(order)) as AdminOrder} canDelete={canDelete} />
    </>
  )
}
