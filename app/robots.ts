import type { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/fr/compte',
          '/ar/compte',
          '/en/compte',
          '/*/checkout',
        ],
        crawlDelay: 10,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
