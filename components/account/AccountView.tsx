'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/client'
import { createClient } from '@/lib/supabase/client'
import { useWishlistStore } from '@/store/wishlist'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatMad } from '@/lib/utils/price'
import { orderStatusMeta } from '@/lib/utils/order-status'
import type { ProductCardData } from '@/lib/utils/product'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'
import { useUiStore } from '@/store/ui'
import { cn } from '@/lib/utils/cn'

type Tab = 'orders' | 'profile' | 'addresses' | 'wishlist'

interface OrderRow {
  id: string
  orderNumber: string
  orderStatus: string
  totalMad: number | string
  createdAt: string
  orderItems: { productName: string; productImage: string; quantity: number }[]
}

const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'orders', labelKey: 'Account.orders' },
  { key: 'profile', labelKey: 'Account.profile' },
  { key: 'addresses', labelKey: 'Account.addresses' },
  { key: 'wishlist', labelKey: 'Account.wishlist' },
]

export function AccountView() {
  const t = useTranslations()
  const locale = useCurrentLocale()
  const router = useRouter()
  const showToast = useUiStore((s) => s.showToast)
  const wishlistIds = useWishlistStore((s) => s.items)

  const [tab, setTab] = useState<Tab>('orders')
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [wishlistProducts, setWishlistProducts] = useState<ProductCardData[] | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ''))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/orders', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (tab !== 'wishlist' || wishlistProducts !== null) return
    const controller = new AbortController()
    fetch('/api/products?limit=100', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        const all: ProductCardData[] = d.products ?? []
        setWishlistProducts(all.filter((p) => wishlistIds.includes(p.id)))
      })
      .catch(() => setWishlistProducts([]))
    return () => controller.abort()
  }, [tab, wishlistProducts, wishlistIds])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch {
      /* ignore */
    }
    router.push(localizedHref(locale, '/auth/login'))
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
      {/* Sidebar tabs */}
      <aside>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'whitespace-nowrap border-s-2 px-4 py-2.5 text-start text-sm transition-colors',
                tab === item.key
                  ? 'border-[var(--or-royal)] text-[var(--vert-fonce)]'
                  : 'border-transparent text-[var(--texte-doux)] hover:text-[var(--texte)]',
              )}
            >
              {t(item.labelKey)}
            </button>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap border-s-2 border-transparent px-4 py-2.5 text-start text-sm text-[var(--texte-doux)] hover:text-[var(--erreur)]"
          >
            {t('Account.logout')}
          </button>
        </nav>
      </aside>

      <div>
        {tab === 'orders' && (
          <div>
            <h2 className="mb-6 font-titre text-2xl text-[var(--vert-fonce)]">{t('Account.orders')}</h2>
            {orders === null ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="card" />)}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-[var(--texte-doux)]">{t('Account.noOrders')}</p>
            ) : (
              <ul className="space-y-4">
                {orders.map((o) => {
                  const meta = orderStatusMeta(o.orderStatus)
                  return (
                    <li key={o.id}>
                      <Link
                        href={localizedHref(locale, `/compte/commandes/${o.id}`)}
                        className="flex items-center gap-4 border border-[var(--bordure)] p-4 transition-colors hover:border-[var(--or-royal)]"
                      >
                        <div className="flex -space-x-3">
                          {o.orderItems.slice(0, 3).map((it, idx) => (
                            <div key={idx} className="relative h-12 w-10 overflow-hidden border border-[var(--blanc)] bg-[var(--gris-perle)]">
                              {it.productImage ? (
                                <Image src={it.productImage} alt="" fill sizes="40px" className="object-cover" />
                              ) : null}
                            </div>
                          ))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--texte)]">{o.orderNumber}</p>
                          <p className="text-xs text-[var(--texte-doux)]">
                            {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: meta.color }}>
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: meta.color }} />
                          {t(`OrderStatus.${o.orderStatus}`)}
                        </span>
                        <span className="hidden text-sm font-medium sm:block">{formatMad(Number(o.totalMad))}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="max-w-md">
            <h2 className="mb-6 font-titre text-2xl text-[var(--vert-fonce)]">{t('Account.profile')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                showToast(t('Account.profileUpdated'), 'success')
              }}
              className="space-y-5"
            >
              <Input label={t('Account.email')} type="email" value={email} disabled />
              <Input label={t('Account.name')} value={name} onChange={(e) => setName(e.target.value)} />
              <Input label={t('Account.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button type="submit" variant="dark" size="md">{t('Common.save')}</Button>
            </form>
          </div>
        )}

        {tab === 'addresses' && (
          <div>
            <h2 className="mb-6 font-titre text-2xl text-[var(--vert-fonce)]">{t('Account.addresses')}</h2>
            <div className="border border-dashed border-[var(--bordure)] p-10 text-center">
              <p className="text-sm text-[var(--texte-doux)]">
                {t('Account.noAddresses')}
              </p>
            </div>
          </div>
        )}

        {tab === 'wishlist' && (
          <div>
            <h2 className="mb-6 font-titre text-2xl text-[var(--vert-fonce)]">{t('Account.wishlist')}</h2>
            {wishlistProducts === null ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="product" />)}
              </div>
            ) : wishlistProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="text-sm text-[var(--texte-doux)]">{t('Account.noWishlist')}</p>
                <Button href={localizedHref(locale, '/catalogue')} variant="outline" size="md">
                  {t('Cart.discoverCatalogue')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
                {wishlistProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountView
