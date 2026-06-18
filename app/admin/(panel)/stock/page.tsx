import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader, AdminCard, StatCard, EmptyState } from '@/components/admin/ui'
import { StockTable, type StockProduct } from '@/components/admin/stock/StockTable'

export const dynamic = 'force-dynamic'

export default async function StockPage() {
  await requirePermission('products.view')

  let products: StockProduct[] = []
  let movements: { id: string; productName: string; quantity: number; createdAt: Date; orderNumber: string; orderId: string }[] = []

  try {
    const [list, items] = await Promise.all([
      prisma.product.findMany({
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { stock: 'asc' },
        select: { id: true, nameFr: true, sku: true, images: true, stock: true, lowStockThreshold: true },
      }),
      prisma.orderItem.findMany({
        orderBy: { order: { createdAt: 'desc' } },
        take: 25,
        select: { id: true, productName: true, quantity: true, order: { select: { createdAt: true, orderNumber: true, id: true } } },
      }),
    ])
    products = list
    movements = items.map((it) => ({
      id: it.id,
      productName: it.productName,
      quantity: it.quantity,
      createdAt: it.order.createdAt,
      orderNumber: it.order.orderNumber,
      orderId: it.order.id,
    }))
  } catch {
    products = []; movements = []
  }

  const outCount = products.filter((p) => p.stock === 0).length
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length

  return (
    <div>
      <PageHeader title="Stock" subtitle="Niveaux de stock et ajustements" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Références" value={String(products.length)} />
        <StatCard label="Stock faible" value={String(lowCount)} accent="gold" />
        <StatCard label="Ruptures" value={String(outCount)} accent="red" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2 !p-0">
          <h2 className="px-5 pt-5 font-titre text-lg text-[var(--vert-fonce)]">Niveaux de stock</h2>
          {products.length === 0 ? (
            <div className="p-5"><EmptyState title="Aucun produit" /></div>
          ) : (
            <div className="mt-3"><StockTable products={products} /></div>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Mouvements récents</h2>
          {movements.length === 0 ? (
            <p className="text-sm text-[var(--texte-doux)]">Aucun mouvement.</p>
          ) : (
            <ul className="space-y-3">
              {movements.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-[var(--texte)]">{m.productName}</p>
                    <p className="text-xs text-[var(--texte-doux)]">{m.orderNumber} · {new Date(m.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className="shrink-0 text-[var(--erreur)]">−{m.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
