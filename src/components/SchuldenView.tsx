import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import type { LineItem } from '../types'

interface Props {
  schulden: LineItem[]
  onChange: (schulden: LineItem[]) => void
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

function restlaufzeit(betrag: number, rate: number): string {
  if (!rate || rate <= 0 || !betrag) return '—'
  const monate = Math.ceil(betrag / rate)
  const jahre = Math.floor(monate / 12)
  const rest = monate % 12
  if (jahre === 0) return `${rest} Monat${rest !== 1 ? 'e' : ''}`
  if (rest === 0) return `${jahre} Jahr${jahre !== 1 ? 'e' : ''}`
  return `${jahre} J. ${rest} M.`
}

export default function SchuldenView({ schulden, onChange }: Props) {
  const [label, setLabel] = useState('')
  const [betrag, setBetrag] = useState('')
  const [rate, setRate] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editBetrag, setEditBetrag] = useState('')
  const [editRate, setEditRate] = useState('')

  const add = () => {
    const b = parseFloat(betrag)
    if (!label.trim() || isNaN(b) || b <= 0) return
    onChange([...schulden, {
      id: crypto.randomUUID(),
      label: label.trim(),
      amount: b,
      monatlicheRate: rate ? parseFloat(rate) || undefined : undefined,
    }])
    setLabel(''); setBetrag(''); setRate('')
  }

  const remove = (id: string) => onChange(schulden.filter(s => s.id !== id))

  const startEdit = (s: LineItem) => {
    setEditingId(s.id)
    setEditLabel(s.label)
    setEditBetrag(s.amount?.toString() ?? '')
    setEditRate(s.monatlicheRate?.toString() ?? '')
  }

  const saveEdit = () => {
    onChange(schulden.map(s => s.id !== editingId ? s : {
      ...s,
      label: editLabel.trim() || s.label,
      amount: parseFloat(editBetrag) || s.amount,
      monatlicheRate: editRate ? parseFloat(editRate) || undefined : undefined,
    }))
    setEditingId(null)
  }

  const totalRest = schulden.reduce((acc, s) => acc + (s.amount ?? 0), 0)
  const totalRate = schulden.reduce((acc, s) => acc + (s.monatlicheRate ?? 0), 0)

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Übersicht-Kacheln */}
      {schulden.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <Kachel label="Gesamtrestschuld" value={fmt(totalRest)} color="#f43f5e" />
          <Kachel label="Monatl. Raten" value={totalRate > 0 ? fmt(totalRate) : '—'} color="#f97316" />
          <Kachel label="Restlaufzeit" value={totalRate > 0 ? restlaufzeit(totalRest, totalRate) : '—'} color="#8b5cf6" />
        </div>
      )}

      {/* Neue Schuld anlegen */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
          Schuld anlegen
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Bezeichnung (z.B. Studienkredit, Autokredit)"
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#334155', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', flex: 1, minWidth: '140px' }}>
              <input
                type="number"
                value={betrag}
                onChange={e => setBetrag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                placeholder="Restbetrag"
                className="no-spinner"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 12px', fontSize: '14px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }}
              />
              <span style={{ paddingRight: '12px', fontSize: '13px', color: '#94a3b8' }}>€</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', flex: 1, minWidth: '140px' }}>
              <input
                type="number"
                value={rate}
                onChange={e => setRate(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                placeholder="Monatl. Rate (optional)"
                className="no-spinner"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 12px', fontSize: '14px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }}
              />
              <span style={{ paddingRight: '12px', fontSize: '13px', color: '#94a3b8' }}>€/M</span>
            </div>
          </div>
          <button
            onClick={add}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: '#f43f5e', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}
          >
            <Plus size={16} /> Schuld anlegen
          </button>
        </div>
      </div>

      {/* Schuldenliste */}
      {schulden.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Schulden ({schulden.length})
            </h3>
          </div>
          <div className="flex flex-col">
            {schulden.map(s => {
              const isEditing = editingId === s.id
              const laufzeit = s.monatlicheRate && s.amount ? restlaufzeit(s.amount, s.monatlicheRate) : null

              if (isEditing) {
                return (
                  <div key={s.id} style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#334155', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', flex: 1 }}>
                        <input type="number" value={editBetrag} onChange={e => setEditBetrag(e.target.value)} className="no-spinner"
                          style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px 10px', fontSize: '13px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }} />
                        <span style={{ paddingRight: '8px', fontSize: '12px', color: '#94a3b8' }}>€</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', flex: 1 }}>
                        <input type="number" value={editRate} onChange={e => setEditRate(e.target.value)} placeholder="Rate (optional)" className="no-spinner"
                          style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px 10px', fontSize: '13px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }} />
                        <span style={{ paddingRight: '8px', fontSize: '12px', color: '#94a3b8' }}>€/M</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        <Check size={14} /> Speichern
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                        <X size={14} /> Abbrechen
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={s.id} style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>{s.label}</p>
                    {laufzeit && (
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {fmt(s.monatlicheRate ?? 0)}/Monat · noch {laufzeit}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#f43f5e', fontFamily: 'monospace', flexShrink: 0 }}>{fmt(s.amount ?? 0)}</span>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => startEdit(s)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer' }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(s.id)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#fff1f2', color: '#f43f5e', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {schulden.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <p style={{ fontSize: '14px' }}>Noch keine Schulden eingetragen.</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Füge oben eine Schuld hinzu.</p>
        </div>
      )}
    </div>
  )
}

function Kachel({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: '16px 20px' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</p>
    </div>
  )
}
