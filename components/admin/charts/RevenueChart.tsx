'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface RevenuePoint {
  date: string
  label: string
  revenue: number
  orders: number
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bordure)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--texte-doux)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--bordure)' }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--texte-doux)' }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            border: '1px solid var(--bordure)',
            borderRadius: 0,
            background: 'var(--blanc)',
            fontSize: 12,
          }}
          formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} MAD`, 'Revenus']}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--or-royal)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--vert-fonce)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default RevenueChart
