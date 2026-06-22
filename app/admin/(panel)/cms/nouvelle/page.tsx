import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { CmsPageForm } from '@/components/admin/cms/CmsPageForm'

export const dynamic = 'force-dynamic'

export default async function CmsNewPage() {
  await requirePermission('cms.update')

  return (
    <div>
      <PageHeader title="Nouvelle page" subtitle="Créez une page éditoriale (FR / AR / EN)" />
      <CmsPageForm
        mode="create"
        initial={{
          slug: '',
          titleFr: '',
          titleAr: '',
          titleEn: '',
          contentFr: '',
          contentAr: '',
          contentEn: '',
          heroImageUrl: null,
          galleryImages: [],
          isPublished: false,
        }}
      />
    </div>
  )
}
