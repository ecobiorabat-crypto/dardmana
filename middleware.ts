import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const handleI18nRouting = createIntlMiddleware(routing)

// Simple in-memory rate limiter (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.reset < now) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs })
    return false
  }
  if (entry.count >= limit) return true
  entry.count++
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets, Next.js internals et fichiers SEO racine.
  // Important : robots.txt / sitemap.xml doivent rester à la racine et NE PAS
  // être préfixés par la locale (sinon redirection 307 → /fr/robots.txt, cassé
  // pour les crawlers).
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|txt|xml|webmanifest|woff2?)$/)
  ) {
    return NextResponse.next()
  }

  // Rate limit auth-adjacent API endpoints
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (pathname.startsWith('/api/checkout') || pathname.startsWith('/api/auth')) {
    if (isRateLimited(ip, 20, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes, réessayez dans une minute.' }, { status: 429 })
    }
  }

  // API routes: only refresh Supabase session, skip i18n
  if (pathname.startsWith('/api/')) {
    let response = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.getUser()
    return response
  }

  // Page routes: refresh session + auth checks + i18n
  let supabaseResponse = NextResponse.next({ request })
  let userEmail: string | null = null

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    userEmail = user?.email ?? null
  } catch {
    // Auth refresh failed — continue without blocking
  }

  // Protect admin pages — check the HttpOnly JWT cookie set by /api/auth/admin/login
  const isAdminPage = pathname.match(/^\/(fr|ar|en)\/admin/)
  if (isAdminPage) {
    const adminCookie = request.cookies.get('dar-dmana-admin-session')
    if (!adminCookie?.value) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect client account pages
  const isAccountPage = pathname.match(/^\/(fr|ar|en)\/compte/)
  if (isAccountPage && !userEmail) {
    const loc = isAccountPage[1]
    const loginUrl = new URL(`/${loc}/auth/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const redirect = NextResponse.redirect(loginUrl)
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirect.cookies.set(cookie.name, cookie.value)
    }
    return redirect
  }

  // Admin pages live outside i18n routing (no locale prefix needed)
  if (pathname.startsWith('/admin')) {
    return supabaseResponse
  }

  // Apply i18n routing and carry Supabase session cookies forward
  const intlResponse = handleI18nRouting(request)
  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value)
  }
  return intlResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
