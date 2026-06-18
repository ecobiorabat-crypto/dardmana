'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export interface RevealProps {
  children: ReactNode
  /** Décalage d'apparition (s). */
  delay?: number
  /** Direction d'entrée. */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
  /** Rejoue l'animation à chaque entrée dans le viewport. */
  once?: boolean
}

const OFFSET: Record<NonNullable<RevealProps['direction']>, { x: number; y: number }> = {
  up: { x: 0, y: 32 },
  down: { x: 0, y: -32 },
  left: { x: 32, y: 0 },
  right: { x: -32, y: 0 },
  none: { x: 0, y: 0 },
}

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className,
  once = true,
}: RevealProps) {
  const offset = OFFSET[direction]

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
