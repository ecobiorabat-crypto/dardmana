'use client'

import Link from 'next/link'
import Image from 'next/image'
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
      { labelKey: 'bestSellers', href: '/collections/best-sellers' },
      { labelKey: 'limitedEditions', href: '/collections/editions-limitees' },
      { labelKey: 'allCollections', href: '/collections' },
    ],
  },
  {
    titleKey: 'info',
    links: [
      { labelKey: 'ourStory', href: '/notre-histoire' },
      { labelKey: 'guestbook', href: '/livre-dor' },
      { labelKey: 'shippingReturns', href: '/livraison' },
      { labelKey: 'faq', href: '/faq' },
      { labelKey: 'orderTracking', href: '/suivi' },
    ],
  },
]

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <path
        d="M14 8.5h2V5.5h-2.2C11.7 5.5 10.5 7 10.5 9v1.5H8.5v3h2V21h3v-7.5h2.2l.3-3h-2.5V9c0-.4.2-.5.5-.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/',
    icon: (
      <path
        d="M4 20l1.3-3.8A7.5 7.5 0 1118.5 19a7.6 7.6 0 01-5.5 1.1L4 20z M9 9.5c0 4 3 6 5.5 6 .8 0 1.5-.6 1.7-1.2.1-.3 0-.5-.2-.6l-1.5-.7c-.2-.1-.4 0-.6.2l-.4.5c-1-.4-1.8-1.2-2.2-2.2l.5-.4c.2-.2.3-.4.2-.6l-.7-1.5c-.1-.2-.3-.3-.6-.2-.6.2-1.2.9-1.2 1.7z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    ),
  },
]

const LEGAL = [
  { labelKey: 'legal', href: '/mentions-legales' },
  { labelKey: 'privacy', href: '/confidentialite' },
  { labelKey: 'terms', href: '/cgv' },
]

export interface FooterProps {
  /** Logo géré via l'admin (SiteSettings). Si absent, repli sur le texte de marque. */
  logoUrl?: string | null
  siteName?: string
}

export function Footer({ logoUrl, siteName }: FooterProps = {}) {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const year = new Date().getFullYear()
  const brand = siteName || t('Common.brand')

  return (
    <footer className="bg-[var(--vert-fonce)] text-[var(--creme)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:pe-6">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={brand}
                width={160}
                height={44}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <p className="font-titre text-2xl text-[var(--or-royal)]">{brand}</p>
            )}
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--creme)]/75">
              {t('Footer.brandDesc')}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((s) => (
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
                <a href="mailto:contact@dardmana.com" className="transition-colors hover:text-[var(--or-royal)]">
                  contact@dardmana.com
                </a>
              </li>
              <li>
                <a href="tel:+212600000000" className="transition-colors hover:text-[var(--or-royal)]">
                  +212 6 00 00 00 00
                </a>
              </li>
              <li className="leading-relaxed">{t('Footer.location')}</li>
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
