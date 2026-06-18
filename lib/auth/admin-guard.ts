import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminToken, ADMIN_COOKIE_NAME, type AdminSession } from './admin'
import { hasPermission, type Permission } from './permissions'

/** Lit et vérifie la session admin depuis le cookie JWT (server-only). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

/** Exige une session admin valide, sinon redirige vers la page de connexion. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  return session
}

/** Exige une permission précise, sinon redirige vers le dashboard. */
export async function requirePermission(permission: Permission): Promise<AdminSession> {
  const session = await requireAdmin()
  if (!hasPermission(session.role, permission)) redirect('/admin')
  return session
}

/** Exige le rôle SUPER_ADMIN, sinon redirige vers Paramètres avec message d'accès refusé. */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await requireAdmin()
  if (session.role !== 'SUPER_ADMIN') {
    redirect('/admin/parametres?error=access_denied')
  }
  return session
}
