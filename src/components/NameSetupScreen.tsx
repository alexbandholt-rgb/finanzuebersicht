import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart2, Loader2 } from 'lucide-react'

interface Props {
  onDone: () => void
}

export default function NameSetupScreen({ onDone }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } })
    if (error) { setError(error.message); setLoading(false); return }
    onDone()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem', width: '360px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
          <BarChart2 size={20} color="#10b981" />
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>Finanzblick</span>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>Willkommen! 👋</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '1.75rem' }}>Wie sollen wir dich nennen?</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Dein Name"
            autoFocus
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />

          {error && <p style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{ padding: '10px', borderRadius: '10px', background: '#8b5cf6', color: 'white', fontWeight: 600, fontSize: '14px', border: 'none', cursor: loading || !name.trim() ? 'not-allowed' : 'pointer', opacity: loading || !name.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Los geht's
          </button>
        </form>
      </div>
    </div>
  )
}
