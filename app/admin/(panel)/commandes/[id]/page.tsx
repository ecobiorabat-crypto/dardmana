import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { OrderDetailAdmin, type AdminOrder } from '@/components/admin/commandes/OrderDetailAdmin'

export const dynamic = 'force-dynamic'

export default async function CommandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('orders.view')
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

  return <OrderDetailAdmin order={JSON.parse(JSON.stringify(order)) as AdminOrder} />
}
