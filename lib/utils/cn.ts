/**
 * Concatène des classes conditionnelles sans dépendance externe.
 * Accepte des chaînes, des valeurs falsy (ignorées) et des objets
 * `{ classe: condition }`.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean | undefined | null>

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input))
      continue
    }

    for (const [key, value] of Object.entries(input)) {
      if (value) classes.push(key)
    }
  }

  return classes.join(' ')
}

export default cn
