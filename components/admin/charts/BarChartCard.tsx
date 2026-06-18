'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export interface BarDatum {
  label: string
  value: number
}

const COLORS = ['#c9a84c', '#1a5c2a', '#2d8c3e', '#e8c97a', '#8b6914', '#a0b89a', '#d4b562', '#3a6b48', '#bfa050', '#56795f']

export function BarChartCard({ data, unit = '' }: { data: BarDatum[]; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bordure)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--texte-doux)' }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--texte)' }}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          contentStyle={{ border: '1px solid var(--bordure)', borderRadius: 0, background: 'var(--blanc)', fontSize: 12 }}
          formatter={(value) => [`${Number(value).toLocaleString('fr-FR')}${unit}`, '']}
          cursor={{ fill: 'var(--gris-perle)' }}
        />
        <Bar dataKey="value" radius={[0, 2, 2, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default BarChartCard
