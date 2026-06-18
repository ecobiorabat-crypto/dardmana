import bcrypt from 'bcryptjs'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardSuperAdminApi } from '@/lib/auth/admin-api-guard'
import { generateTempPassword, signAdminSetupToken } from '@/lib/auth/admin-setup-token'
import { CreateTeamMemberSchema } from '@/lib/validations/admin-team'
import { adminInviteEmail, adminTempPasswordEmail } from '@/lib/resend'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

async function sendOnboardingEmail(
  mode: 'temp_password' | 'invite',
  input: { name: string; email: string; tempPassword?: string },
): Promise<{ emailSent: boolean; tempPassword?: string }> {
  if (mode === 'invite') {
    const token = await signAdminSetupToken(input.email)
    const setupUrl = `${BASE_URL}/admin/set-password?token=${encodeURIComponent(token)}`
    try {
      await adminInviteEmail({ name: input.name, email: input.email, setupUrl })
      return { emailSent: true }
    } catch (e) {
      console.error('[team onboarding invite email]', e)
      return { emailSent: false }
    }
  }

  const tempPassword = input.tempPassword ?? generateTempPassword()
  try {
    await adminTempPasswordEmail({
      name: input.name,
      email: input.email,
      tempPassword,
      loginUrl: `${BASE_URL}/admin/login`,
    })
    return { emailSent: true, tempPassword }
  } catch (e) {
    console.error('[team onboarding temp email]', e)
    return { emailSent: false, tempPassword }
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await guardSuperAdminApi(request)
    if (!auth.ok) return auth.response

    const admins = await prisma.adminUser.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
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

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('[GET /api/admin/team]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardSuperAdminApi(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const parsed = CreateTeamMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { email, name, role, onboarding } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    const existing = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'Un administrateur avec cet email existe déjà' }, { status: 409 })
    }

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)

    const admin = await prisma.adminUser.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        role,
        passwordHash,
        isActive: true,
      },
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

    const mail = await sendOnboardingEmail(onboarding, {
      name: admin.name,
      email: admin.email,
      tempPassword: onboarding === 'temp_password' ? tempPassword : undefined,
    })

    return NextResponse.json(
      {
        admin,
        emailSent: mail.emailSent,
        ...(onboarding === 'temp_password' && mail.tempPassword ? { tempPassword: mail.tempPassword } : {}),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[POST /api/admin/team]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
