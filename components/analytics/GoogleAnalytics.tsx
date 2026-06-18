'use client'

import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * Charge gtag.js (Google Analytics 4) après interaction, sans bloquer le
 * rendu initial. Expose `window.gtag` pour les événements (lib/analytics).
 * Ne rend rien tant que NEXT_PUBLIC_GA_MEASUREMENT_ID n'est pas défini.
 */
export function GoogleAnalytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  )
}

export default GoogleAnalytics
