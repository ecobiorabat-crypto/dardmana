import { cn } from '@/lib/utils/cn'

/**
 * Loader de marque : spinner doré animé + « Dar Dmana » en dessous.
 * Composant pur (server & client), utilisé dans les loading.tsx génériques.
 */
export function BrandLoader({
  label = 'Chargement…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn('flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 pt-28', className)}
    >
      <span className="relative inline-flex h-12 w-12">
        {/* Anneau de fond discret */}
        <span className="absolute inset-0 rounded-full border-2 border-[var(--or-royal)]/20" aria-hidden="true" />
        {/* Arc doré animé */}
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--or-royal)] [animation:dd-spin_0.8s_linear_infinite] motion-reduce:animate-none"
          aria-hidden="true"
        />
      </span>
      <span className="font-titre text-sm tracking-[0.22em] text-[var(--or-royal)]">
        <span className="font-light">Dar</span> <em className="not-italic">Dmana</em>
      </span>
    </div>
  )
}

export default BrandLoader
