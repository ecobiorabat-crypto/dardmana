'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth/client'
import { RegisterSchema } from '@/lib/validations/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'

interface Fields {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

const INITIAL: Fields = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
}

export function RegisterForm() {
  const t = useTranslations()
  const locale = useCurrentLocale()
  const router = useRouter()
  const [fields, setFields] = useState<Fields>(INITIAL)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const errors = useMemo(() => {
    const result = RegisterSchema.safeParse({ ...fields, preferredLanguage: locale })
    if (result.success) return {} as Record<string, string>
    const flat = result.error.flatten().fieldErrors
    const out: Record<string, string> = {}
    for (const [key, val] of Object.entries(flat)) {
      if (val && val[0]) out[key] = val[0]
    }
    return out
  }, [fields, locale])

  const isValid = Object.keys(errors).length === 0

  const set = (key: keyof Fields, value: string | boolean) =>
    setFields((f) => ({ ...f, [key]: value }))

  const blur = (key: string) => setTouched((t) => ({ ...t, [key]: true }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true, acceptTerms: true })
    if (!isValid) return
    setServerError(null)
    setLoading(true)
    try {
      await signUp({
        email: fields.email,
        password: fields.password,
        name: fields.name,
        phone: fields.phone || undefined,
        preferredLanguage: locale,
      })
      router.push(localizedHref(locale, '/compte'))
      router.refresh()
    } catch (err) {
      setServerError((err as Error).message || t('Auth.registerError'))
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="text-center">
        <h1 className="font-titre text-3xl text-[var(--vert-fonce)]">{t('Auth.registerTitle')}</h1>
        <p className="mt-2 text-sm text-[var(--texte-doux)]">{t('Auth.registerSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <Input
          label={t('Auth.name')}
          value={fields.name}
          onChange={(e) => set('name', e.target.value)}
          onBlur={() => blur('name')}
          error={touched.name ? errors.name : undefined}
          required
        />
        <Input
          label={t('Auth.email')}
          type="email"
          value={fields.email}
          onChange={(e) => set('email', e.target.value)}
          onBlur={() => blur('email')}
          error={touched.email ? errors.email : undefined}
          required
        />
        <Input
          label={t('Auth.phoneOptional')}
          value={fields.phone}
          onChange={(e) => set('phone', e.target.value)}
          onBlur={() => blur('phone')}
          error={touched.phone ? errors.phone : undefined}
        />
        <Input
          label={t('Auth.password')}
          type="password"
          value={fields.password}
          onChange={(e) => set('password', e.target.value)}
          onBlur={() => blur('password')}
          error={touched.password ? errors.password : undefined}
          required
        />
        <Input
          label={t('Auth.confirmPassword')}
          type="password"
          value={fields.confirmPassword}
          onChange={(e) => set('confirmPassword', e.target.value)}
          onBlur={() => blur('confirmPassword')}
          error={touched.confirmPassword ? errors.confirmPassword : undefined}
          required
        />

        <label className="flex items-start gap-2.5 text-sm text-[var(--texte-doux)]">
          <input
            type="checkbox"
            checked={fields.acceptTerms}
            onChange={(e) => set('acceptTerms', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--vert-fonce)]"
          />
          <span>
            {t('Auth.acceptTermsPrivacy')}
          </span>
        </label>
        {touched.acceptTerms && errors.acceptTerms && (
          <p className="text-xs text-[var(--erreur)]">{errors.acceptTerms}</p>
        )}

        {serverError && <p className="text-sm text-[var(--erreur)]">{serverError}</p>}

        <Button type="submit" variant="dark" size="lg" fullWidth loading={loading}>
          {t('Auth.createAccount')}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--texte-doux)]">
        {t('Auth.hasAccount')}{' '}
        <Link href={localizedHref(locale, '/auth/login')} className="text-[var(--vert-fonce)] underline-offset-2 hover:underline">
          {t('Auth.signIn')}
        </Link>
      </p>
    </div>
  )
}

export default RegisterForm
