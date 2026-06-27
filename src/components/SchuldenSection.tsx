import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { LineItem } from '../types'

interface Props {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

function newDebt(): LineItem {
  return { id: crypto.randomUUID(), label: '', amount: null, gesamtbetrag: undefined, monatlicheRate: undefined }
}

export default function SchuldenSection({ items, onChange }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const update = (id: string, field: keyof LineItem, value: string) => {
    onChange(items.map(item => {
      if (item.id !== id) return item
      if (field === 'label') return { ...item, label: value }
      const num = value === '' ? undefined : parseFloat(value)
      if (field === 'amount') return { ...item, amount: num ?? null }
      if (field === 'gesamtbetrag') return { ...item, gesamtbetrag: num }
      if (field === 'monatlicheRate') return { ...item, monatlicheRate: num }
      if (field === 'startDatum') return { ...item, startDatum: value }
      return item
    }))
  }

  const toggleFixkosten = (id: string, checked: boolean) => {
    onChange(items.map(item => item.id !== id ? item : { ...item, inkludiereInFixkosten: checked }))
  }

  const remove = (id: string) => onChange(items.filter(i => i.id !== id))
  const add = () => onChange([...items, newDebt()])

  const totalRest = items.reduce((acc, i) => acc + (i.amount ?? 0), 0)
  const totalRate = items.reduce((acc, i) => acc + (i.monatlicheRate ?? 0), 0)

  return (
    <div className="rounded-2xl flex flex-col gap-4 bg-white shadow-sm" style={{ borderLeft: '4px solid #f43f5e', maxWidth: '590px', padding: '24px', position: 'relative' }}>

      <div className="flex items-center justify-between cursor-pointer" onClick={() => setCollapsed(c => !c)}>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#f43f5e' }} />
          <h2 className="text-sm font-bold tracking-wide text-slate-700">Schulden</h2>
          {collapsed && totalRest > 0 && (
            <span className="text-xs font-mono text-slate-400">{fmt(totalRest)}</span>
          )}
        </div>
        <span className="text-slate-300">{collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</span>
      </div>

      {!collapsed && (<>
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const progress = item.gesamtbetrag && item.amount !== null
              ? Math.max(0, Math.min(100, ((item.gesamtbetrag - item.amount) / item.gesamtbetrag) * 100))
              : null

            return (
              <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => update(item.id, 'label', e.target.value)}
                    placeholder="Bezeichnung (z.B. Studienkredit)"
                    style={{ flex: 1, background: 'white', border: '1px solid #fecdd3', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', color: '#334155', outline: 'none', fontFamily: 'inherit', minWidth: 0 }}
                  />
                  <button onClick={() => remove(item.id)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#fca5a5', cursor: 'pointer', flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: '100px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Restbetrag</span>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #fecdd3', borderRadius: '8px', overflow: 'hidden' }}>
                      <input type="number" value={item.amount ?? ''} onChange={e => update(item.id, 'amount', e.target.value)} placeholder="0" className="no-spinner"
                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px 8px', fontSize: '13px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }} />
                      <span style={{ paddingRight: '8px', fontSize: '11px', color: '#f43f5e' }}>€</span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: '100px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gesamtbetrag</span>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <input type="number" value={item.gesamtbetrag ?? ''} onChange={e => update(item.id, 'gesamtbetrag', e.target.value)} placeholder="0" className="no-spinner"
                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px 8px', fontSize: '13px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }} />
                      <span style={{ paddingRight: '8px', fontSize: '11px', color: '#94a3b8' }}>€</span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: '100px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monatl. Rate</span>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <input type="number" value={item.monatlicheRate ?? ''} onChange={e => update(item.id, 'monatlicheRate', e.target.value)} placeholder="0" className="no-spinner"
                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px 8px', fontSize: '13px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }} />
                      <span style={{ paddingRight: '8px', fontSize: '11px', color: '#94a3b8' }}>€</span>
                    </div>
                  </label>
                </div>

                {(item.monatlicheRate ?? 0) > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={item.inkludiereInFixkosten ?? false}
                      onChange={e => toggleFixkosten(item.id, e.target.checked)}
                      style={{ width: '14px', height: '14px', accentColor: '#8b5cf6', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Rate zu Fixkosten hinzufügen</span>
                  </label>
                )}

                {progress !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ height: '6px', background: '#fecdd3', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: '#f43f5e', borderRadius: '99px', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 600 }}>
                      {progress.toFixed(1)}% getilgt — noch {fmt(item.amount ?? 0)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button onClick={add} className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mt-0.5 w-fit px-2 py-1 rounded-lg hover:bg-slate-50">
          <Plus size={13} /> Schuld hinzufügen
        </button>

        {items.length > 0 && (
          <div className="flex flex-col gap-1 pt-3 mt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gesamt Restschuld</span>
              <span className="text-sm font-mono font-bold" style={{ color: '#f43f5e' }}>{fmt(totalRest)}</span>
            </div>
            {totalRate > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Monatliche Raten gesamt</span>
                <span className="text-xs font-mono text-slate-500">{fmt(totalRate)}</span>
              </div>
            )}
          </div>
        )}
      </>)}
    </div>
  )
}
