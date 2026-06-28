import { getSiteSettings } from '@/lib/settings'

/** Forme minimale d'une commande nécessaire pour la notification admin. */
export interface AdminNotifyOrder {
  orderNumber: string
  customerName: string
  customerPhone: string
  totalMad: number | string
  paymentMethod: string
  source: string
  orderItems: { productName: string; quantity: number }[]
}

export interface CallMeBotResult {
  ok: boolean
  /** Renseigné quand l'envoi est ignoré (toggle off, clé/numéro manquants…). */
  skipped?: string
  status?: number
  body?: string
  /** URL appelée, clé API masquée (sûre à renvoyer/afficher). */
  url?: string
  config: {
    hasApiKey: boolean
    hasPhone: boolean
    phone: string | null
    notificationsEnabled: boolean
  }
}

/** Masque la clé API dans l'URL avant de la retourner/logguer côté client. */
function maskApiKey(url: string): string {
  return url.replace(/(apikey=)[^&]+/i, '$1***')
}

/**
 * Cœur de l'envoi CallMeBot, mutualisé entre la notification de commande et le
 * test manuel. Retourne un diagnostic complet (status, body, url masquée, config).
 *
 * Format du numéro attendu par CallMeBot : international AVEC le « + » et
 * l'indicatif pays (ex. +212637829254). Le « + » est encodé en %2B dans l'URL.
 * API : https://api.callmebot.com/whatsapp.php?phone={phone}&text={text}&apikey={apikey}
 */
async function dispatchCallMeBot(
  message: string,
  options: { ignoreToggle?: boolean } = {},
): Promise<CallMeBotResult> {
  const settings = await getSiteSettings().catch(() => null)
  const apikey = process.env.CALLMEBOT_API_KEY
  const phoneRaw = settings?.whatsappNotificationNumber || process.env.CALLMEBOT_PHONE || null

  const config = {
    hasApiKey: !!apikey,
    hasPhone: !!phoneRaw,
    phone: phoneRaw,
    notificationsEnabled: !!settings?.whatsappNotificationsEnabled,
  }
  console.log('[CallMeBot] Config:', config)

  if (!options.ignoreToggle && !config.notificationsEnabled) {
    console.log('[CallMeBot] Ignoré : notifications WhatsApp désactivées (toggle admin OFF).')
    return { ok: false, skipped: 'Notifications WhatsApp désactivées (toggle admin OFF)', config }
  }
  if (!apikey) {
    console.warn('[CallMeBot] Ignoré : CALLMEBOT_API_KEY absent de l’environnement (.env.local / Vercel).')
    return { ok: false, skipped: 'CALLMEBOT_API_KEY absent', config }
  }
  if (!phoneRaw) {
    console.warn('[CallMeBot] Ignoré : aucun numéro (réglage admin « Numéro WhatsApp » ou CALLMEBOT_PHONE).')
    return { ok: false, skipped: 'Aucun numéro de destination', config }
  }

  // Numéro au format international avec « + » (CallMeBot le requiert).
  const digits = phoneRaw.replace(/[^\d]/g, '')
  if (!digits) {
    console.warn(`[CallMeBot] Ignoré : numéro invalide après normalisation ("${phoneRaw}").`)
    return { ok: false, skipped: `Numéro invalide ("${phoneRaw}")`, config }
  }
  const phone = `+${digits}`

  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`
  const safeUrl = maskApiKey(url)
  // URL complète en logs serveur (diagnostic) ; URL masquée renvoyée au client.
  console.log('[CallMeBot] URL:', url)

  try {
    const res = await fetch(url, { method: 'GET' })
    const body = await res.text().catch(() => '')
    console.log('[CallMeBot] Response:', res.status, body.slice(0, 300))
    return { ok: res.ok, status: res.status, body, url: safeUrl, config }
  } catch (err) {
    console.error('[CallMeBot] Échec réseau:', err)
    return { ok: false, skipped: `Erreur réseau : ${(err as Error).message}`, url: safeUrl, config }
  }
}

/**
 * Notifie l'admin sur WhatsApp à chaque nouvelle commande, via l'API gratuite
 * CallMeBot (aucune WhatsApp Business API requise). Entièrement non bloquant.
 */
export async function notifyAdminWhatsApp(order: AdminNotifyOrder): Promise<void> {
  try {
    const produits = order.orderItems.map((i) => `${i.productName} (×${i.quantity})`).join(', ')
    const message =
      `🛒 Nouvelle commande Dar Dmana !\n` +
      `N° ${order.orderNumber}\n` +
      `Client : ${order.customerName} — ${order.customerPhone}\n` +
      `Produits : ${produits}\n` +
      `Total : ${Number(order.totalMad)} MAD\n` +
      `Paiement : ${order.paymentMethod}\n` +
      `Source : ${order.source}`

    await dispatchCallMeBot(message)
  } catch (err) {
    console.error('[notifyAdminWhatsApp] échec (non bloquant):', err)
  }
}

/**
 * Envoie une notification WhatsApp de TEST (déclenchée manuellement par l'admin).
 * Ignore le toggle « notifications activées » et retourne le diagnostic complet.
 */
export async function sendCallMeBotTest(): Promise<CallMeBotResult> {
  const message =
    `✅ Test CallMeBot — Dar Dmana\n` +
    `Si vous recevez ce message, la configuration WhatsApp fonctionne.\n` +
    `Date : ${new Date().toLocaleString('fr-FR')}`
  return dispatchCallMeBot(message, { ignoreToggle: true })
}
