import bcrypt from 'bcryptjs'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardSuperAdminApi } from '@/lib/auth/admin-api-guard'
import { generateTempPassword } from '@/lib/auth/admin-setup-token'
import { PatchTeamMemberSchema } from '@/lib/validations/admin-team'
import { adminInviteEmail, adminTempPasswordEmail } from '@/lib/resend'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

async function countActiveSuperAdmins(excludeId?: string): Promise<number> {
  return prisma.adminUser.count({
    where: {
      role: 'SUPER_ADMIN',
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardSuperAdminApi(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const parsed = PatchTeamMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const existing = await prisma.adminUser.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Administrateur introuvable' }, { status: 404 })
    }

    if (existing.role === 'SUPER_ADMIN' && parsed.data.role) {
      return NextResponse.json({ error: 'Impossible de modifier le rôle d\u2019un Super Admin' }, { status: 400 })
    }

    if (existing.role === 'SUPER_ADMIN' && parsed.data.isActive === false) {
      const others = await countActiveSuperAdmins(id)
      if (others === 0) {
        return NextResponse.json({ error: 'Impossible de désactiver le dernier Super Admin actif' }, { status: 400 })
      }
    }

    const data: { role?: typeof parsed.data.role; isActive?: boolean; passwordHash?: string } = {}
    if (parsed.data.role !== undefined) data.role = parsed.data.role
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive

    let tempPassword: string | undefined
    let emailSent = false

    if (parsed.data.resetPassword) {
      tempPassword = generateTempPassword()
      data.passwordHash = await hashPassword(tempPassword)

      if (parsed.data.resetPassword === 'invite') {
        const { signAdminSetupToken } = await import('@/lib/auth/admin-setup-token')
        const token = await signAdminSetupToken(existing.email)
        const setupUrl = `${BASE_URL}/admin/set-password?token=${encodeURIComponent(token)}`
        try {
          await adminInviteEmail({ name: existing.name, email: existing.email, setupUrl })
          emailSent = true
        } catch (e) {
          console.error('[PATCH team reset invite]', e)
        }
      } else {
        try {
          await adminTempPasswordEmail({
            name: existing.name,
            email: existing.email,
            tempPassword,
            loginUrl: `${BASE_URL}/admin/login`,
          })
          emailSent = true
        } catch (e) {
          console.error('[PATCH team reset temp]', e)
        }
      }
    }

    const admin = await prisma.adminUser.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      admin,
      emailSent,
      ...(parsed.data.resetPassword === 'temp_password' && tempPassword ? { tempPassword } : {}),
    })
  } catch (error) {
    console.error('[PATCH /api/admin/team/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardSuperAdminApi(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const existing = await prisma.adminUser.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Administrateur introuvable' }, { status: 404 })
    }

    if (existing.email.toLowerCase() === auth.session.adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 })
    }

    if (existing.role === 'SUPER_ADMIN') {
      const others = await countActiveSuperAdmins(id)
      if (others === 0) {
        return NextResponse.json({ error: 'Impossible de supprimer le dernier Super Admin actif' }, { status: 400 })
      }
    }

    await prisma.adminUser.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Administrateur supprimé' })
  } catch (error) {
    console.error('[DELETE /api/admin/team/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
