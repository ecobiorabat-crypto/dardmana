import { requirePermission } from '@/lib/auth/admin-guard'
import { getSiteSettings } from '@/lib/settings'
import { PageHeader } from '@/components/admin/ui'
import { BrandingForm } from '@/components/admin/parametres/BrandingForm'
import { ContactSocialForm } from '@/components/admin/parametres/ContactSocialForm'
import { WhatsappNotifyForm } from '@/components/admin/parametres/WhatsappNotifyForm'

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
          title="Notifications WhatsApp"
          subtitle="Recevoir une alerte WhatsApp à chaque nouvelle commande (via CallMeBot)"
        />
        <WhatsappNotifyForm initial={settings} />
      </section>
    </div>
  )
}
