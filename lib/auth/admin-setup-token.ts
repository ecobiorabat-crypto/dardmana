const SETUP_EXPIRY_SECONDS = 60 * 60 * 24 * 7 // 7 jours

export interface AdminSetupPayload {
  purpose: 'admin_setup'
  email: string
  iat: number
  exp: number
}

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

export async function signAdminSetupToken(email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSetupPayload = {
    purpose: 'admin_setup',
    email: email.toLowerCase(),
    iat: now,
    exp: now + SETUP_EXPIRY_SECONDS,
  }

  const enc = new TextEncoder()
  const header = toBase64Url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = toBase64Url(enc.encode(JSON.stringify(payload)))
  const signingInput = `${header}.${body}`

  const key = await getSigningKey()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput))

  return `${signingInput}.${toBase64Url(sig)}`
}

export async function verifyAdminSetupToken(token: string): Promise<AdminSetupPayload | null> {
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

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as AdminSetupPayload
    if (payload.purpose !== 'admin_setup') return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

export function generateTempPassword(length = 14): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}
