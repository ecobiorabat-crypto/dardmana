import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const isDev = process.env.NODE_ENV !== 'production'

// CSP de base : autorise self + les services tiers utilisés (Stripe, Cloudinary,
// Supabase). 'unsafe-inline'/'unsafe-eval' restent nécessaires au runtime Next.
// upgrade-insecure-requests est désactivé en dev : sur http://localhost, il peut
// bloquer HMR/WebSocket Turbopack et empêcher le chargement des feuilles de style.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://widget.cloudinary.com https://upload-widget.cloudinary.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.supabase.in https://api.cloudinary.com https://res.cloudinary.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://widget.cloudinary.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(!isDev ? ['upgrade-insecure-requests'] : []),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig: NextConfig = {
  // Fixe explicitement la racine du projet pour éviter que Turbopack ne
  // remonte vers le dossier parent (~/Desktop), inaccessible sous macOS
  // (restriction de confidentialité → erreur "Operation not permitted").
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
