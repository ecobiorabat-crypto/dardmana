'use client'

import { useState, type FormEvent } from 'react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Identifiants invalides')
        return
      }

      // Hard navigation — force le navigateur à envoyer le cookie HttpOnly
      // fraîchement défini dans la requête suivante (requis sur Safari).
      window.location.href = '/admin'
    } catch {
      setError('Erreur de connexion — réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Brand header */}
        <div style={styles.header}>
          <p style={styles.arabicTitle}>دار ضمانة</p>
          <p style={styles.latinTitle}>DAR DMANA</p>
          <p style={styles.subtitle}>Administration</p>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="admin@dardmana.ma"
              disabled={loading}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && <p style={styles.errorMsg}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              ...styles.button,
              ...(loading || !email || !password ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              'Connexion'
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footerText}>
          Accès réservé aux administrateurs autorisés.
        </p>
      </div>
    </div>
  )
}

// ─── Inline styles (no Tailwind dependency needed for server-isolated admin) ──

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0a00 0%, #2d1200 50%, #1a0a00 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  card: {
    background: '#faf6f0',
    borderRadius: '12px',
    padding: '48px 40px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '0',
  },
  arabicTitle: {
    margin: '0 0 4px',
    fontSize: '32px',
    color: '#1a0a00',
    fontFamily: 'Georgia, serif',
    letterSpacing: '2px',
  },
  latinTitle: {
    margin: '0 0 6px',
    fontSize: '13px',
    color: '#c9a227',
    letterSpacing: '5px',
    fontWeight: '600',
  },
  subtitle: {
    margin: '0',
    fontSize: '12px',
    color: '#8b6914',
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
  },
  divider: {
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #c9a227, transparent)',
    margin: '28px 0',
    borderRadius: '1px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#5a3a1a',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    fontFamily: 'system-ui, sans-serif',
  },
  input: {
    padding: '12px 16px',
    border: '1.5px solid #e0cba8',
    borderRadius: '6px',
    fontSize: '15px',
    color: '#1a0a00',
    background: '#fff',
    outline: 'none',
    fontFamily: 'system-ui, sans-serif',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
    width: '100%',
  },
  errorMsg: {
    margin: '0',
    padding: '12px 16px',
    background: '#fff0f0',
    border: '1px solid #f5b8b8',
    borderRadius: '6px',
    color: '#c0392b',
    fontSize: '13px',
    fontFamily: 'system-ui, sans-serif',
  },
  button: {
    padding: '14px',
    background: '#c9a227',
    color: '#1a0a00',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '48px',
    marginTop: '4px',
    transition: 'background 0.2s',
  },
  buttonDisabled: {
    background: '#d4c08a',
    cursor: 'not-allowed',
    color: '#7a6010',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(26,10,0,0.2)',
    borderTopColor: '#1a0a00',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  footerText: {
    marginTop: '24px',
    textAlign: 'center' as const,
    fontSize: '11px',
    color: '#a09080',
    fontFamily: 'system-ui, sans-serif',
  },
}
