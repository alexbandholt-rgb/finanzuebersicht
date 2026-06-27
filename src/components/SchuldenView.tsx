import { useState } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import type { LineItem } from '../types'

interface Props {
  schulden: LineItem[]
  onChange: (schulden: LineItem[]) => void
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

function restlaufzeit(betrag: number, rate: number, zinssatz = 0): string {
  if (!rate || rate <= 0 || !betrag) return '—'
  let rest = betrag
  let monate = 0
  while (rest > 0 && monate < 1200) {
    const zins = rest * (zinssatz / 100 / 12)
    const tilgung = Math.max(0, rate - zins)
    if (tilgung <= 0) return '∞ (Rate < Zinsen)'
    rest -= tilgung
    monate++
  }
  const jahre = Math.floor(monate / 12)
  const mo = monate % 12
  if (jahre === 0) return `${mo} Monat${mo !== 1 ? 'e' : ''}`
  if (mo === 0) return `${jahre} Jahr${jahre !== 1 ? 'e' : ''}`
  return `${jahre} J. ${mo} M.`
}

function monatlZinsen(betrag: number, zinssatz: number) {
  return betrag * (zinssatz / 100 / 12)
}

export default function SchuldenView({ schulden, onChange }: Props) {
  const isMobile = useIsMobile()
  const [label, setLabel] = useState('')
  const [betrag, setBetrag] = useState('')
  const [rate, setRate] = useState('')
  const [zins, setZins] = useState('')
  const [aktiv, setAktiv] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editBetrag, setEditBetrag] = useState('')
  const [editRate, setEditRate] = useState('')
  const [editZins, setEditZins] = useState('')
  const [editAktiv, setEditAktiv] = useState(false)

  const add = () => {
    const b = parseFloat(betrag)
    if (!label.trim() || isNaN(b) || b <= 0) return
    onChange([...schulden, {
      id: crypto.randomUUID(),
      label: label.trim(),
      amount: b,
      monatlicheRate: rate ? parseFloat(rate) || undefined : undefined,
      zinssatz: zins ? parseFloat(zins) || undefined : undefined,
      aktiv,
    }])
    setLabel(''); setBetrag(''); setRate(''); setZins(''); setAktiv(true)
  }

  const remove = (id: string) => onChange(schulden.filter(s => s.id !== id))

  const startEdit = (s: LineItem) => {
    setEditingId(s.id)
    setEditLabel(s.label)
    setEditBetrag(s.amount?.toString() ?? '')
    setEditRate(s.monatlicheRate?.toString() ?? '')
    setEditZins(s.zinssatz?.toString() ?? '')
    setEditAktiv(s.aktiv ?? false)
  }

  const saveEdit = () => {
    onChange(schulden.map(s => s.id !== editingId ? s : {
      ...s,
      label: editLabel.trim() || s.label,
      amount: parseFloat(editBetrag) || s.amount,
      monatlicheRate: editRate ? parseFloat(editRate) || undefined : undefined,
      zinssatz: editZins ? parseFloat(editZins) || undefined : undefined,
      aktiv: editAktiv,
    }))
    setEditingId(null)
  }

  const toggleAktiv = (id: string, val: boolean) => {
    onChange(schulden.map(s => s.id !== id ? s : { ...s, aktiv: val }))
  }

  const totalRest = schulden.reduce((acc, s) => acc + (s.amount ?? 0), 0)
  const totalRate = schulden.reduce((acc, s) => acc + (s.monatlicheRate ?? 0), 0)
  const totalZinsen = schulden.reduce((acc, s) =>
    acc + (s.zinssatz && s.amount ? monatlZinsen(s.amount, s.zinssatz) : 0), 0)

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>

