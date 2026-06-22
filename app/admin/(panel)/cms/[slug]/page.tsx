import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth/admin-guard'
import { PageHeader } from '@/components/admin/ui'
import { CmsPageForm } from '@/components/admin/cms/CmsPageForm'

export const dynamic = 'force-dynamic'

export default async function CmsEditPage({ params }: { params: Promise<{ slug: string }> }) {
  await requirePermission('cms.update')
  const { slug } = await params

  const page = await prisma.cMSPage.findUnique({ where: { slug } }).catch(() => null)
  if (!page) notFound()

  return (
    <div>
      <PageHeader title={page.titleFr} subtitle={`Page « ${page.slug} »`} />
      <CmsPageForm
        mode="edit"
        initial={{
          slug: page.slug,
          titleFr: page.titleFr,
          titleAr: page.titleAr,
          titleEn: page.titleEn,
          contentFr: page.contentFr,
          contentAr: page.contentAr,
          contentEn: page.contentEn,
          heroImageUrl: page.heroImageUrl,
          galleryImages: page.galleryImages,
          isPublished: page.isPublished,
        }}
      />
    </div>
  )
}
