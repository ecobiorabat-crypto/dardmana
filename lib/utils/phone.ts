/**
 * Normalise un numéro marocain au format international (+212…).
 * Exemples : 0612345678 → +212612345678 ; 06 12 34 56 78 → +212612345678 ;
 * +212661122334 → inchangé ; 00212… → +212…
 */
export function normalizePhone(raw: string): string {
  const p = raw.replace(/[\s.\-()/]/g, '') // retire espaces, points, tirets, parenthèses, slashs
  if (!p) return ''
  if (p.startsWith('+')) return p // déjà international
  if (p.startsWith('00')) return '+' + p.slice(2) // 00212… → +212…
  if (p.startsWith('212')) return '+' + p // 212… → +212…
  if (p.startsWith('0')) return '+212' + p.slice(1) // 0612345678 → +212612345678
  return '+212' + p // numéro local sans 0 (ex : 612345678) → suppose MA
}
