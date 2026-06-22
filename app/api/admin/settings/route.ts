import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'
import { getSiteSettings, upsertSiteSettings } from '@/lib/settings'

const urlOrEmpty = z.string().trim().url().or(z.literal('')).optional()
const textOrEmpty = z.string().trim().max(300).optional()

const SettingsPatchSchema = z.object({
  siteName: z.string().trim().min(1).max(120).optional(),
  logoUrl: urlOrEmpty,
  logoUrlDark: urlOrEmpty,
  faviconUrl: urlOrEmpty,
  // Coordonnées globales (texte libre).
  phone: textOrEmpty,
  whatsapp: textOrEmpty,
  address: textOrEmpty,
  email: z.string().trim().email().or(z.literal('')).optional(),
  // Réseaux sociaux (URLs).
  socialInstagram: urlOrEmpty,
  socialFacebook: urlOrEmpty,
  socialTikTok: urlOrEmpty,
})

export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const settings = await getSiteSettings()
  return NextResponse.json({ settings })
}

export async function PATCH(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (!hasPermission(session.role, 'cms.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = SettingsPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // Convertit les chaînes vides en null (champ effacé).
    const data = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v === '' ? null : v]),
    )

    const updated = await upsertSiteSettings(data)
    return NextResponse.json({ success: true, settings: updated })
  } catch (error) {
    console.error('[PATCH /api/admin/settings]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
