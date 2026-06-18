import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LoginForm } from '@/components/auth/LoginForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return {
    title: t('Auth.loginTitle'),
    robots: { index: false },
  }
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 pt-28 pb-16">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
