import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

// Chiffrement symétrique AES-256-GCM pour les secrets stockés en base
// (clés API transporteurs). La clé dérive d'un secret d'environnement —
// définir ENCRYPTION_KEY en production pour une vraie séparation.

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY ?? process.env.ADMIN_JWT_SECRET ?? 'dev-encryption-fallback'
  return createHash('sha256').update(secret).digest() // 32 octets
}

/** Chiffre une chaîne → "iv:authTag:ciphertext" (hex). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/** Déchiffre une chaîne produite par encryptSecret. Renvoie '' si invalide. */
export function decryptSecret(payload: string | null | undefined): string {
  if (!payload) return ''
  try {
    const [ivHex, tagHex, dataHex] = payload.split(':')
    if (!ivHex || !tagHex || !dataHex) return ''
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch {
    return ''
  }
}
