import type { ReactNode } from 'react'
import { orderStatusMeta } from '@/lib/utils/order-status'
import { cn } from '@/lib/utils/cn'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-titre text-2xl text-[var(--vert-fonce)] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--texte-doux)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border border-[var(--bordure)] bg-[var(--blanc)] p-5', className)}>{children}</div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  accent,
}: {
  label: string
  value: string
  hint?: string
  trend?: { value: string; positive: boolean }
  accent?: 'gold' | 'green' | 'red'
}) {
  const bar =
    accent === 'red' ? 'var(--erreur)' : accent === 'green' ? 'var(--vert-moyen)' : 'var(--or-royal)'
  return (
    <div className="relative overflow-hidden border border-[var(--bordure)] bg-[var(--blanc)] p-5">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: bar }} />
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--texte-doux)]">{label}</p>
      <p className="mt-2 font-titre text-3xl text-[var(--vert-fonce)]">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend && (
          <span className={cn('text-xs', trend.positive ? 'text-[var(--vert-moyen)]' : 'text-[var(--erreur)]')}>
            {trend.positive ? '▲' : '▼'} {trend.value}
          </span>
        )}
        {hint && <span className="text-xs text-[var(--texte-doux)]">{hint}</span>}
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const meta = orderStatusMeta(status)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
      style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'var(--alerte)' },
  PAID: { label: 'Payé', color: 'var(--vert-moyen)' },
  FAILED: { label: 'Échoué', color: 'var(--erreur)' },
  REFUNDED: { label: 'Remboursé', color: 'var(--texte-doux)' },
}

export function PaymentBadge({ status }: { status: string }) {
  const meta = PAYMENT_STATUS_LABELS[status] ?? { label: status, color: 'var(--texte-doux)' }
  return (
    <span className="text-xs" style={{ color: meta.color }}>
      {meta.label}
    </span>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--bordure)] py-16 text-center">
      <p className="font-titre text-lg text-[var(--vert-fonce)]">{title}</p>
      {hint && <p className="max-w-sm text-sm text-[var(--texte-doux)]">{hint}</p>}
    </div>
  )
}
