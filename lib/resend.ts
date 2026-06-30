import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

let _resend: Resend | undefined

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not configured')
    _resend = new Resend(key)
  }
  return _resend
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    return Reflect.get(getResend(), prop, receiver)
  },
})

// Expéditeur configurable (le domaine doit être vérifié dans Resend).
const FROM = process.env.EMAIL_FROM ?? 'Dar Dmana <no-reply@dardmana.ma>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma'

// ─── Envoi centralisé (gestion d'erreur + journalisation) ──────────────────────

export interface SendEmailParams {
  to: string[]
  subject: string
  html: string
  /** Identifiant du type d'email (ex. 'order_confirmation') pour NotificationLog. */
  type: string
  orderId?: string
  customerId?: string
}

/** Journalise un envoi dans NotificationLog (best-effort, ne lève jamais). */
async function logNotification(
  params: SendEmailParams,
  recipient: string,
  status: 'SENT' | 'FAILED',
  errorMessage?: string,
): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        orderId: params.orderId ?? null,
        customerId: params.customerId ?? null,
        channel: 'EMAIL',
        type: params.type,
        recipient,
        status,
        errorMessage: errorMessage ?? null,
        sentAt: status === 'SENT' ? new Date() : null,
      },
    })
  } catch (err) {
    console.error('[Resend] Écriture NotificationLog échouée:', err)
  }
}

