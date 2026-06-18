import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface SignUpPayload {
  email: string
  password: string
  name: string
  phone?: string
  preferredLanguage?: string
}

export interface SignInPayload {
  email: string
  password: string
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export async function signUp({ email, password, name, phone, preferredLanguage }: SignUpPayload) {
  const supabase = getSupabase()

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  if (!data.user) throw new Error('Création compte échouée')

  // Create Customer record in DB
  await fetch('/api/auth/customer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authUserId: data.user.id,
      email,
      name,
      phone: phone ?? null,
      preferredLanguage: preferredLanguage ?? 'fr',
    }),
  })

  return data
}

// ─── Sign In ─────────────────────────────────────────────────────────────────

export async function signIn({ email, password }: SignInPayload) {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─── Sign Out ────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─── Get Session ─────────────────────────────────────────────────────────────

export async function getSession() {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
