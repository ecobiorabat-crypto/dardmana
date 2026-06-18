import { requirePermission } from '@/lib/auth/admin-guard'
import { getSiteSettings } from '@/lib/settings'
import { PageHeader } from '@/components/admin/ui'
import { BrandingForm } from '@/components/admin/parametres/BrandingForm'

export const dynamic = 'force-dynamic'

export default async function GeneralSettingsPage() {
  await requirePermission('cms.update')

  const settings = await getSiteSettings()

  return (
    <div>
      <PageHeader title="Identité & logo" subtitle="Personnalisez le logo et le nom affichés sur le site" />
      <BrandingForm initial={settings} />
    </div>
  )
}
