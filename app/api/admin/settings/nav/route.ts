import { type NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'
import { getSiteSettings, upsertSiteSettings } from '@/lib/settings'
import { NAV_CONFIG_KEYS, parseNavConfig } from '@/lib/nav-config-types'

// PATCH /api/admin/settings/nav — met à jour l'activation des pages/liens.
export async function PATCH(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!hasPermission(session.role, 'cms.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    // Ne retient que les clés connues et booléennes, fusionnées à l'existant.
    const current = (await getSiteSettings()).navConfig
    const patch: Record<string, boolean> = {}
    for (const k of NAV_CONFIG_KEYS) {
      if (typeof body[k] === 'boolean') patch[k] = body[k] as boolean
    }
    const navConfig = parseNavConfig({ ...current, ...patch })

    await upsertSiteSettings({ navConfig })
    // Changement instantané : revalide tout ce qui partage le layout (nav/footer).
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true, navConfig })
  } catch (error) {
    console.error('[PATCH /api/admin/settings/nav]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