      {/* Übersicht-Kacheln */}
      {schulden.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '10px' }}>
          <Kachel label="Gesamtrestschuld" value={fmt(totalRest)} color="#f43f5e" />
          <Kachel label="Monatl. Raten" value={totalRate > 0 ? fmt(totalRate) : '—'} color="#f97316"
            sub={totalZinsen > 0 ? `davon ${fmt(totalZinsen)} Zinsen` : undefined} />
          <Kachel label="Restlaufzeit" value={
            totalRate > 0
              ? restlaufzeit(totalRest, totalRate, totalZinsen > 0 ? (totalZinsen / totalRest * 100 * 12) : 0)
              : '—'
          } color="#8b5cf6" style={isMobile ? { gridColumn: '1 / -1' } : {}} />
        </div>
      )}

      {/* Neue Schuld anlegen */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: isMobile ? '16px' : '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
          Schuld anlegen
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text" value={label} onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Bezeichnung (z.B. Studienkredit, Autokredit)"
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#334155', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Field label="Restbetrag *" value={betrag} onChange={setBetrag} suffix="€" onEnter={add} />
            <Field label="Monatl. Rate" value={rate} onChange={setRate} suffix="€/M" onEnter={add} />
            <Field label="Zinssatz p.a." value={zins} onChange={setZins} suffix="%" onEnter={add} placeholder="z.B. 4.5" />
          </div>

          {/* Vorschau monatliche Zinsen/Tilgung */}
          {betrag && rate && parseFloat(betrag) > 0 && parseFloat(rate) > 0 && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {(() => {
                const b = parseFloat(betrag), r = parseFloat(rate), z = parseFloat(zins) || 0
                const zinsenM = monatlZinsen(b, z)
                const tilgungM = Math.max(0, r - zinsenM)
                return (
                  <>
                    {z > 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>Zinsen/Monat: <b style={{ color: '#f97316' }}>{fmt(zinsenM)}</b></span>}
                    {z > 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tilgung/Monat: <b style={{ color: '#10b981' }}>{fmt(tilgungM)}</b></span>}
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Restlaufzeit: <b style={{ color: '#8b5cf6' }}>{restlaufzeit(b, r, z)}</b></span>
                  </>
                )
              })()}
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={aktiv} onChange={e => setAktiv(e.target.checked)}
              style={{ width: '15px', height: '15px', accentColor: '#10b981', cursor: 'pointer' }} />
            <span style={{ fontSize: '13px', color: '#475569' }}>Wird gerade abgezahlt (Restbetrag sinkt monatlich automatisch)</span>
          </label>

          <button onClick={add} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: '#f43f5e', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
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
              const zinsenM = s.zinssatz && s.amount ? monatlZinsen(s.amount, s.zinssatz) : 0
              const tilgungM = s.monatlicheRate ? Math.max(0, s.monatlicheRate - zinsenM) : 0

              if (isEditing) {
                return (
                  <div key={s.id} style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)}
                      style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#334155', outline: 'none', fontFamily: 'inherit' }} />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Field label="Restbetrag" value={editBetrag} onChange={setEditBetrag} suffix="€" small />
                      <Field label="Rate" value={editRate} onChange={setEditRate} suffix="€/M" small />
                      <Field label="Zinssatz p.a." value={editZins} onChange={setEditZins} suffix="%" small />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={editAktiv} onChange={e => setEditAktiv(e.target.checked)}
                        style={{ width: '14px', height: '14px', accentColor: '#10b981', cursor: 'pointer' }} />
                      <span style={{ fontSize: '12px', color: '#475569' }}>Wird gerade abgezahlt</span>
                    </label>
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
                <div key={s.id} style={{ padding: isMobile ? '12px 16px' : '16px 24px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    {/* Aktiv-Toggle */}
                    <label title="Wird gerade abgezahlt" style={{ cursor: 'pointer', flexShrink: 0, paddingTop: '2px' }}>
                      <input type="checkbox" checked={s.aktiv ?? false} onChange={e => toggleAktiv(s.id, e.target.checked)}
                        style={{ width: '15px', height: '15px', accentColor: '#10b981', cursor: 'pointer' }} />
                    </label>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</p>
                          {s.aktiv && <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '1px 6px', flexShrink: 0 }}>aktiv</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#f43f5e', fontFamily: 'monospace' }}>{fmt(s.amount ?? 0)}</span>
                          <button onClick={() => startEdit(s)} style={{ padding: '5px', borderRadius: '7px', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => remove(s.id)} style={{ padding: '5px', borderRadius: '7px', border: 'none', background: '#fff1f2', color: '#f43f5e', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {(s.monatlicheRate || s.zinssatz) && (
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', lineHeight: '1.6' }}>
                          {s.monatlicheRate ? `${fmt(s.monatlicheRate)}/Monat` : ''}
                          {s.zinssatz ? ` · ${s.zinssatz}% p.a.` : ''}
                          {s.monatlicheRate ? <><br />Restlaufzeit: <b style={{ color: '#8b5cf6' }}>{restlaufzeit(s.amount ?? 0, s.monatlicheRate, s.zinssatz ?? 0)}</b></> : ''}
                        </p>
                      )}
                      {s.aktiv && !s.monatlicheRate && (
                        <p style={{ fontSize: '11px', color: '#f97316', marginTop: '3px' }}>
                          Keine Rate angegeben — Betrag sinkt nicht automatisch.
                        </p>
                      )}
                      {zinsenM > 0 && (
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                          Zinsen/M: <span style={{ color: '#f97316' }}>{fmt(zinsenM)}</span>
                          {' · '}Tilgung/M: <span style={{ color: '#10b981' }}>{fmt(tilgungM)}</span>
                        </p>
                      )}
                    </div>
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

function Field({ label, value, onChange, suffix, onEnter, placeholder, small }: {
  label?: string; value: string; onChange: (v: string) => void
  suffix: string; onEnter?: () => void; placeholder?: string; small?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: small ? 'white' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', flex: 1, minWidth: small ? '100px' : '130px' }}
      title={label}>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? label}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()} className="no-spinner"
        style={{ flex: 1, background: 'transparent', border: 'none', padding: small ? '7px 8px' : '10px 12px', fontSize: small ? '13px' : '14px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }} />
      <span style={{ paddingRight: '10px', fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>{suffix}</span>
    </div>
  )
}

function Kachel({ label, value, color, sub, style }: { label: string; value: string; color: string; sub?: string; style?: React.CSSProperties }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: '14px 16px', ...style }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</p>
      {sub && <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{sub}</p>}
    </div>
  )
}
