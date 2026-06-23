import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'
import { getDeliverySettings } from '@/lib/delivery/settings'
import { SenditDeliveryProvider } from '@/lib/delivery/providers/sendit'

const BodySchema = z.object({
  // Clé saisie à l'écran (optionnelle) ; sinon on teste la clé enregistrée.
  apiKey: z.string().trim().max(300).optional(),
})

// POST /api/admin/delivery/test-sendit → teste la connexion à l'API Sendit.
export async function POST(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!hasPermission(session.role, 'cms.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  try {
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})))
    const typedKey = parsed.success ? parsed.data.apiKey?.trim() : undefined

    // Clé prioritaire : celle saisie ; sinon la clé enregistrée (déchiffrée).
    let apiKey = typedKey
    if (!apiKey) {
      const settings = await getDeliverySettings()
      apiKey = settings.senditApiKey || undefined
    }

    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        message: 'Aucune clé Sendit à tester (saisissez-en une ou enregistrez-la d’abord).',
      })
    }

    const provider = new SenditDeliveryProvider(apiKey)
    const result = await provider.testConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[POST /api/admin/delivery/test-sendit]', error)
    return NextResponse.json({ ok: false, message: 'Erreur serveur pendant le test.' }, { status: 500 })
  }
}
