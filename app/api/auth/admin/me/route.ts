import { type NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth/admin'
import { getPermissionsForRole } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request)

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const permissions = getPermissionsForRole(session.role)

    return NextResponse.json({
      adminEmail: session.adminEmail,
      name: session.name,
      role: session.role,
      permissions,
      expiresAt: new Date(session.exp * 1000).toISOString(),
    })
  } catch (error) {
    console.error('[GET /api/auth/admin/me]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
