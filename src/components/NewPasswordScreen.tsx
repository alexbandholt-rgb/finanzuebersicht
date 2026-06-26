import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart2, Loader2, Check } from 'lucide-react'

export default function NewPasswordScreen() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 6) { setError('Mindestens 6 Zeichen.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => window.location.replace('/'), 2000)
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '10px',
    border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155',
    outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem', width: '360px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
          <BarChart2 size={20} color="#10b981" />
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>Finanzübersicht</span>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1rem 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={22} color="#10b981" />
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Passwort gespeichert!</p>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Du wirst weitergeleitet…</p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Neues Passwort</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '1.5rem' }}>Wähle ein neues Passwort für dein Konto.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Neues Passwort</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Passwort bestätigen</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Nochmal eingeben" required style={inputStyle} />
              </div>

              {error && <p style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px' }}>{error}</p>}

              <button type="submit" disabled={loading}
                style={{ marginTop: '4px', padding: '10px', borderRadius: '10px', background: '#8b5cf6', color: 'white', fontWeight: 600, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {loading && <Loader2 size={14} className="animate-spin" />}
                Passwort speichern
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
