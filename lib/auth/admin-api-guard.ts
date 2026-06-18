import { type NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission, type Permission } from '@/lib/auth/permissions'

export async function guardAdminApi(request: NextRequest, permission: Permission) {
  const session = await verifyAdminSession(request)
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }
  if (!hasPermission(session.role, permission)) {
    return { ok: false as const, response: NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 }) }
  }
  return { ok: true as const, session }
}

export async function guardSuperAdminApi(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }
  if (session.role !== 'SUPER_ADMIN') {
    return { ok: false as const, response: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }
  return { ok: true as const, session }
}
