'use client'

import { useEffect, useRef, useState } from 'react'
import { useFinePointer } from './hooks'
import { cn } from '@/lib/utils/cn'

const CLICKABLE = 'a, button, [role="button"], input, select, textarea, label, [data-cursor="grow"]'

export function CursorEffect() {
  const dotRef = useRef<HTMLDivElement>(null)
  const enabled = useFinePointer()
  const [active, setActive] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let rafId = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2

    const apply = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      }
      rafId = 0
    }

    const onMove = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
      setVisible(true)
      const target = e.target as Element | null
      setActive(Boolean(target?.closest?.(CLICKABLE)))
      if (!rafId) rafId = requestAnimationFrame(apply)
    }

    const onLeave = () => setVisible(false)

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed left-0 top-0 z-[300] hidden rounded-full md:block',
        'bg-[var(--or-royal)] mix-blend-multiply',
        'transition-[width,height,opacity] duration-200 ease-out',
        'motion-reduce:transition-none',
        active ? 'h-7 w-7 opacity-40' : 'h-2.5 w-2.5 opacity-80',
        visible ? '' : 'opacity-0',
      )}
    />
  )
}

export default CursorEffect
