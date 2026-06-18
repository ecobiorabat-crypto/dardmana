/** Date relative localisée ("il y a 3 jours", "منذ 3 أيام", "3 days ago"). */
export function relativeTime(date: Date | string, locale: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const sec = Math.round((d.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 30, unit: 'day' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
  ]

  let value = sec
  for (const division of divisions) {
    if (Math.abs(value) < division.amount) {
      return rtf.format(Math.round(value), division.unit)
    }
    value /= division.amount
  }
  return rtf.format(Math.round(value), 'year')
}
