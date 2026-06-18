/**
 * Helpers cookies isolés hors des composants/hooks
 * (l'écriture de `document.cookie` dans un composant déclenche
 * la règle react-hooks/immutability).
 */
export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
}

export function hasCookie(name: string): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c.startsWith(`${name}=`))
}
