import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { StatCard, AdminCard, StatusBadge, EmptyState } from '@/components/admin/ui'
import { formatMad } from '@/lib/utils/price'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('customers.view')
  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, orderNumber: true, totalMad: true, orderStatus: true, createdAt: true },
      },
    },
  }).catch(() => null)

  if (!customer) notFound()

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/clients" className="text-sm text-[var(--texte-doux)] hover:text-[var(--vert-fonce)]">← Clients</Link>
        <h1 className="font-titre text-2xl text-[var(--vert-fonce)]">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Commandes" value={String(customer.totalOrders)} accent="green" />
        <StatCard label="CA total" value={formatMad(Number(customer.totalSpentMad))} accent="gold" />
        <StatCard label="Pays" value={customer.country} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard>
          <h2 className="mb-3 font-titre text-lg text-[var(--vert-fonce)]">Coordonnées</h2>
          <p className="text-sm text-[var(--texte)]">{customer.email}</p>
          <p className="text-sm text-[var(--texte-doux)]">{customer.phone ?? '—'}</p>
          <p className="mt-2 text-xs text-[var(--texte-doux)]">Langue : {customer.preferredLanguage}</p>
          <p className="text-xs text-[var(--texte-doux)]">Inscrit le {new Date(customer.createdAt).toLocaleDateString('fr-FR')}</p>

          <h3 className="mt-4 border-t border-[var(--bordure)] pt-3 text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">Adresses</h3>
          {customer.addresses.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--texte-doux)]">Aucune adresse enregistrée.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {customer.addresses.map((a) => (
                <li key={a.id} className="text-sm text-[var(--texte)]">
                  <span className="font-medium">{a.label}</span> — {a.fullName}<br />
                  <span className="text-[var(--texte-doux)]">{[a.addressLine1, a.city, a.country].filter(Boolean).join(', ')}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard className="lg:col-span-2 !p-0">
          <h2 className="px-5 pt-5 font-titre text-lg text-[var(--vert-fonce)]">Commandes</h2>
          {customer.orders.length === 0 ? (
            <div className="p-5"><EmptyState title="Aucune commande" /></div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
                    <th className="px-5 py-3 font-medium">Numéro</th>
                    <th className="px-5 py-3 font-medium">Montant</th>
                    <th className="px-5 py-3 font-medium">Statut</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((o) => (
                    <tr key={o.id} className="border-b border-[var(--bordure)] last:border-0 hover:bg-[var(--gris-perle)]/40">
                      <td className="px-5 py-3">
                        <Link href={`/admin/commandes/${o.id}`} className="font-medium text-[var(--vert-fonce)] hover:underline">{o.orderNumber}</Link>
                      </td>
                      <td className="px-5 py-3">{formatMad(Number(o.totalMad))}</td>
                      <td className="px-5 py-3"><StatusBadge status={o.orderStatus} /></td>
                      <td className="px-5 py-3 text-[var(--texte-doux)]">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
