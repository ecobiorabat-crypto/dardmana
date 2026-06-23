import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { NewOrderForm } from '@/components/admin/commandes/NewOrderForm'

export const dynamic = 'force-dynamic'

export default async function NewOrderPage() {
  await requirePermission('orders.update')

  return (
    <div>
      <PageHeader
        title="Nouvelle commande"
        subtitle="Saisie manuelle d'une commande (téléphone, produits, paiement)"
      />
      <NewOrderForm />
    </div>
  )
}
