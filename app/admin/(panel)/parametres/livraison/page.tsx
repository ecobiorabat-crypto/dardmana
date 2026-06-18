import { requirePermission } from '@/lib/auth/admin-guard'
import { getDeliverySettingsPublic } from '@/lib/delivery/settings'
import { PageHeader } from '@/components/admin/ui'
import { DeliveryForm } from '@/components/admin/parametres/DeliveryForm'

export const dynamic = 'force-dynamic'

export default async function LivraisonSettingsPage() {
  await requirePermission('cms.update')

  const settings = await getDeliverySettingsPublic()

  return (
    <div>
      <PageHeader title="Livraison" subtitle="Transporteur actif &amp; clés API" />
      <DeliveryForm initial={settings} />
    </div>
  )
}
