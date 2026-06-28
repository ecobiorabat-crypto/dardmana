import { requirePermission } from '@/lib/auth/admin-guard'
import { getSiteSettings } from '@/lib/settings'
import { PageHeader } from '@/components/admin/ui'
import { BrandingForm } from '@/components/admin/parametres/BrandingForm'
import { ContactSocialForm } from '@/components/admin/parametres/ContactSocialForm'
import { NavConfigForm } from '@/components/admin/parametres/NavConfigForm'

export const dynamic = 'force-dynamic'

export default async function GeneralSettingsPage() {
  await requirePermission('cms.update')

  const settings = await getSiteSettings()

  return (
    <div className="space-y-14">
      <section>
        <PageHeader title="Identité & logo" subtitle="Personnalisez le logo et le nom affichés sur le site" />
        <BrandingForm initial={settings} />
      </section>

      <section>
        <PageHeader
          title="Coordonnées & réseaux sociaux"
          subtitle="Téléphone, WhatsApp, e-mail et liens sociaux (Footer & page Contact)"
        />
        <ContactSocialForm initial={settings} />
      </section>

      <section>
        <PageHeader
          title="Navigation & Pages"
          subtitle="Activez ou désactivez les pages et liens de navigation"
        />
        <NavConfigForm initial={settings.navConfig} />
      </section>
    </div>
  )
}
