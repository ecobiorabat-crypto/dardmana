'use client'

import { useState, type FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Lien invalide — token manquant.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/admin/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Erreur')
        return
      }
      setSuccess(true)
    } catch {
      setError('Erreur de connexion — réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.card}>
        <div style={styles.header}>
          <p style={styles.latinTitle}>DAR DMANA</p>
          <p style={styles.subtitle}>Administration</p>
        </div>
        <p style={{ ...styles.label, textTransform: 'none', letterSpacing: 0, fontSize: '15px', color: '#2c1810' }}>
          Mot de passe enregistré. Vous pouvez vous connecter.
        </p>
        <a href="/admin/login" style={{ ...styles.button, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
          Se connecter
        </a>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <p style={styles.latinTitle}>DAR DMANA</p>
        <p style={styles.subtitle}>Définir le mot de passe</p>
      </div>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <div style={styles.fieldGroup}>
          <label htmlFor="password" style={styles.label}>Nouveau mot de passe</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label htmlFor="confirm" style={styles.label}>Confirmer</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
        </div>
        {error && <p style={styles.errorMsg}>{error}</p>}
        <button type="submit" disabled={loading || !password || !confirm} style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}

export default function AdminSetPasswordPage() {
  return (
    <div style={styles.root}>
      <Suspense fallback={<div style={styles.card}><p style={styles.label}>Chargement…</p></div>}>
        <SetPasswordForm />
      </Suspense>
    </div>
  )
}

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
  header: { textAlign: 'center', marginBottom: '24px' },
  latinTitle: { margin: '0 0 6px', fontSize: '13px', color: '#c9a227', letterSpacing: '5px', fontWeight: '600' },
  subtitle: { margin: 0, fontSize: '12px', color: '#8b6914', letterSpacing: '3px', textTransform: 'uppercase' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#5a3a1a', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'system-ui, sans-serif' },
  input: { padding: '12px 16px', border: '1.5px solid #e0cba8', borderRadius: '6px', fontSize: '15px', color: '#1a0a00', background: '#fff', outline: 'none', fontFamily: 'system-ui, sans-serif', width: '100%', boxSizing: 'border-box' },
  errorMsg: { margin: 0, padding: '12px 16px', background: '#fff0f0', border: '1px solid #f5b8b8', borderRadius: '6px', color: '#c0392b', fontSize: '13px', fontFamily: 'system-ui, sans-serif' },
  button: { padding: '14px', background: '#c9a227', color: '#1a0a00', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'system-ui, sans-serif' },
  buttonDisabled: { background: '#d4c08a', cursor: 'not-allowed', color: '#7a6010' },
}
