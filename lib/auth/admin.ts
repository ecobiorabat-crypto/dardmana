import type { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { AdminRole } from './permissions'

// ─── Constants ────────────────────────────────────────────────────────────────

const COOKIE_NAME = 'dar-dmana-admin-session'
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 // 24 hours

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminSession {
  adminEmail: string
  role: AdminRole
  name: string
  iat: number
  exp: number
}

// ─── JWT (Web Crypto HMAC-SHA256) ─────────────────────────────────────────────

function getSecret(): string {
  return process.env.ADMIN_JWT_SECRET ?? 'dev-secret-CHANGE-IN-PRODUCTION'
}

function toBase64Url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64Url(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer as ArrayBuffer
}

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function signAdminToken(payload: Omit<AdminSession, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: AdminSession = { ...payload, iat: now, exp: now + TOKEN_EXPIRY_SECONDS }

  const enc = new TextEncoder()
  const header = toBase64Url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = toBase64Url(enc.encode(JSON.stringify(fullPayload)))
  const signingInput = `${header}.${body}`

  const key = await getSigningKey()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput))

  return `${signingInput}.${toBase64Url(sig)}`
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, body, signature] = parts
    const key = await getSigningKey()
    const enc = new TextEncoder()

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signature),
      enc.encode(`${header}.${body}`),
    )
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as AdminSession

    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

// ─── DB-backed admin lookup + bcrypt verify ───────────────────────────────────

export async function findAdminUser(email: string) {
  return prisma.adminUser.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, isActive: true },
    select: { email: true, name: true, role: true, passwordHash: true },
  })
}

export async function verifyPassword(provided: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(provided, storedHash)
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export async function verifyAdminSession(request: NextRequest): Promise<AdminSession | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export { COOKIE_NAME as ADMIN_COOKIE_NAME, TOKEN_EXPIRY_SECONDS as ADMIN_TOKEN_EXPIRY }
