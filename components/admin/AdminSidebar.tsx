'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { hasPermission, ROLE_LABELS, type AdminRole, type Permission } from '@/lib/auth/permissions'
import { cn } from '@/lib/utils/cn'

interface SubItem {
  href: string
  label: string
  permission?: Permission
}

interface NavItem {
  href: string
  label: string
  icon: string
  permission?: Permission
  children?: SubItem[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Ventes',
    items: [
      { href: '/admin', label: 'Dashboard', icon: 'M4 13h6V4H4v9zM14 20h6V4h-6v16zM4 20h6v-5H4v5z' },
      {
        href: '/admin/commandes',
        label: 'Commandes',
        icon: 'M6 2h9l5 5v15H6V2zM14 2v6h6',
        permission: 'orders.view',
        children: [
          { href: '/admin/commandes/nouvelle', label: 'Nouvelle commande', permission: 'orders.update' },
        ],
      },
      { href: '/admin/operations', label: 'Opérations', icon: 'M3 7h13l3 4v6H3V7zM16 17a2 2 0 100-4 2 2 0 000 4zM7 17a2 2 0 100-4 2 2 0 000 4z', permission: 'operations.view' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      {
        href: '/admin/produits',
        label: 'Produits',
        icon: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7',
        permission: 'products.view',
        children: [
          { href: '/admin/produits/nouveau', label: 'Nouveau produit', permission: 'products.create' },
        ],
      },
      { href: '/admin/categories', label: 'Catégories', icon: 'M4 6h7l2 3h7v11H4V6zM9 6V4h6v2', permission: 'products.view' },
      { href: '/admin/stock', label: 'Stock', icon: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01', permission: 'products.view' },
    ],
  },
  {
    title: 'Clients',
    items: [
      { href: '/admin/clients', label: 'Clients', icon: 'M16 20v-2a4 4 0 00-8 0v2M12 11a3 3 0 100-6 3 3 0 000 6z', permission: 'customers.view' },
      { href: '/admin/livre-dor', label: "Livre d'Or", icon: 'M21 11.5a8.5 8.5 0 01-12.5 7.5L3 21l2-5A8.5 8.5 0 1121 11.5z', permission: 'cms.update' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { href: '/admin/coupons', label: 'Coupons', icon: 'M3 9l1-3h16l1 3v2a2 2 0 000 4v2l-1 3H4l-1-3v-2a2 2 0 000-4V9zM12 7v10', permission: 'coupons.update' },
      { href: '/admin/analytics', label: 'Analytics', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2', permission: 'analytics.view' },
    ],
  },
  {
    title: 'Contenu',
    items: [
      { href: '/admin/cms/homepage', label: 'Page d’accueil', icon: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10', permission: 'cms.update' },
      { href: '/admin/cms', label: 'Pages CMS', icon: 'M6 2h9l5 5v15H6V2zM14 2v6h6M9 13h6M9 17h6', permission: 'cms.update' },
      { href: '/admin/parametres/stats-marque', label: 'Stats marque', icon: 'M3 17l6-6 4 4 8-8M16 7h5v5', permission: 'cms.update' },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { href: '/admin/parametres/general', label: 'Général', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L14.5 2h-5l-.3 2.9a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.3 2.9h5l.3-2.9a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1z', permission: 'cms.update' },
      { href: '/admin/parametres/livraison', label: 'Livraison', icon: 'M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 100-4 2 2 0 000 4zM18 19a2 2 0 100-4 2 2 0 000 4z', permission: 'cms.update' },
      { href: '/admin/parametres/admins', label: 'Admins', icon: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z', permission: 'admin.users' },
    ],
  },
]

export function AdminSidebar({
  name,
  email,
  role,
  pendingGuestbook = 0,
}: {
  name: string
  email: string
  role: AdminRole
  pendingGuestbook?: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const can = (p?: Permission) => !p || hasPermission(role, p)

  // Sections visibles selon les permissions (parents + sous-items filtrés).
  const visibleSections = SECTIONS.map((section) => ({
    title: section.title,
    items: section.items
      .filter((item) => can(item.permission))
      .map((item) => ({ ...item, children: item.children?.filter((c) => can(c.permission)) })),
  })).filter((section) => section.items.length > 0)

  // Lien actif = celui dont le href est le plus long préfixe du chemin courant
  // (évite le double-surlignage entre /admin/cms et /admin/cms/homepage, ou
  // entre un parent et son sous-item /nouvelle, /nouveau…).
  const allHrefs: string[] = []
  for (const s of visibleSections) {
    for (const it of s.items) {
      allHrefs.push(it.href)
      for (const c of it.children ?? []) allHrefs.push(c.href)
    }
  }
  const matches = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/')
  const activeHref = allHrefs
    .filter(matches)
    .reduce<string | null>((best, h) => (!best || h.length > best.length ? h : best), null)

  const handleLogout = async () => {
    await fetch('/api/auth/admin/logout', { method: 'POST' }).catch(() => {})
    router.push('/admin/login')
    router.refresh()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[var(--vert-fonce)] text-[var(--creme)]">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="font-titre text-xl text-[var(--or-clair)]">Dar Dmana</p>
        <p className="text-[0.65rem] uppercase tracking-[0.24em] text-[var(--creme)]/60">Administration</p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <div key={section.title}>
            {/* Titre séparateur de section */}
            <p className="px-3 pb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[var(--creme)]/40">
              {section.title}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                      activeHref === item.href
                        ? 'bg-white/10 text-[var(--or-clair)]'
                        : 'text-[var(--creme)]/80 hover:bg-white/5 hover:text-[var(--creme)]',
                    )}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d={item.icon} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/admin/livre-dor' && pendingGuestbook > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--erreur)] px-1.5 text-[0.65rem] font-semibold text-white">
                        {pendingGuestbook > 99 ? '99+' : pendingGuestbook}
                      </span>
                    )}
                  </Link>

                  {/* Sous-items en retrait sous le parent */}
                  {item.children && item.children.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center gap-2 rounded-md py-2 pe-3 ps-10 text-[0.8rem] transition-colors',
                            activeHref === child.href
                              ? 'bg-white/10 text-[var(--or-clair)]'
                              : 'text-[var(--creme)]/60 hover:bg-white/5 hover:text-[var(--creme)]',
                          )}
                        >
                          <span aria-hidden="true" className="text-[var(--creme)]/35">↳</span>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3">
          <p className="truncate text-sm text-[var(--creme)]">{name}</p>
          <p className="truncate text-xs text-[var(--creme)]/60">{email}</p>
          <p className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-[var(--or-clair)]">
            {ROLE_LABELS[role] ?? role}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--creme)]/80 transition-colors hover:bg-white/5 hover:text-[var(--creme)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Topbar mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--bordure)] bg-[var(--vert-fonce)] px-4 py-3 text-[var(--creme)] lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <p className="font-titre text-lg text-[var(--or-clair)]">Dar Dmana</p>
        <span className="w-6" />
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%]">{sidebarContent}</div>
        </div>
      )}
    </>
  )
}

export default AdminSidebar
