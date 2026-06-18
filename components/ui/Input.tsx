'use client'

import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'placeholder'> {
  label: string
  error?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
  className?: string
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    iconLeft,
    iconRight,
    id,
    disabled,
    required,
    className,
    containerClassName,
    ...rest
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hasError = Boolean(error)

  return (
    <div className={cn('w-full', containerClassName)}>
      <div className="relative">
        {iconLeft && (
          <span
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--texte-doux)]"
            aria-hidden="true"
          >
            {iconLeft}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          placeholder=" "
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            'peer block w-full appearance-none bg-transparent',
            'h-14 rounded-none border-0 border-b',
            'pt-5 pb-1.5 text-[0.95rem] text-[var(--texte)]',
            'transition-colors duration-200 outline-none',
            'placeholder:text-transparent',
            iconLeft ? 'ps-10' : 'px-0.5',
            iconRight ? 'pe-10' : '',
            hasError
              ? 'border-[var(--erreur)] focus:border-[var(--erreur)]'
              : 'border-[var(--bordure)] focus:border-[var(--or-royal)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...rest}
        />

        <label
          htmlFor={inputId}
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 origin-left',
            'font-corps text-[0.95rem] text-[var(--texte-doux)]',
            'transition-all duration-200 ease-out',
            iconLeft ? 'start-10' : 'start-0.5',
            // Position flottante : champ focus OU rempli
            'peer-focus:top-2 peer-focus:start-0.5 peer-focus:translate-y-0 peer-focus:text-[0.7rem] peer-focus:tracking-[0.12em] peer-focus:uppercase',
            'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:start-0.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[0.7rem] peer-[:not(:placeholder-shown)]:tracking-[0.12em] peer-[:not(:placeholder-shown)]:uppercase',
            hasError
              ? 'text-[var(--erreur)] peer-focus:text-[var(--erreur)]'
              : 'peer-focus:text-[var(--or-royal)]',
          )}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>

        {iconRight && (
          <span
            className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[var(--texte-doux)]"
            aria-hidden="true"
          >
            {iconRight}
          </span>
        )}
      </div>

      {hasError && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-[var(--erreur)]">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
