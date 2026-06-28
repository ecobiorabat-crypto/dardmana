import { resend } from '@/lib/resend'

/** Forme minimale d'une commande nécessaire pour la notification admin. */
export interface AdminNotifyOrder {
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  totalMad: number | string
  paymentMethod: string
  source: string
  orderItems: { productName: string; quantity: number }[]
}

const FROM = 'Dar Dmana System <no-reply@dardmana.ma>'
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

const SOURCE_LABELS: Record<string, string> = {
  SHOP: 'Boutique',
  WHATSAPP: 'WhatsApp',
  ADMIN: 'Admin',
}

/** Échappe le HTML pour éviter toute injection depuis les données client. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Notifie l'admin par email (via Resend) à chaque nouvelle commande.
 * Destinataire : ADMIN_EMAIL. Entièrement non bloquant : toute erreur est avalée.
 */
export async function notifyAdminEmail(order: AdminNotifyOrder): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.warn('[notifyAdminEmail] Ignoré : ADMIN_EMAIL absent de l’environnement.')
      return
    }

    const total = Number(order.totalMad)
    const sourceLabel = SOURCE_LABELS[order.source] ?? order.source
    const adminUrl = `${BASE_URL}/admin/commandes/${order.orderId}`

    const produitsRows = order.orderItems
      .map(
        (i) =>
          `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${escapeHtml(i.productName)}</td>` +
          `<td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">×${i.quantity}</td></tr>`,
      )
      .join('')

    const html = `<!doctype html><html><body style="margin:0;background:#f6f5f1;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e6e3da">
    <div style="background:#14322a;padding:20px 24px;color:#f4efe2">
      <h1 style="margin:0;font-size:18px">🛒 Nouvelle commande</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:.85">N° ${escapeHtml(order.orderNumber)}</p>
    </div>
    <div style="padding:24px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#777">Client</td><td style="padding:6px 0;text-align:right">${escapeHtml(order.customerName)}</td></tr>
        <tr><td style="padding:6px 0;color:#777">Téléphone</td><td style="padding:6px 0;text-align:right">${escapeHtml(order.customerPhone)}</td></tr>
        <tr><td style="padding:6px 0;color:#777">Paiement</td><td style="padding:6px 0;text-align:right">${escapeHtml(order.paymentMethod)}</td></tr>
        <tr><td style="padding:6px 0;color:#777">Source</td><td style="padding:6px 0;text-align:right">${escapeHtml(sourceLabel)}</td></tr>
      </table>

      <h2 style="margin:20px 0 8px;font-size:14px;color:#14322a">Produits</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${produitsRows}</table>

      <p style="margin:20px 0 0;font-size:18px;font-weight:bold;color:#14322a">Total : ${total} MAD</p>

      <a href="${adminUrl}" style="display:inline-block;margin-top:20px;background:#c9a84c;color:#1a1a1a;text-decoration:none;padding:12px 22px;font-size:13px;font-weight:bold;letter-spacing:.04em">
        Voir la commande dans l'admin →
      </a>
    </div>
  </div>
</body></html>`

    await resend.emails.send({
      from: FROM,
      to: [adminEmail],
      subject: `🛒 Nouvelle commande ${order.orderNumber} — ${total} MAD`,
      html,
    })
    console.log(`[notifyAdminEmail] Email envoyé à ${adminEmail} pour ${order.orderNumber}`)
  } catch (err) {
    console.error('[notifyAdminEmail] échec (non bloquant):', err)
  }
}
