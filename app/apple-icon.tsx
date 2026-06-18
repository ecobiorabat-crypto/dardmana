import { ImageResponse } from 'next/og'

// Apple touch icon 180×180 — auto-détectée par Next.js (App Router).
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a5c2a 0%, #14401f 100%)',
          color: '#c9a84c',
          fontSize: 118,
          fontWeight: 700,
          fontFamily: 'Georgia, "Times New Roman", serif',
          lineHeight: 1,
        }}
      >
        D
      </div>
    ),
    { ...size },
  )
}
