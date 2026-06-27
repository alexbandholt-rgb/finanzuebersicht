import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart2, Loader2 } from 'lucide-react'

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('E-Mail oder Passwort falsch.')
    } else if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Konto erstellt! Du bist jetzt eingeloggt.')
    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      })
      if (error) setError(error.message)
      else setSuccess('E-Mail gesendet! Prüfe dein Postfach und klicke auf den Link.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f2f7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        width: '360px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
          <BarChart2 size={20} color="#10b981" />
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>Finanzblick</span>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
          {mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Konto erstellen' : 'Passwort zurücksetzen'}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '1.5rem' }}>
          {mode === 'login' ? 'Melde dich mit deinem Konto an.' : mode === 'register' ? 'Erstelle ein neues Konto.' : 'Wir schicken dir einen Link per E-Mail.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="deine@email.de"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {mode !== 'reset' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Passwort</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mindestens 6 Zeichen"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {error && (
            <p style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px' }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ fontSize: '12px', color: '#10b981', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px' }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              padding: '10px',
              borderRadius: '10px',
              background: '#8b5cf6',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Konto erstellen' : 'Link senden'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '1.25rem', alignItems: 'center' }}>
          {mode === 'login' && (
            <>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Noch kein Konto?{' '}
                <button onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                  style={{ color: '#8b5cf6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                  Registrieren
                </button>
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Passwort vergessen?{' '}
                <button onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
                  style={{ color: '#8b5cf6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                  Zurücksetzen
                </button>
              </p>
            </>
          )}
          {mode !== 'login' && (
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                style={{ color: '#8b5cf6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                ← Zurück zur Anmeldung
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
