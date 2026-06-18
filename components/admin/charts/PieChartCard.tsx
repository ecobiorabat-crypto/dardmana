'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export interface PieDatum {
  label: string
  value: number
}

const COLORS = ['#1a5c2a', '#c9a84c', '#2d8c3e', '#e8c97a', '#8b6914', '#a0b89a', '#56795f']

export function PieChartCard({ data }: { data: PieDatum[] }) {
  if (!data.length) {
    return <p className="py-12 text-center text-sm text-[var(--texte-doux)]">Aucune donnée</p>
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={55}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ border: '1px solid var(--bordure)', borderRadius: 0, background: 'var(--blanc)', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default PieChartCard
