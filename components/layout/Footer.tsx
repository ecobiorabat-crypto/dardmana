'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { localizedHref, useCurrentLocale } from './nav'
import { cn } from '@/lib/utils/cn'

interface FooterColumn {
  /** Clé de titre dans la section `Footer`. */
  titleKey: string
  links: { labelKey: string; href: string }[]
}

const COLUMNS: FooterColumn[] = [
  {
    titleKey: 'collections',
    links: [
      { labelKey: 'newArrivals', href: '/nouveautes' },
      { labelKey: 'bestSellers', href: '/best-sellers' },
      { labelKey: 'limitedEditions', href: '/editions-limitees' },
      { labelKey: 'allCollections', href: '/collections' },
    ],
  },
  {
    titleKey: 'info',
    links: [
      { labelKey: 'ourStory', href: '/notre-histoire' },
      { labelKey: 'guestbook', href: '/livre-dor' },
      { labelKey: 'shippingReturns', href: '/livraison-retours' },
      { labelKey: 'faq', href: '/faq' },
      { labelKey: 'orderTracking', href: '/suivi' },
    ],
  },
]

const SOCIAL_ICONS = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </>
  ),
  facebook: (
    <path
      d="M14 8.5h2V5.5h-2.2C11.7 5.5 10.5 7 10.5 9v1.5H8.5v3h2V21h3v-7.5h2.2l.3-3h-2.5V9c0-.4.2-.5.5-.5z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  ),
  tiktok: (
    <path
      d="M14 4c.3 2.1 1.6 3.5 3.7 3.8v2.3c-1.3.1-2.5-.3-3.7-1v4.8a4.8 4.8 0 11-4.8-4.8c.3 0 .5 0 .8.1v2.4a2.4 2.4 0 102 2.4V4H14z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  ),
} as const

const LEGAL = [
  { labelKey: 'legal', href: '/mentions-legales' },
  { labelKey: 'privacy', href: '/confidentialite' },
  { labelKey: 'terms', href: '/cgv' },
]

export interface FooterProps {
  /** Logo géré via l'admin (SiteSettings). Si absent, repli sur le texte de marque. */
  logoUrl?: string | null
  siteName?: string
  /** Coordonnées globales gérées via l'admin (SiteSettings). */
  phone?: string | null
  email?: string | null
  address?: string | null
  social?: { instagram?: string | null; facebook?: string | null; tiktok?: string | null }
}

export function Footer({ siteName, phone, email, address, social }: FooterProps = {}) {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const year = new Date().getFullYear()
  const brand = siteName || t('Common.brand')

  // Réseaux sociaux : affichés seulement si une URL est configurée en admin.
  const socials = (
    [
      { label: 'Instagram', href: social?.instagram, icon: SOCIAL_ICONS.instagram },
      { label: 'Facebook', href: social?.facebook, icon: SOCIAL_ICONS.facebook },
      { label: 'TikTok', href: social?.tiktok, icon: SOCIAL_ICONS.tiktok },
    ] as { label: string; href: string | null | undefined; icon: React.ReactNode }[]
  ).filter((s): s is { label: string; href: string; icon: React.ReactNode } => Boolean(s.href))

  const contactEmail = email || 'contact@dardmana.com'
  const contactPhone = phone || '+212 6 00 00 00 00'

  return (
    <footer className="bg-[var(--vert-fonce)] text-[var(--creme)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:pe-6">
            <p aria-label={brand} className="font-titre text-2xl text-[var(--blanc)]">
              <span aria-hidden="true" className="font-light">Dar</span>{' '}
              <em aria-hidden="true" className="font-normal italic">Dmana</em>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--creme)]/75">
              {t('Footer.brandDesc')}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--creme)]/25',
                    'transition-colors duration-200 hover:border-[var(--or-royal)] hover:text-[var(--or-royal)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
                  )}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    {s.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Colonnes de liens */}
          {COLUMNS.map((col) => (
            <div key={col.titleKey}>
              <h3 className="font-corps text-xs font-semibold uppercase tracking-[0.18em] text-[var(--or-clair)]">
                {t(`Footer.${col.titleKey}`)}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={localizedHref(locale, link.href)}
                      className="text-sm text-[var(--creme)]/75 transition-colors hover:text-[var(--or-royal)]"
                    >
                      {t(`Footer.${link.labelKey}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="font-corps text-xs font-semibold uppercase tracking-[0.18em] text-[var(--or-clair)]">
              {t('Footer.contact')}
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-[var(--creme)]/75">
              <li>
                <a href={`mailto:${contactEmail}`} className="transition-colors hover:text-[var(--or-royal)]">
                  {contactEmail}
                </a>
              </li>
              <li>
                <a href={`tel:${contactPhone.replace(/[^+\d]/g, '')}`} className="transition-colors hover:text-[var(--or-royal)]">
                  {contactPhone}
                </a>
              </li>
              <li className="leading-relaxed">{address || t('Footer.location')}</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--creme)]/15 pt-6 sm:flex-row">
          <p className="text-xs text-[var(--creme)]/60">
            {t('Footer.copyright', { year })}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link
                  href={localizedHref(locale, l.href)}
                  className="text-xs text-[var(--creme)]/60 transition-colors hover:text-[var(--or-royal)]"
                >
                  {t(`Footer.${l.labelKey}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default Footer
