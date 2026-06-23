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

/**
 * Notifie l'admin sur WhatsApp à chaque nouvelle commande, via l'API gratuite
 * CallMeBot (aucune WhatsApp Business API requise).
 *
 * Conditions : `whatsappNotificationsEnabled` activé en admin, un numéro de
 * destination (réglages admin ou CALLMEBOT_PHONE) et CALLMEBOT_API_KEY défini
 * dans l'environnement. Entièrement non bloquant : toute erreur est avalée.
 *
 * Format du numéro attendu par CallMeBot : international AVEC le « + » et
 * l'indicatif pays (ex. +212637829254). Le « + » est encodé en %2B dans l'URL.
 */
export async function notifyAdminWhatsApp(order: AdminNotifyOrder): Promise<void> {
  try {
    const settings = await getSiteSettings()
    if (!settings.whatsappNotificationsEnabled) {
      console.log('[CallMeBot] Ignoré : notifications WhatsApp désactivées (toggle admin OFF).')
      return
    }

    const apikey = process.env.CALLMEBOT_API_KEY
    const phoneRaw = settings.whatsappNotificationNumber || process.env.CALLMEBOT_PHONE
    if (!apikey) {
      console.warn('[CallMeBot] Ignoré : CALLMEBOT_API_KEY absent de l’environnement (.env.local / Vercel).')
      return
    }
    if (!phoneRaw) {
      console.warn('[CallMeBot] Ignoré : aucun numéro (réglage admin « Numéro WhatsApp » ou CALLMEBOT_PHONE).')
      return
    }

    // Numéro au format international avec « + » (CallMeBot le requiert).
    const digits = phoneRaw.replace(/[^\d]/g, '')
    if (!digits) {
      console.warn(`[CallMeBot] Ignoré : numéro invalide après normalisation ("${phoneRaw}").`)
      return
    }
    const phone = `+${digits}`

    const produits = order.orderItems.map((i) => `${i.productName} (×${i.quantity})`).join(', ')
    const message =
      `🛒 Nouvelle commande Dar Dmana !\n` +
      `N° ${order.orderNumber}\n` +
      `Client : ${order.customerName} — ${order.customerPhone}\n` +
      `Produits : ${produits}\n` +
      `Total : ${Number(order.totalMad)} MAD\n` +
      `Paiement : ${order.paymentMethod}\n` +
      `Source : ${order.source}`

    const url =
      `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
      `&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`

    console.log(`[CallMeBot] Tentative envoi vers ${phone}`)
    const res = await fetch(url, { method: 'GET' })
    const body = await res.text().catch(() => '')
    if (res.ok) {
      console.log(`[CallMeBot] OK (HTTP ${res.status}) — ${body.slice(0, 160)}`)
    } else {
      console.warn(`[CallMeBot] Échec HTTP ${res.status} — ${body.slice(0, 200)}`)
    }
  } catch (err) {
    console.error('[notifyAdminWhatsApp] échec (non bloquant):', err)
  }
}
