import { type NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { ContactSchema } from '@/lib/validations/contact'

const FROM = 'Dar Dmana <no-reply@dardmana.ma>'
// ADMIN_EMAIL a été retiré du système d'auth ; destinataire dédié au contact.
const CONTACT_TO = process.env.CONTACT_EMAIL ?? 'contact@dardmana.ma'

const SUBJECT_LABELS: Record<string, string> = {
  product: 'Question produit',
  order: 'Commande',
  partnership: 'Partenariat',
  other: 'Autre',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ContactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { name, email, phone, subject, message } = parsed.data
    const subjectLabel = SUBJECT_LABELS[subject] ?? subject

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#1a0a00;padding:28px 40px;text-align:center;">
        <p style="margin:0;color:#c9a227;font-size:22px;letter-spacing:3px;">دار ضمانة</p>
        <p style="margin:6px 0 0;color:#e8d5a3;font-size:12px;letter-spacing:2px;">DAR DMANA</p>
      </td></tr>
      <tr><td style="padding:36px 40px;">
        <h2 style="color:#2c1810;font-size:20px;margin:0 0 20px;">Nouveau message de contact</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#2c1810;">
          <tr><td style="padding:8px 0;color:#8b6914;width:120px;">Nom</td><td style="padding:8px 0;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px 0;color:#8b6914;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#c9a227;">${escapeHtml(email)}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px 0;color:#8b6914;">Téléphone</td><td style="padding:8px 0;">${escapeHtml(phone)}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#8b6914;">Sujet</td><td style="padding:8px 0;">${escapeHtml(subjectLabel)}</td></tr>
        </table>
        <div style="margin-top:20px;padding:20px;background:#faf6f0;border-left:4px solid #c9a227;border-radius:0 6px 6px 0;">
          <p style="margin:0;color:#2c1810;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`

    try {
      await resend.emails.send({
        from: FROM,
        to: [CONTACT_TO],
        replyTo: email,
        subject: `[Contact] ${subjectLabel} — ${name}`,
        html,
      })
    } catch (mailError) {
      // En dev, RESEND_API_KEY peut être absent : on journalise sans bloquer.
      if (process.env.NODE_ENV === 'production') throw mailError
      console.warn('[POST /api/contact] Resend non configuré — message journalisé:', {
        name,
        email,
        phone,
        subject: subjectLabel,
        message,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/contact]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
