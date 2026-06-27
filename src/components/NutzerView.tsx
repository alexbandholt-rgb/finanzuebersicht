import { useState, useEffect } from 'react'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { Users, Loader2, Download } from 'lucide-react'

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
  const [exporting, setExporting] = useState(false)

  const handleExportAll = async () => {
    setExporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/export-data?all=1`,
        { headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY } }
      )
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finanzuebersicht_alle_nutzer_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert('Export fehlgeschlagen: ' + (e.message ?? 'Unbekannter Fehler'))
    } finally {
      setExporting(false)
    }
  }

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
  const fmtDateTime = (iso: string) => iso ? new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr' : '—'

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Users size={18} color="#8b5cf6" />
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Nutzer</h2>
        <span style={{ fontSize: '12px', background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe', borderRadius: '99px', padding: '2px 10px', fontWeight: 600 }}>{users.length}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleExportAll}
          disabled={exporting}
          style={{ padding: '7px 14px', borderRadius: '10px', border: '1px solid #d1fae5', background: '#f0fdf4', color: '#059669', fontSize: '13px', fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {exporting ? 'Lädt…' : 'Alle Daten exportieren'}
        </button>
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
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Zuletzt: {fmtDateTime(u.last_sign_in_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
