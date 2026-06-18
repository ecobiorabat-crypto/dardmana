import { type NextRequest, NextResponse } from 'next/server'
import {
  findAdminUser,
  verifyPassword,
  signAdminToken,
  ADMIN_COOKIE_NAME,
  ADMIN_TOKEN_EXPIRY,
} from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string }

    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    const admin = await findAdminUser(body.email)
    if (!admin || !admin.passwordHash) {
      // Constant-time-safe delay to mitigate user enumeration
      await new Promise((r) => setTimeout(r, 300))
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
    }

    const valid = await verifyPassword(body.password, admin.passwordHash)
    if (!valid) {
      await new Promise((r) => setTimeout(r, 300))
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
    }

    const token = await signAdminToken({
      adminEmail: admin.email,
      role: admin.role,
      name: admin.name,
    })

    await prisma.adminUser.updateMany({
      where: { email: { equals: admin.email, mode: 'insensitive' } },
      data: { lastLoginAt: new Date() },
    }).catch(() => {})

    const response = NextResponse.json({
      success: true,
      admin: { email: admin.email, name: admin.name, role: admin.role },
    })

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ADMIN_TOKEN_EXPIRY,
      expires: new Date(Date.now() + ADMIN_TOKEN_EXPIRY * 1000),
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[POST /api/auth/admin/login]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
