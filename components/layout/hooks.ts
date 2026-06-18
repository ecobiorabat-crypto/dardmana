'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/** `true` une fois l'hydratation client effectuée (sans setState dans un effet). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

/** Indique si la page a défilé au-delà du seuil fourni. */
export function useScrolled(threshold: number): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('scroll', onChange, { passive: true })
      return () => window.removeEventListener('scroll', onChange)
    },
    () => window.scrollY > threshold,
    () => false,
  )
}

/** Indique si le pointeur est fin (souris) — désactivé sur écran tactile. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia('(pointer: fine)')
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia('(pointer: fine)').matches,
    () => false,
  )
}
