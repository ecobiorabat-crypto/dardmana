'use client'

import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

const MAX_IMAGES = 8
const MAX_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 30 * 1024 * 1024
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime']
const ACCEPT = IMAGE_MIME.join(',')

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/video/upload/')
}

export interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  /** Endpoint d'upload (défaut : route admin). */
  endpoint?: string
  /** Envoyer le cookie de session (défaut : true, requis pour la route admin). */
  withCredentials?: boolean
  /** Autoriser aussi les vidéos courtes (preview vidéo + MIME vidéo). */
  allowVideo?: boolean
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function validateFile(file: File, allowVideo: boolean): string | null {
  const isImage = IMAGE_MIME.includes(file.type)
  const isVideo = allowVideo && VIDEO_MIME.includes(file.type)
  if (!isImage && !isVideo) {
    return `${file.name} : format non supporté (${allowVideo ? 'JPG, PNG, WebP, MP4, WebM' : 'JPG, PNG ou WebP'}).`
  }
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_BYTES
  if (file.size > limit) {
    return `${file.name} : fichier trop volumineux (max ${isVideo ? '30' : '5'} Mo).`
  }
  return null
}

export function ImageUploader({
  images,
  onChange,
  maxImages = MAX_IMAGES,
  endpoint = '/api/admin/upload',
  withCredentials = true,
  allowVideo = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const remaining = maxImages - images.length

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null)
      const list = Array.from(files)
      if (list.length === 0) return

      if (remaining <= 0) {
        setError(`Maximum ${maxImages} images.`)
        return
      }

      const batch = list.slice(0, remaining)
      const validationErrors = batch.map((f) => validateFile(f, allowVideo)).filter(Boolean) as string[]
      if (validationErrors.length > 0) {
        setError(validationErrors[0])
        return
      }

      setUploading(true)
      const uploaded: string[] = []

      try {
        for (const file of batch) {
          const formData = new FormData()
          formData.append('file', file)

          const res = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            credentials: withCredentials ? 'include' : 'same-origin',
          })

          const data = (await res.json()) as { url?: string; error?: string }
          if (!res.ok || !data.url) {
            throw new Error(data.error ?? 'Échec du téléversement')
          }

          if (!images.includes(data.url) && !uploaded.includes(data.url)) {
            uploaded.push(data.url)
          }
        }

        if (uploaded.length > 0) {
          onChange([...images, ...uploaded].slice(0, maxImages))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Échec du téléversement')
        if (uploaded.length > 0) {
          onChange([...images, ...uploaded].slice(0, maxImages))
        }
      } finally {
        setUploading(false)
      }
    },
    [images, maxImages, onChange, remaining],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const reorderFrom = e.dataTransfer.getData('application/x-dd-image-index')
    if (reorderFrom !== '') {
      const from = Number(reorderFrom)
      const to = dropIndex ?? from
      if (!Number.isNaN(from) && from !== to) {
        const next = [...images]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        onChange(next)
      }
      setDragIndex(null)
      setDropIndex(null)
      return
    }

    if (uploading || remaining <= 0) return
    void uploadFiles(e.dataTransfer.files)
  }

  const removeImage = (url: string) => onChange(images.filter((u) => u !== url))

  const addUrl = () => {
    setError(null)
    const url = manualUrl.trim()
    if (!url) return
    if (!isValidImageUrl(url)) {
      setError('URL invalide.')
      return
    }
    if (images.includes(url)) {
      setError('Cette URL est déjà ajoutée.')
      return
    }
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images.`)
      return
    }
    onChange([...images, url])
    setManualUrl('')
  }

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-[var(--erreur)]/40 bg-[color-mix(in_srgb,var(--erreur)_8%,transparent)] px-3 py-2 text-sm text-[var(--erreur)]">
          {error}
        </div>
      )}

      {/* Zone drag-and-drop + sélection fichiers */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!uploading && remaining > 0) setDragOver(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false)
        }}
        onDrop={onDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver
            ? 'border-[var(--or-royal)] bg-[color-mix(in_srgb,var(--or-royal)_8%,transparent)]'
            : 'border-[var(--bordure)] bg-[var(--gris-perle)]/30',
          (uploading || remaining <= 0) && 'pointer-events-none opacity-60',
        )}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[var(--texte-doux)]">
          <path
            d="M12 16V8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-[var(--texte)]">
            {uploading ? 'Téléversement en cours…' : 'Glissez vos images ici'}
          </p>
          <p className="mt-1 text-xs text-[var(--texte-doux)]">
            JPG, PNG ou WebP — max 5 Mo — {remaining} emplacement{remaining !== 1 ? 's' : ''} restant{remaining !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          disabled={uploading || remaining <= 0}
          onClick={() => inputRef.current?.click()}
          className="border border-[var(--vert-fonce)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)] disabled:opacity-50"
        >
          Choisir des fichiers
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={allowVideo ? `${ACCEPT},${VIDEO_MIME.join(',')}` : ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* Grille previews + réordonnancement */}
      {images.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-[var(--texte-doux)]">
            Glissez pour réordonner — la première image est la principale.
          </p>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div
                key={url}
                draggable
                onDragStart={(e) => {
                  setDragIndex(i)
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('application/x-dd-image-index', String(i))
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setDropIndex(i)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDropIndex(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const from = dragIndex
                  if (from !== null && from !== i) reorder(from, i)
                  setDragIndex(null)
                  setDropIndex(null)
                }}
                className={cn(
                  'group relative h-28 w-24 cursor-grab overflow-hidden border border-[var(--bordure)] bg-[var(--gris-perle)] active:cursor-grabbing',
                  dragIndex === i && 'opacity-50',
                  dropIndex === i && dragIndex !== null && dragIndex !== i && 'ring-2 ring-[var(--or-royal)]',
                )}
              >
                {isVideoUrl(url) ? (
                  <video src={url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
                )}
                {i === 0 && (
                  <span className="absolute start-0 top-0 bg-[var(--or-royal)] px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-[var(--noir)]">
                    Principale
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  aria-label="Supprimer l'image"
                  className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center bg-[var(--noir)]/70 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ✕
                </button>
                <span className="absolute bottom-1 start-1 rounded bg-black/50 px-1 text-[0.65rem] text-white">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL optionnelle */}
      <div className="border-t border-[var(--bordure)] pt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
          Ou ajouter via URL (optionnel)
        </p>
        <div className="flex gap-2">
          <input
            className="w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]"
            placeholder="https://…"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!manualUrl.trim() || images.length >= maxImages}
            className="shrink-0 border border-[var(--bordure)] px-4 text-sm text-[var(--texte)] disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageUploader
