'use client'

import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'

export interface ZoomImage {
  src: string
  alt: string
}

export interface ImageZoomProps {
  images: ZoomImage[]
  initialIndex?: number
  /** Facteur de zoom au survol desktop. */
  zoom?: number
  className?: string
}

const SWIPE_THRESHOLD = 48
const MAX_PINCH = 3

interface TouchPoint {
  clientX: number
  clientY: number
}

function distance(a: TouchPoint, b: TouchPoint): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

export function ImageZoom({
  images,
  initialIndex = 0,
  zoom = 2.2,
  className,
}: ImageZoomProps) {
  const t = useTranslations()
  const [index, setIndex] = useState(
    Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)),
  )
  const [hovering, setHovering] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const [pinchScale, setPinchScale] = useState(1)

  const frameRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{
    mode: 'none' | 'swipe' | 'pinch'
    startX: number
    startDist: number
    baseScale: number
  }>({ mode: 'none', startX: 0, startDist: 0, baseScale: 1 })

  const current = images[index]
  const hasMany = images.length > 1

  const goTo = useCallback(
    (next: number) => {
      if (images.length === 0) return
      const wrapped = (next + images.length) % images.length
      setIndex(wrapped)
      setPinchScale(1)
    },
    [images.length],
  )

  // ---- Desktop : zoom doux qui suit le curseur (style Rolex) ----
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
  }

  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(true)
  }
  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(false)
  }

  // ---- Mobile : swipe (1 doigt) + pinch-to-zoom (2 doigts) ----
  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      gesture.current = {
        mode: 'pinch',
        startX: 0,
        startDist: distance(event.touches[0], event.touches[1]),
        baseScale: pinchScale,
      }
    } else if (event.touches.length === 1) {
      gesture.current = {
        mode: 'swipe',
        startX: event.touches[0].clientX,
        startDist: 0,
        baseScale: pinchScale,
      }
    }
  }

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (g.mode === 'pinch' && event.touches.length === 2) {
      const dist = distance(event.touches[0], event.touches[1])
      const ratio = dist / (g.startDist || dist)
      const next = Math.max(1, Math.min(MAX_PINCH, g.baseScale * ratio))
      setPinchScale(next)
    }
  }

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (g.mode === 'swipe' && pinchScale === 1) {
      const endX = event.changedTouches[0]?.clientX ?? g.startX
      const delta = endX - g.startX
      if (Math.abs(delta) > SWIPE_THRESHOLD && hasMany) {
        goTo(delta < 0 ? index + 1 : index - 1)
      }
    }
    if (event.touches.length === 0) gesture.current.mode = 'none'
  }

  if (!current) return null

  const scale = pinchScale > 1 ? pinchScale : hovering ? zoom : 1
  const transformOrigin = pinchScale > 1 ? 'center center' : `${origin.x}% ${origin.y}%`

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        ref={frameRef}
        className={cn(
          'group relative aspect-[3/4] w-full overflow-hidden bg-[var(--gris-perle)]',
          'cursor-zoom-in touch-pan-y select-none',
        )}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="group"
        aria-roledescription={t('Gallery.roleDescription')}
        aria-label={t('Gallery.imagePosition', { index: index + 1, total: images.length })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.alt}
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none"
          style={{ transform: `scale(${scale})`, transformOrigin }}
        />

        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={t('Gallery.previous')}
              className={cn(
                'absolute start-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center',
                'bg-[var(--creme)]/85 text-[var(--vert-fonce)] backdrop-blur-sm',
                'opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="rtl-flip">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={t('Gallery.next')}
              className={cn(
                'absolute end-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center',
                'bg-[var(--creme)]/85 text-[var(--vert-fonce)] backdrop-blur-sm',
                'opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="rtl-flip">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {hasMany && (
        <div className="flex gap-2.5 overflow-x-auto pb-1" role="tablist" aria-label={t('Gallery.thumbnails')}>
          {images.map((image, i) => (
            <button
              key={`${image.src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={t('Gallery.viewImage', { index: i + 1 })}
              onClick={() => goTo(i)}
              className={cn(
                'relative h-20 w-16 shrink-0 overflow-hidden bg-[var(--gris-perle)]',
                'border transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
                i === index
                  ? 'border-[var(--or-royal)]'
                  : 'border-transparent hover:border-[var(--bordure)]',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageZoom
