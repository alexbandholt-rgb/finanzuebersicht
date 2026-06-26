import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Check, Loader2, Trash2, AlertTriangle } from 'lucide-react'

interface Props {
  email: string
}

export default function AccountView({ email }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.name) setName(user.user_metadata.name)
    })
  }, [])
  const [newEmail, setNewEmail] = useState(email)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updates: { email?: string; password?: string; data?: { name: string } } = {}
      if (newEmail !== email) updates.email = newEmail
      if (newPassword) updates.password = newPassword
      if (name) updates.data = { name }

      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error
      setSaved(true)
      setNewPassword('')
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('https://zgqfoztgzdesamzgpwdk.supabase.co/functions/v1/delete-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      await supabase.auth.signOut()
    } catch (e: any) {
      setError('Konto konnte nicht gelöscht werden.')
      setDeleting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#334155',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Konto</h2>

      {/* Profil */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Profildaten</p>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Dein Name"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>E-Mail</label>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Neues Passwort</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Leer lassen um nicht zu ändern"
            style={inputStyle}
          />
        </div>

        {error && (
          <p style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px' }}>{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px',
            borderRadius: '10px',
            background: saved ? '#f0fdf4' : '#8b5cf6',
            color: saved ? '#10b981' : 'white',
            border: saved ? '1px solid #bbf7d0' : 'none',
            fontWeight: 600,
            fontSize: '14px',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saved && <Check size={14} />}
          {saved ? 'Gespeichert' : 'Änderungen speichern'}
        </button>
      </div>

      {/* Konto löschen */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={15} color="#ef4444" />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ef4444' }}>Gefahrenzone</p>
        </div>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: '#fef2f2',
              color: '#ef4444',
              border: '1px solid #fecaca',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Trash2 size={14} />
            Konto löschen
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Bist du sicher? Alle deine Daten werden unwiderruflich gelöscht.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ flex: 1, padding: '9px', borderRadius: '10px', background: '#f1f5f9', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: '#475569' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '9px', borderRadius: '10px', background: '#ef4444', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                Ja, löschen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
