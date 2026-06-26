import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Loader2 } from 'lucide-react'

interface UserEntry {
  id: string
  email: string
  name: string
  created_at: string
  last_sign_in_at: string
}

export default function NutzerView() {
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data, error: fnError } = await supabase.functions.invoke('list-users')
      if (fnError) { setError(fnError.message); setLoading(false); return }
      setUsers(data)
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Users size={18} color="#8b5cf6" />
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Nutzer</h2>
        <span style={{ fontSize: '12px', background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe', borderRadius: '99px', padding: '2px 10px', fontWeight: 600 }}>{users.length}</span>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px' }}>
          <Loader2 size={14} className="animate-spin" /> Lade Nutzer…
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}

      {!loading && users.map(u => (
        <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6' }}>{(u.name || u.email).charAt(0).toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.name || u.email}
            </p>
            {u.name && <p style={{ fontSize: '11px', color: '#94a3b8' }}>{u.email}</p>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Registriert: {fmt(u.created_at)}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Zuletzt: {fmt(u.last_sign_in_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
