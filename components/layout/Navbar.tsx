'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useUiStore } from '@/store/ui'
import { NAV_LINKS, localizedHref, useCurrentLocale } from './nav'
import { useHydrated, useScrolled } from './hooks'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileMenu } from './MobileMenu'
import { CartDrawer } from './CartDrawer'
import { SearchModal } from './SearchModal'
import { cn } from '@/lib/utils/cn'

const SCROLL_THRESHOLD = 80

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'absolute -end-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1',
        'bg-[var(--or-royal)] text-[0.6rem] font-semibold text-[var(--noir)]',
      )}
      aria-hidden="true"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function IconButton({
  label,
  onClick,
  href,
  children,
  count,
}: {
  label: string
  onClick?: () => void
  href?: string
  children: React.ReactNode
  count?: number
}) {
  const className = cn(
    'relative inline-flex h-10 w-10 items-center justify-center text-current',
    'transition-opacity duration-200 hover:opacity-70',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)] focus-visible:ring-offset-2',
  )
  const content = (
    <>
      {children}
      {typeof count === 'number' && <CountBadge count={count} />}
    </>
  )
  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} className={className}>
      {content}
    </button>
  )
}

export interface NavbarProps {
  /** Logo géré via l'admin (SiteSettings). Si absent, repli sur le texte de marque. */
  logoUrl?: string | null
  siteName?: string
}

export function Navbar({ logoUrl, siteName }: NavbarProps = {}) {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const brand = siteName || t('Common.brand')
  const pathname = usePathname() || '/'
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`
  const scrolled = useScrolled(SCROLL_THRESHOLD)
  const mounted = useHydrated()
  const solid = scrolled || !isHome

  const openCart = useCartStore((s) => s.openCart)
  const cartItems = useCartStore((s) => s.items)
  const wishlistItems = useWishlistStore((s) => s.items)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const setMobileMenuOpen = useUiStore((s) => s.setMobileMenuOpen)

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const wishlistCount = wishlistItems.length

  return (
    <>
      <header
        className={cn(
          'relative w-full text-[var(--creme)]',
          'transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-out',
          solid
            ? 'bg-[var(--vert-fonce)] shadow-[0_10px_30px_-18px_rgba(20,19,15,0.6)]'
            : 'bg-transparent',
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
          {/* --- Mobile : hamburger --- */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label={t('Nav.menu')}
            className="inline-flex h-10 w-10 items-center justify-center text-current transition-opacity hover:opacity-70 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* --- Logo (gauche desktop, centre mobile) --- */}
          <Link
            href={localizedHref(locale, '/')}
            aria-label={`${brand} — ${t('Nav.home')}`}
            className={cn(
              'flex items-center',
              'absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0',
            )}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={brand}
                width={160}
                height={44}
                priority
                className="h-8 w-auto object-contain lg:h-10"
              />
            ) : (
              <span className="font-titre text-2xl tracking-wide text-[var(--or-royal)] lg:text-3xl">
                {brand}
              </span>
            )}
          </Link>

          {/* --- Liens centre (desktop) --- */}
          <ul className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={localizedHref(locale, link.href)}
                  className={cn(
                    'relative text-xs font-medium uppercase tracking-[0.16em] text-current',
                    'after:absolute after:-bottom-1.5 after:start-0 after:h-px after:w-0 after:bg-[var(--or-royal)]',
                    'after:transition-all after:duration-300 hover:after:w-full',
                  )}
                >
                  {t(`Nav.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>

          {/* --- Droite --- */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <IconButton label={t('Nav.search')} onClick={() => setSearchOpen(true)} count={undefined}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </IconButton>

            <span className="hidden md:inline-flex">
              <IconButton
                label={t('Nav.wishlist')}
                href={localizedHref(locale, '/favoris')}
                count={mounted ? wishlistCount : 0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 20s-7-4.35-9.2-8.3C1.3 8.9 2.6 5.8 5.6 5.2c1.9-.4 3.5.6 4.4 2 .9-1.4 2.5-2.4 4.4-2 3 .6 4.3 3.7 2.8 6.5C19 15.65 12 20 12 20z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
            </span>

            <IconButton label={t('Nav.cart')} onClick={openCart} count={mounted ? cartCount : 0}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6h15l-1.5 9h-12L5 3H2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="20" r="1.4" fill="currentColor" />
                <circle cx="18" cy="20" r="1.4" fill="currentColor" />
              </svg>
            </IconButton>
          </div>
        </nav>
      </header>

      <MobileMenu />
      <CartDrawer />
      <SearchModal />
    </>
  )
}

export default Navbar
