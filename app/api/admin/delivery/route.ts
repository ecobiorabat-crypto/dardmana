import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'
import { getDeliverySettingsPublic, upsertDeliverySettings } from '@/lib/delivery/settings'

const PatchSchema = z.object({
  activeProvider: z.enum(['MANUAL', 'AMANA', 'CTM', 'SENDIT']).optional(),
  // Clés en clair à la saisie ; '' = inchangé (jamais renvoyées par le GET).
  amanaApiKey: z.string().trim().max(300).optional(),
  ctmApiKey: z.string().trim().max(300).optional(),
  senditApiKey: z.string().trim().max(300).optional(),
})

export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!hasPermission(session.role, 'cms.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  const settings = await getDeliverySettingsPublic()
  return NextResponse.json({ settings })
}

export async function PATCH(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!hasPermission(session.role, 'cms.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  try {
    const parsed = PatchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    await upsertDeliverySettings({ ...parsed.data, updatedBy: session.adminEmail })
    const settings = await getDeliverySettingsPublic()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('[PATCH /api/admin/delivery]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
