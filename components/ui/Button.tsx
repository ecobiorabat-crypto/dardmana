'use client'

import Link from 'next/link'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type ButtonVariant = 'gold' | 'dark' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  /** Si défini, le bouton est rendu comme un lien `next/link`. */
  href?: string
  className?: string
}

const VARIANTS: Record<ButtonVariant, string> = {
  gold: cn(
    'bg-[var(--or-royal)] text-[var(--noir)] border border-[var(--or-royal)]',
    'hover:bg-[var(--or-clair)] hover:border-[var(--or-clair)]',
    'shadow-[0_1px_2px_rgba(20,19,15,0.12)]',
  ),
  dark: cn(
    'bg-[var(--vert-fonce)] text-[var(--creme)] border border-[var(--vert-fonce)]',
    'hover:bg-[var(--vert-moyen)] hover:border-[var(--vert-moyen)]',
  ),
  outline: cn(
    'bg-transparent text-[var(--vert-fonce)] border border-[var(--or-royal)]',
    'hover:bg-[var(--creme)]',
  ),
  ghost: cn(
    'bg-transparent text-[var(--vert-fonce)] border border-transparent',
    'hover:bg-[var(--gris-perle)]',
  ),
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[0.7rem] gap-1.5',
  md: 'h-11 px-6 text-xs gap-2',
  lg: 'h-14 px-9 text-sm gap-2.5',
}

const BASE = cn(
  'relative inline-flex items-center justify-center select-none',
  'font-corps font-medium uppercase tracking-[0.18em]',
  'rounded-none cursor-pointer whitespace-nowrap align-middle',
  'transition-[transform,opacity,background-color,border-color,box-shadow] duration-300 ease-out',
  'hover:-translate-y-px active:translate-y-0 active:opacity-90',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)] focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
)

function Spinner({ size }: { size: ButtonSize }) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  return (
    <span
      aria-hidden="true"
      className={cn(
        dim,
        'inline-block rounded-full border-2 border-current border-t-transparent',
        '[animation:dd-spin_0.7s_linear_infinite] motion-reduce:animate-none',
      )}
    />
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      variant = 'gold',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      href,
      className,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading
    const classes = cn(
      BASE,
      VARIANTS[variant],
      SIZES[size],
      fullWidth ? 'w-full' : '',
      className,
    )

    const content = (
      <>
        {loading && <Spinner size={size} />}
        <span className={cn('inline-flex items-center', loading ? 'opacity-90' : '')}>
          {children}
        </span>
      </>
    )

    if (href && !isDisabled) {
      const { onClick } = rest
      return (
        <Link
          href={href}
          className={classes}
          aria-busy={loading || undefined}
          onClick={onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
        >
          {content}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...rest}
      >
        {content}
      </button>
    )
  },
)

export default Button
