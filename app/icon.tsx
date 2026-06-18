import { ImageResponse } from 'next/og'

// Icône générée — initiale « D » or royal sur vert foncé (identité Dar Dmana).
// Auto-détectée par Next.js (App Router) : injecte <link rel="icon"> sans déclaration manuelle.
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
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
          fontSize: 340,
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
