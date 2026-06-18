'use client'

import { ImageZoom } from '@/components/ui/ImageZoom'
import { cn } from '@/lib/utils/cn'

export interface ImageGalleryProps {
  images: string[]
  alt: string
  className?: string
}

/**
 * Galerie produit : image principale avec zoom (style Rolex), miniatures et
 * swipe mobile (délégués à <ImageZoom>). Affiche un repli élégant sans image.
 */
export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const valid = images.filter(Boolean)

  if (valid.length === 0) {
    return (
      <div
        className={cn(
          'flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-[var(--vert-fonce)] to-[var(--vert-moyen)]',
          className,
        )}
      >
        <span className="font-titre text-6xl text-[var(--or-clair)]/40">DD</span>
      </div>
    )
  }

  return (
    <div className={className}>
      <ImageZoom images={valid.map((src) => ({ src, alt }))} />
    </div>
  )
}

export default ImageGallery
