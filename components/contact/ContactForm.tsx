'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/store/ui'
import { ContactSchema, CONTACT_SUBJECTS } from '@/lib/validations/contact'
import { cn } from '@/lib/utils/cn'

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'subject' | 'message', string>>

const FIELD_BASE = cn(
  'block w-full appearance-none bg-transparent rounded-none',
  'border-0 border-b border-[var(--bordure)]',
  'py-3 text-[0.95rem] text-[var(--texte)] outline-none',
  'transition-colors duration-200 focus:border-[var(--or-royal)]',
)

const LABEL_BASE = 'mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--texte-doux)]'

export function ContactForm() {
  const t = useTranslations('Contact')
  const showToast = useUiStore((s) => s.showToast)

  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function update(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    const parsed = ContactSchema.safeParse({
      ...values,
      phone: values.phone || undefined,
    })

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (key && !fieldErrors[key]) fieldErrors[key] = t(issue.message)
      }
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) throw new Error('request failed')

      setSubmitted(true)
      showToast(t('successTitle'), 'success')
      setValues({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch {
      showToast(t('error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 border border-[var(--bordure)] px-6 py-16 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gris-perle)] text-[var(--succes)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h3 className="font-titre text-2xl text-[var(--vert-fonce)]">{t('successTitle')}</h3>
        <p className="max-w-sm text-sm leading-relaxed text-[var(--texte-doux)]">{t('successText')}</p>
        <Button variant="ghost" size="md" onClick={() => setSubmitted(false)}>
          {t('send')}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Nom */}
      <div>
        <label htmlFor="contact-name" className={LABEL_BASE}>
          {t('name')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          disabled={loading}
          aria-invalid={Boolean(errors.name) || undefined}
          className={cn(FIELD_BASE, errors.name && 'border-[var(--erreur)] focus:border-[var(--erreur)]')}
        />
        {errors.name && <p role="alert" className="mt-1.5 text-xs text-[var(--erreur)]">{errors.name}</p>}
      </div>

      {/* Email + Téléphone */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-email" className={LABEL_BASE}>
            {t('email')} <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(errors.email) || undefined}
            className={cn(FIELD_BASE, errors.email && 'border-[var(--erreur)] focus:border-[var(--erreur)]')}
          />
          {errors.email && <p role="alert" className="mt-1.5 text-xs text-[var(--erreur)]">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="contact-phone" className={LABEL_BASE}>
            {t('phone')}
          </label>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => update('phone', e.target.value)}
            disabled={loading}
            className={FIELD_BASE}
          />
        </div>
      </div>

      {/* Sujet */}
      <div>
        <label htmlFor="contact-subject" className={LABEL_BASE}>
          {t('subject')} <span aria-hidden="true">*</span>
        </label>
        <select
          id="contact-subject"
          value={values.subject}
          onChange={(e) => update('subject', e.target.value)}
          disabled={loading}
          aria-invalid={Boolean(errors.subject) || undefined}
          className={cn(
            FIELD_BASE,
            'cursor-pointer',
            !values.subject && 'text-[var(--texte-doux)]',
            errors.subject && 'border-[var(--erreur)] focus:border-[var(--erreur)]',
          )}
        >
          <option value="" disabled>
            {t('subjectPlaceholder')}
          </option>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s} className="text-[var(--texte)]">
              {t(`subject${s.charAt(0).toUpperCase()}${s.slice(1)}` as 'subjectProduct')}
            </option>
          ))}
        </select>
        {errors.subject && <p role="alert" className="mt-1.5 text-xs text-[var(--erreur)]">{errors.subject}</p>}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact-message" className={LABEL_BASE}>
          {t('message')} <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={5}
          value={values.message}
          onChange={(e) => update('message', e.target.value)}
          disabled={loading}
          aria-invalid={Boolean(errors.message) || undefined}
          className={cn(
            FIELD_BASE,
            'resize-y leading-relaxed',
            errors.message && 'border-[var(--erreur)] focus:border-[var(--erreur)]',
          )}
        />
        {errors.message && <p role="alert" className="mt-1.5 text-xs text-[var(--erreur)]">{errors.message}</p>}
      </div>

      <Button type="submit" variant="gold" size="lg" fullWidth loading={loading}>
        {loading ? t('sending') : t('send')}
      </Button>
    </form>
  )
}

export default ContactForm
