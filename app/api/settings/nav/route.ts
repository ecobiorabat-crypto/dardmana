import { NextResponse } from 'next/server'
import { getSiteSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

// GET /api/settings/nav — config de navigation publique (activation des pages).
export async function GET() {
  const { navConfig } = await getSiteSettings()
  return NextResponse.json({ navConfig })
}
