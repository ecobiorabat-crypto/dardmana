'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/auth/client'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'

export function LoginForm() {
  const t = useTranslations()
  const locale = useCurrentLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || localizedHref(locale, '/compte')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Erreur OAuth renvoyée par le callback (?error=…) affichée dès le chargement.
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn({ email, password })
      router.push(redirect)
      router.refresh()
    } catch (err) {
      setError((err as Error).message || t('Auth.invalidCredentials'))
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    if (typeof window === 'undefined') return
    try {
      const supabase = createClient()
      // Redirige vers notre route callback (échange du code PKCE), en conservant
      // la destination d'origine dans ?next=.
      const callbackUrl =
        `${window.location.origin}${localizedHref(locale, '/auth/callback')}` +
        `?next=${encodeURIComponent(redirect)}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      })
      // signInWithOAuth ne lève pas : en cas d'échec (provider non activé,
      // réseau…) il renvoie { error } sans rediriger. On le remonte à l'UI.
      if (error) setError(error.message || t('Auth.googleUnavailable'))
    } catch {
      setError(t('Auth.googleUnavailable'))
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="text-center">
        <h1 className="font-titre text-3xl text-[var(--vert-fonce)]">{t('Auth.loginTitle')}</h1>
        <p className="mt-2 text-sm text-[var(--texte-doux)]">{t('Auth.loginSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input label={t('Auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input label={t('Auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />

        <div className="flex justify-end">
          <Link href="#" className="text-xs text-[var(--texte-doux)] underline-offset-2 hover:text-[var(--vert-fonce)] hover:underline">
            {t('Auth.forgotPassword')}
          </Link>
        </div>

        {error && <p className="text-sm text-[var(--erreur)]">{error}</p>}

        <Button type="submit" variant="dark" size="lg" fullWidth loading={loading}>
          {t('Auth.signIn')}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[var(--bordure)]" />
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--texte-doux)]">{t('Auth.or')}</span>
        <span className="h-px flex-1 bg-[var(--bordure)]" />
      </div>

      <Button variant="outline" size="lg" fullWidth onClick={handleGoogle}>
        {t('Auth.google')}
      </Button>

      <p className="mt-8 text-center text-sm text-[var(--texte-doux)]">
        {t('Auth.noAccount')}{' '}
        <Link href={localizedHref(locale, '/auth/register')} className="text-[var(--vert-fonce)] underline-offset-2 hover:underline">
          {t('Auth.createAccount')}
        </Link>
      </p>
    </div>
  )
}

export default LoginForm
