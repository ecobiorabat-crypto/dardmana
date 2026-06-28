import { type NextRequest, NextResponse } from 'next/server'
import { guardAdminApi } from '@/lib/auth/admin-api-guard'
import { sendCallMeBotTest } from '@/lib/notify-whatsapp'

/**
 * GET /api/admin/test-callmebot — déclenche une notification WhatsApp de test
 * (admin authentifié uniquement) et retourne le diagnostic complet : config,
 * statut HTTP, corps de réponse CallMeBot et URL utilisée (clé API masquée).
 */
export async function GET(request: NextRequest) {
  // 'orders.view' est détenue par tous les rôles admin → « admin authentifié ».
  const guard = await guardAdminApi(request, 'orders.view')
  if (!guard.ok) return guard.response

  const result = await sendCallMeBotTest()

  return NextResponse.json(
    {
      success: result.ok,
      message: result.ok
        ? 'Notification WhatsApp de test envoyée. Vérifiez votre WhatsApp.'
        : result.skipped ?? 'Échec de l’envoi (voir détails ci-dessous).',
      diagnostic: result,
    },
    { status: result.ok ? 200 : 422 },
  )
}
