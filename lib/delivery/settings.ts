import { prisma } from '@/lib/prisma'
import { decryptSecret, encryptSecret } from '@/lib/crypto/secrets'
import type { DeliveryProviderId } from '@/lib/delivery/types'

const SINGLETON_ID = 'singleton'

export interface DeliverySettingsServer {
  activeProvider: DeliveryProviderId
  amanaApiKey: string
  ctmApiKey: string
  senditApiKey: string
}

export interface DeliverySettingsPublic {
  activeProvider: DeliveryProviderId
  amanaConfigured: boolean
  ctmConfigured: boolean
  senditConfigured: boolean
  updatedAt: string | null
  updatedBy: string | null
}

function normalizeProvider(v: string | undefined): DeliveryProviderId {
  return v === 'AMANA' || v === 'CTM' || v === 'SENDIT' ? v : 'MANUAL'
}

/** Lecture serveur (clés déchiffrées) — ne jamais renvoyer au client. */
export async function getDeliverySettings(): Promise<DeliverySettingsServer> {
  try {
    const row = await prisma.deliverySettings.findUnique({ where: { id: SINGLETON_ID } })
    return {
      activeProvider: normalizeProvider(row?.activeProvider),
      amanaApiKey: decryptSecret(row?.amanaApiKey),
      ctmApiKey: decryptSecret(row?.ctmApiKey),
      senditApiKey: decryptSecret(row?.senditApiKey),
    }
  } catch {
    return { activeProvider: 'MANUAL', amanaApiKey: '', ctmApiKey: '', senditApiKey: '' }
  }
}

/** Vue cliente : jamais de clé en clair, seulement un état "configuré". */
export async function getDeliverySettingsPublic(): Promise<DeliverySettingsPublic> {
  const row = await prisma.deliverySettings
    .findUnique({ where: { id: SINGLETON_ID } })
    .catch(() => null)
  return {
    activeProvider: normalizeProvider(row?.activeProvider),
    amanaConfigured: Boolean(decryptSecret(row?.amanaApiKey)),
    ctmConfigured: Boolean(decryptSecret(row?.ctmApiKey)),
    senditConfigured: Boolean(decryptSecret(row?.senditApiKey)),
    updatedAt: row ? row.updatedAt.toISOString() : null,
    updatedBy: row?.updatedBy ?? null,
  }
}

export interface DeliverySettingsUpdate {
  activeProvider?: DeliveryProviderId
  /** Texte clair ; chaîne vide / absent = inchangé (write-only). */
  amanaApiKey?: string
  ctmApiKey?: string
  senditApiKey?: string
  updatedBy?: string
}

export async function upsertDeliverySettings(data: DeliverySettingsUpdate) {
  const update: Record<string, unknown> = {}
  if (data.activeProvider) update.activeProvider = data.activeProvider
  if (data.amanaApiKey) update.amanaApiKey = encryptSecret(data.amanaApiKey)
  if (data.ctmApiKey) update.ctmApiKey = encryptSecret(data.ctmApiKey)
  if (data.senditApiKey) update.senditApiKey = encryptSecret(data.senditApiKey)
  if (data.updatedBy) update.updatedBy = data.updatedBy

  return prisma.deliverySettings.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      activeProvider: data.activeProvider ?? 'MANUAL',
      amanaApiKey: data.amanaApiKey ? encryptSecret(data.amanaApiKey) : null,
      ctmApiKey: data.ctmApiKey ? encryptSecret(data.ctmApiKey) : null,
      senditApiKey: data.senditApiKey ? encryptSecret(data.senditApiKey) : null,
      updatedBy: data.updatedBy ?? null,
    },
    update,
  })
}
