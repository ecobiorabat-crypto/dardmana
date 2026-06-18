import { type NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'
import { uploadImageBuffer } from '@/lib/cloudinary'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])

function extFromName(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : ''
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const canUpload =
      hasPermission(session.role, 'products.create') ||
      hasPermission(session.role, 'products.update')
    if (!canUpload) {
      return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
    }

    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[POST /api/admin/upload] Cloudinary credentials missing')
      return NextResponse.json({ error: 'Configuration Cloudinary manquante' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' },
        { status: 400 },
      )
    }

    const ext = extFromName(file.name)
    if (ext && !ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: 'Extension non supportée. Utilisez .jpg, .png ou .webp.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 5 Mo).' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImageBuffer(buffer, 'products')

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error('[POST /api/admin/upload]', error)
    return NextResponse.json({ error: 'Échec du téléversement' }, { status: 500 })
  }
}
