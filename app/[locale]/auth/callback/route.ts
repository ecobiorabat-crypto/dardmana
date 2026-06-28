import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Callback OAuth (flow PKCE). Supabase renvoie ici après l'approbation Google :
 *   - succès  : ?code=… → échange contre une session (pose les cookies), puis
 *               redirige vers `next` (destination d'origine) ou /{locale}/compte.
 *   - échec   : ?error=… (ex. provider non activé) → retour login avec message.
 *
 * Sans cette route, le « code » PKCE n'est jamais échangé : aucune session n'est
 * créée et l'utilisateur est renvoyé vers la page de connexion.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params
  const { searchParams, origin } = request.nextUrl

  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Destination après connexion — uniquement un chemin interne (anti open-redirect).
  let next = searchParams.get('next') || `/${locale}/compte`
  if (!next.startsWith('/')) next = `/${locale}/compte`

  const loginUrl = new URL(`/${locale}/auth/login`, origin)

  // Erreur renvoyée par le provider (ex. « provider is not enabled »).
  if (error) {
    loginUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(new URL(next, origin))
    }
    loginUrl.searchParams.set('error', exchangeError.message)
    return NextResponse.redirect(loginUrl)
  }

  // Ni code ni erreur → retour login.
  return NextResponse.redirect(loginUrl)
}
