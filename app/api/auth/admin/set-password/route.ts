import bcrypt from 'bcryptjs'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSetupToken } from '@/lib/auth/admin-setup-token'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string; password?: string }
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    const payload = await verifyAdminSetupToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })
    }

    const admin = await prisma.adminUser.findFirst({
      where: { email: { equals: payload.email, mode: 'insensitive' } },
    })
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Compte administrateur introuvable ou inactif' }, { status: 404 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true, message: 'Mot de passe défini. Vous pouvez vous connecter.' })
  } catch (error) {
    console.error('[POST /api/auth/admin/set-password]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