/**
 * Envoi d'email centralisé. Remonte EXPLICITEMENT les erreurs Resend (qui sont
 * renvoyées dans `{ error }` sans lever — ex. domaine non vérifié → 403 — donc
 * autrement avalées silencieusement) : log console + NotificationLog FAILED.
 * Best-effort : ne lève jamais (l'envoi d'email ne doit pas casser une commande).
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const recipient = params.to.join(', ')
  try {
    const result = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    if (result.error) {
      const msg = result.error.message ?? JSON.stringify(result.error)
      console.error(`[Resend] Échec "${params.type}" → ${recipient}: ${msg}`)
      await logNotification(params, recipient, 'FAILED', msg)
    } else {
      console.log(`[Resend] Email "${params.type}" envoyé → ${recipient} (id ${result.data?.id ?? '—'})`)
      await logNotification(params, recipient, 'SENT')
    }
  } catch (err) {
    console.error(`[Resend] Exception envoi "${params.type}" → ${recipient}:`, err)
    await logNotification(params, recipient, 'FAILED', (err as Error).message)
  }
}

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface EmailOrderItem {
  name: string
  image: string
  quantity: number
  unitPriceMad: number
}

export interface EmailAddress {
  fullName: string
  addressLine1: string
  city: string
  country: string
}

export interface EmailOrder {
  orderId?: string
  orderNumber: string
  customerName: string
  customerEmail: string
  items: EmailOrderItem[]
  subtotalMad: number
  shippingCostMad: number
  discountMad: number
  totalMad: number
  shippingAddress: EmailAddress
  paymentMethod: string
}

export interface EmailCustomer {
  name: string
  email: string
}

// ─── HTML Helpers ────────────────────────────────────────────────────────────

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1a0a00;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#c9a227;font-family:Georgia,serif;font-size:28px;letter-spacing:3px;">دار ضمانة</h1>
            <p style="margin:6px 0 0;color:#e8d5a3;font-size:13px;letter-spacing:2px;text-transform:uppercase;">DAR DMANA</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f5ede0;padding:24px 40px;text-align:center;border-top:1px solid #e8d5a3;">
            <p style="margin:0;color:#8b6914;font-size:12px;">© ${new Date().getFullYear()} Dar Dmana · Artisanat Marocain de Luxe</p>
            <p style="margin:8px 0 0;color:#8b6914;font-size:12px;">
              <a href="${BASE_URL}" style="color:#c9a227;text-decoration:none;">dardmana.ma</a>
              &nbsp;·&nbsp;
              <a href="mailto:contact@dardmana.ma" style="color:#c9a227;text-decoration:none;">contact@dardmana.ma</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function itemsTable(items: EmailOrderItem[]): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0e8d8;vertical-align:middle;">
        <span style="font-size:14px;color:#2c1810;">${item.name}</span>
        <span style="font-size:12px;color:#8b6914;display:block;">× ${item.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0e8d8;text-align:right;vertical-align:middle;">
        <span style="font-size:14px;color:#2c1810;font-weight:bold;">${(item.unitPriceMad * item.quantity).toFixed(2)} MAD</span>
      </td>
    </tr>`
    )
    .join('')
  return `<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>`
}

// ─── Templates ───────────────────────────────────────────────────────────────

export interface PersonalPromo {
  code: string
  discountPercent: number
  expiresAt: Date
}

export async function confirmOrder(order: EmailOrder, personalPromo?: PersonalPromo) {
  const promoBlock = personalPromo
    ? `
    <div style="margin-top:24px;padding:20px;background:#fff8f0;border:1px dashed #c9a227;border-radius:6px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#8b6914;">🎁 Merci pour votre première commande ! Profitez de <strong>-${personalPromo.discountPercent}%</strong> sur votre prochaine commande.</p>
      <p style="margin:0;font-size:22px;color:#c9a227;font-weight:bold;letter-spacing:3px;">${personalPromo.code}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#8b6914;">Valable jusqu'au ${personalPromo.expiresAt.toLocaleDateString('fr-FR')} · usage unique</p>
    </div>`
    : ''

  const content = `
    <h2 style="color:#2c1810;font-size:22px;margin:0 0 8px;">Merci pour votre commande !</h2>
    <p style="color:#5a3a1a;font-size:15px;margin:0 0 24px;">Bonjour <strong>${order.customerName}</strong>,<br/>Nous avons bien reçu votre commande et nous la préparons avec soin.</p>

    <div style="background:#faf6f0;border:1px solid #e8d5a3;border-radius:6px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#8b6914;text-transform:uppercase;letter-spacing:1px;">Numéro de commande</p>
      <p style="margin:0;font-size:20px;color:#c9a227;font-weight:bold;letter-spacing:2px;">${order.orderNumber}</p>
    </div>

    <h3 style="color:#2c1810;font-size:16px;margin:0 0 12px;border-bottom:2px solid #c9a227;padding-bottom:8px;">Détail de la commande</h3>
    ${itemsTable(order.items)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr><td style="padding:4px 0;color:#5a3a1a;font-size:13px;">Sous-total</td><td style="text-align:right;color:#5a3a1a;font-size:13px;">${order.subtotalMad.toFixed(2)} MAD</td></tr>
      <tr><td style="padding:4px 0;color:#5a3a1a;font-size:13px;">Livraison</td><td style="text-align:right;color:#5a3a1a;font-size:13px;">${order.shippingCostMad > 0 ? `${order.shippingCostMad.toFixed(2)} MAD` : 'Gratuite'}</td></tr>
      ${order.discountMad > 0 ? `<tr><td style="padding:4px 0;color:#27a227;font-size:13px;">Réduction</td><td style="text-align:right;color:#27a227;font-size:13px;">-${order.discountMad.toFixed(2)} MAD</td></tr>` : ''}
      <tr><td style="padding:12px 0 0;color:#2c1810;font-size:16px;font-weight:bold;border-top:2px solid #e8d5a3;">Total</td><td style="text-align:right;color:#c9a227;font-size:18px;font-weight:bold;padding-top:12px;border-top:2px solid #e8d5a3;">${order.totalMad.toFixed(2)} MAD</td></tr>
    </table>

    <div style="margin-top:24px;padding:16px;background:#f5ede0;border-radius:6px;">
      <p style="margin:0 0 6px;font-size:12px;color:#8b6914;text-transform:uppercase;letter-spacing:1px;">Adresse de livraison</p>
      <p style="margin:0;color:#2c1810;font-size:14px;line-height:1.6;">
        ${order.shippingAddress.fullName}<br/>
        ${order.shippingAddress.addressLine1}<br/>
        ${order.shippingAddress.city}, ${order.shippingAddress.country}
      </p>
    </div>

    ${promoBlock}

    <div style="margin-top:24px;text-align:center;">
      <a href="${BASE_URL}/orders/${order.orderNumber}" style="display:inline-block;background:#c9a227;color:#1a0a00;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">Suivre ma commande</a>
    </div>`

  return sendEmail({
    to: [order.customerEmail],
    subject: `✓ Commande confirmée — ${order.orderNumber} | Dar Dmana`,
    html: baseLayout(`Commande ${order.orderNumber}`, content),
    type: 'order_confirmation',
    orderId: order.orderId,
  })
}

export async function orderShipped(order: EmailOrder, trackingNumber: string) {
  const content = `
    <h2 style="color:#2c1810;font-size:22px;margin:0 0 8px;">Votre commande est en route !</h2>
    <p style="color:#5a3a1a;font-size:15px;margin:0 0 24px;">Bonjour <strong>${order.customerName}</strong>,<br/>Votre commande a été expédiée et est en chemin vers vous.</p>

    <div style="background:#faf6f0;border:1px solid #e8d5a3;border-radius:6px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#8b6914;text-transform:uppercase;letter-spacing:1px;">Numéro de suivi</p>
      <p style="margin:0;font-size:22px;color:#c9a227;font-weight:bold;letter-spacing:3px;">${trackingNumber}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#8b6914;">Commande : ${order.orderNumber}</p>
    </div>

    <h3 style="color:#2c1810;font-size:16px;margin:0 0 12px;border-bottom:2px solid #c9a227;padding-bottom:8px;">Récapitulatif</h3>
    ${itemsTable(order.items)}

    <div style="margin-top:24px;padding:16px;background:#f5ede0;border-radius:6px;">
      <p style="margin:0 0 6px;font-size:12px;color:#8b6914;text-transform:uppercase;letter-spacing:1px;">Livraison à</p>
      <p style="margin:0;color:#2c1810;font-size:14px;line-height:1.6;">
        ${order.shippingAddress.fullName}<br/>
        ${order.shippingAddress.addressLine1}<br/>
        ${order.shippingAddress.city}, ${order.shippingAddress.country}
      </p>
    </div>

    <div style="margin-top:24px;text-align:center;">
      <a href="${BASE_URL}/orders/${order.orderNumber}" style="display:inline-block;background:#c9a227;color:#1a0a00;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">Suivre mon colis</a>
    </div>`

  return sendEmail({
    to: [order.customerEmail],
    subject: `📦 En cours de livraison — ${order.orderNumber} | Dar Dmana`,
    html: baseLayout(`Expédition ${order.orderNumber}`, content),
    type: 'order_shipped',
    orderId: order.orderId,
  })
}

export async function orderDelivered(order: EmailOrder) {
  const content = `
    <h2 style="color:#2c1810;font-size:22px;margin:0 0 8px;">Votre commande est arrivée !</h2>
    <p style="color:#5a3a1a;font-size:15px;margin:0 0 24px;">Bonjour <strong>${order.customerName}</strong>,<br/>Votre commande <strong>${order.orderNumber}</strong> a bien été livrée. Nous espérons qu'elle vous comble de joie.</p>

    <div style="background:#f5ede0;border-left:4px solid #c9a227;padding:16px 20px;margin-bottom:24px;border-radius:0 6px 6px 0;">
      <p style="margin:0;color:#2c1810;font-size:15px;font-style:italic;">"Chaque pièce Dar Dmana est façonnée avec l'âme du Maroc. Nous espérons qu'elle trouvera la sienne dans votre foyer."</p>
    </div>

    <h3 style="color:#2c1810;font-size:16px;margin:0 0 12px;">Partagez votre expérience</h3>
    <p style="color:#5a3a1a;font-size:14px;margin:0 0 20px;">Votre avis nous aide à améliorer nos créations et aide d'autres clients à découvrir l'artisanat marocain.</p>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${BASE_URL}/review/${order.orderNumber}" style="display:inline-block;background:#c9a227;color:#1a0a00;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">Laisser un avis</a>
    </div>

    <h3 style="color:#2c1810;font-size:16px;margin:0 0 12px;border-bottom:2px solid #c9a227;padding-bottom:8px;">Votre commande</h3>
    ${itemsTable(order.items)}`

  return sendEmail({
    to: [order.customerEmail],
    subject: `🎁 Livré — ${order.orderNumber} | Dar Dmana`,
    html: baseLayout(`Livraison ${order.orderNumber}`, content),
    type: 'order_delivered',
    orderId: order.orderId,
  })
}

export async function welcomeCustomer(customer: EmailCustomer) {
  const content = `
    <h2 style="color:#2c1810;font-size:22px;margin:0 0 8px;">Bienvenue chez Dar Dmana !</h2>
    <p style="color:#5a3a1a;font-size:15px;margin:0 0 24px;">Bonjour <strong>${customer.name}</strong>,<br/>Votre compte a bien été créé. Vous êtes désormais membre de la famille Dar Dmana.</p>

    <div style="background:#f5ede0;border-left:4px solid #c9a227;padding:16px 20px;margin-bottom:24px;border-radius:0 6px 6px 0;">
      <p style="margin:0;color:#2c1810;font-size:15px;font-style:italic;">"Dar Dmana — la maison de la garantie — est née d'un amour profond pour les savoir-faire marocains millénaires."</p>
    </div>

    <h3 style="color:#2c1810;font-size:16px;margin:0 0 16px;">Ce que vous offre votre compte</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ['✦', 'Suivi de commandes en temps réel'],
        ['✦', 'Liste de favoris sauvegardée'],
        ['✦', 'Historique d\'achats complet'],
        ['✦', 'Accès aux offres membres exclusives'],
      ]
        .map(
          ([icon, text]) => `
        <tr>
          <td width="24" style="padding:8px 12px 8px 0;vertical-align:top;color:#c9a227;font-size:16px;">${icon}</td>
          <td style="padding:8px 0;color:#2c1810;font-size:14px;">${text}</td>
        </tr>`
        )
        .join('')}
    </table>

    <div style="margin-top:28px;text-align:center;">
      <a href="${BASE_URL}/boutique" style="display:inline-block;background:#c9a227;color:#1a0a00;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">Découvrir la boutique</a>
    </div>`

  return sendEmail({
    to: [customer.email],
    subject: `Bienvenue chez Dar Dmana, ${customer.name} !`,
    html: baseLayout('Bienvenue', content),
    type: 'welcome',
  })
}

export async function resetPassword(email: string, resetUrl: string) {
  const content = `
    <h2 style="color:#2c1810;font-size:22px;margin:0 0 8px;">Réinitialisation du mot de passe</h2>
    <p style="color:#5a3a1a;font-size:15px;margin:0 0 24px;">Vous avez demandé à réinitialiser le mot de passe de votre compte Dar Dmana associé à <strong>${email}</strong>.</p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#c9a227;color:#1a0a00;padding:16px 40px;border-radius:4px;text-decoration:none;font-size:15px;font-weight:bold;letter-spacing:1px;">Réinitialiser mon mot de passe</a>
    </div>

    <div style="background:#fff8f0;border:1px solid #e8d5a3;border-radius:6px;padding:16px;margin-top:24px;">
      <p style="margin:0;font-size:13px;color:#8b6914;line-height:1.6;">
        ⚠️ Ce lien est valable <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe reste inchangé.
      </p>
    </div>

    <p style="margin-top:20px;font-size:12px;color:#a09080;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/><span style="color:#c9a227;word-break:break-all;">${resetUrl}</span></p>`

  return sendEmail({
    to: [email],
    subject: 'Réinitialisation de votre mot de passe | Dar Dmana',
    html: baseLayout('Réinitialisation mot de passe', content),
    type: 'password_reset',
  })
}

export async function adminInviteEmail(input: { name: string; email: string; setupUrl: string }) {
  const content = `
    <h2 style="color:#2c1810;font-size:22px;margin:0 0 8px;">Invitation administration Dar Dmana</h2>
    <p style="color:#5a3a1a;font-size:15px;margin:0 0 24px;">Bonjour <strong>${input.name}</strong>,<br/>Un compte administrateur a été créé pour vous. Définissez votre mot de passe pour accéder au back-office.</p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${input.setupUrl}" style="display:inline-block;background:#c9a227;color:#1a0a00;padding:16px 40px;border-radius:4px;text-decoration:none;font-size:15px;font-weight:bold;letter-spacing:1px;">Définir mon mot de passe</a>
    </div>

    <div style="background:#fff8f0;border:1px solid #e8d5a3;border-radius:6px;padding:16px;margin-top:24px;">
      <p style="margin:0;font-size:13px;color:#8b6914;line-height:1.6;">
        Ce lien est valable <strong>7 jours</strong>. Si vous n'attendiez pas cette invitation, ignorez cet email.
      </p>
    </div>

    <p style="margin-top:20px;font-size:12px;color:#a09080;">Lien direct :<br/><span style="color:#c9a227;word-break:break-all;">${input.setupUrl}</span></p>`

  return sendEmail({
    to: [input.email],
    subject: 'Invitation administration | Dar Dmana',
    html: baseLayout('Invitation admin', content),
    type: 'admin_invite',
  })
}

export async function adminTempPasswordEmail(input: {
  name: string
  email: string
  tempPassword: string
  loginUrl: string
}) {
  const content = `
    <h2 style="color:#2c1810;font-size:22px;margin:0 0 8px;">Votre accès administration</h2>
    <p style="color:#5a3a1a;font-size:15px;margin:0 0 24px;">Bonjour <strong>${input.name}</strong>,<br/>Un compte administrateur a été créé pour vous sur Dar Dmana.</p>

    <div style="background:#faf6f0;border:1px solid #e8d5a3;border-radius:6px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#8b6914;text-transform:uppercase;letter-spacing:1px;">Mot de passe temporaire</p>
      <p style="margin:0;font-size:18px;color:#2c1810;font-family:monospace;letter-spacing:2px;">${input.tempPassword}</p>
    </div>

    <p style="color:#5a3a1a;font-size:14px;margin:0 0 24px;">Connectez-vous et changez ce mot de passe dès votre première connexion.</p>

    <div style="text-align:center;">
      <a href="${input.loginUrl}" style="display:inline-block;background:#c9a227;color:#1a0a00;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">Se connecter</a>
    </div>`

  return sendEmail({
    to: [input.email],
    subject: 'Accès administration | Dar Dmana',
    html: baseLayout('Accès admin', content),
    type: 'admin_temp_password',
  })
}

export interface AbandonedCartEmailInput {
  customerName?: string | null
  email: string
  items: EmailOrderItem[]
  totalMad: number
  recoverUrl: string
  promoCode?: string
  promoPercent?: number
}

export async function abandonedCartReminder(input: AbandonedCartEmailInput) {
  const greeting = input.customerName
    ? `Bonjour <strong>${input.customerName}</strong>,`
    : 'Bonjour,'

  const promoBlock = input.promoCode
    ? `
    <div style="margin-top:24px;padding:20px;background:#fff8f0;border:1px dashed #c9a227;border-radius:6px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#8b6914;">Pour vous faire revenir, profitez de <strong>-${input.promoPercent ?? 10}%</strong> sur ce panier :</p>
      <p style="margin:0;font-size:22px;color:#c9a227;font-weight:bold;letter-spacing:3px;">${input.promoCode}</p>
    </div>`
    : ''

  const content = `
    <h2 style="color:#2c1810;font-size:22px;margin:0 0 8px;">Vous avez oublié quelque chose 🛒</h2>
    <p style="color:#5a3a1a;font-size:15px;margin:0 0 24px;">${greeting}<br/>Votre sélection Dar Dmana vous attend toujours. Reprenez votre commande là où vous l'aviez laissée.</p>

    <h3 style="color:#2c1810;font-size:16px;margin:0 0 12px;border-bottom:2px solid #c9a227;padding-bottom:8px;">Votre panier</h3>
    ${itemsTable(input.items)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr><td style="padding:12px 0 0;color:#2c1810;font-size:16px;font-weight:bold;border-top:2px solid #e8d5a3;">Total</td><td style="text-align:right;color:#c9a227;font-size:18px;font-weight:bold;padding-top:12px;border-top:2px solid #e8d5a3;">${input.totalMad.toFixed(2)} MAD</td></tr>
    </table>

    ${promoBlock}

    <div style="margin-top:24px;text-align:center;">
      <a href="${input.recoverUrl}" style="display:inline-block;background:#c9a227;color:#1a0a00;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;">Reprendre ma commande</a>
    </div>`

  return sendEmail({
    to: [input.email],
    subject: input.promoCode
      ? `🎁 -${input.promoPercent ?? 10}% sur votre panier | Dar Dmana`
      : 'Vous avez oublié quelque chose ! | Dar Dmana',
    html: baseLayout('Votre panier vous attend', content),
    type: 'abandoned_cart',
  })
}
