import { type NextRequest, NextResponse } from 'next/server'
import { uploadMediaBuffer } from '@/lib/cloudinary'

// Upload public pour les témoignages du Livre d'Or (photo ou vidéo courte).
// Pas d'auth — limité par type MIME et taille.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 Mo
const MAX_VIDEO_BYTES = 30 * 1024 * 1024 // 30 Mo
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

export async function POST(request: NextRequest) {
  try {
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[POST /api/guestbook/upload] Cloudinary credentials missing')
      return NextResponse.json({ error: 'Upload indisponible' }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    const isImage = IMAGE_MIME.has(file.type)
    const isVideo = VIDEO_MIME.has(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Format non supporté (JPG, PNG, WebP, MP4, WebM).' },
        { status: 400 },
      )
    }

    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    if (file.size > limit) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${isVideo ? '30' : '5'} Mo).` },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadMediaBuffer(buffer, 'guestbook')

    return NextResponse.json({
      url: result.secure_url,
      mediaType: isVideo ? 'VIDEO' : 'PHOTO',
    })
  } catch (error) {
    console.error('[POST /api/guestbook/upload]', error)
    return NextResponse.json({ error: 'Échec du téléversement' }, { status: 500 })
  }
}
