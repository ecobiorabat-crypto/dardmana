import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Reveal } from '@/components/ui/Reveal'
import { Markdown } from '@/components/ui/Markdown'
import { getPublishedCmsPage, pickLocale } from '@/lib/cms'
import { routing } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const cms = await getPublishedCmsPage(slug)
  if (!cms) return {}
  return { title: pickLocale(cms, 'title', locale) }
}

export default async function CmsDynamicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!(routing.locales as readonly string[]).includes(locale)) notFound()
  setRequestLocale(locale)

  const cms = await getPublishedCmsPage(slug)
  if (!cms) notFound()

  const title = pickLocale(cms, 'title', locale)
  const content = pickLocale(cms, 'content', locale)

  return (
    <div className="pb-20">
      <section className="relative flex min-h-[40vh] items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--vert-fonce)] via-[var(--vert-moyen)] to-[var(--vert-fonce)] px-4 pt-28 pb-14 text-center sm:px-6 lg:pt-32">
        <Reveal direction="up" className="relative">
          <h1 className="font-titre text-4xl text-[var(--creme)] sm:text-5xl">{title}</h1>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Reveal>
          <Markdown content={content} />
        </Reveal>
      </section>
    </div>
  )
}
