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
 * destination (réglages admin ou CALLMEBOT_PHONE) et CALLMEBOT_API_KEY définis.
 * Entièrement non bloquant : toute erreur est avalée (log seulement).
 */
export async function notifyAdminWhatsApp(order: AdminNotifyOrder): Promise<void> {
  try {
    const settings = await getSiteSettings()
    if (!settings.whatsappNotificationsEnabled) return

    const apikey = process.env.CALLMEBOT_API_KEY
    const phoneRaw = settings.whatsappNotificationNumber || process.env.CALLMEBOT_PHONE
    if (!apikey || !phoneRaw) return

    const phone = phoneRaw.replace(/[^\d]/g, '')
    if (!phone) return

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

    await fetch(url, { method: 'GET' })
  } catch (err) {
    console.error('[notifyAdminWhatsApp] échec (non bloquant):', err)
  }
}
