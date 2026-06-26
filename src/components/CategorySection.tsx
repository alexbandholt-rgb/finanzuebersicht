import { Plus, Trash2, CalendarClock } from 'lucide-react'
import type { LineItem } from '../types'

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'


interface Props {
  title: string
  color: string
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  annualMode?: boolean
  showAnnualToggle?: boolean
  sparRate?: number
  sparRateActive?: boolean
  onSparRateChange?: (rate: number | undefined, active: boolean) => void
  einkuenfte?: number
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), label: '', amount: null }
}

export default function CategorySection({ title, color, items, onChange, annualMode, showAnnualToggle, sparRate, sparRateActive, onSparRateChange, einkuenfte }: Props) {
  const updateField = (id: string, field: keyof LineItem, value: string) => {
    onChange(items.map(item => {
      if (item.id !== id) return item
      if (field === 'label') return { ...item, label: value }
      if (field === 'amount') return { ...item, amount: value === '' ? null : parseFloat(value) }
      if (field === 'share') return { ...item, share: value === '' ? undefined : parseFloat(value) }
      return item
    }))
  }

  const toggleAnnual = (id: string) => {
    onChange(items.map(item =>
      item.id === id ? { ...item, isAnnual: !item.isAnnual } : item
    ))
  }

  const remove = (id: string) => onChange(items.filter(i => i.id !== id))
  const add = () => onChange([...items, newItem()])

  const total = items.reduce((acc, i) => acc + (i.amount ?? 0) * (i.share ?? 1), 0)

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 bg-white shadow-sm"
      style={{ borderLeft: `4px solid ${color}`, maxWidth: '590px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          <h2 className="text-sm font-bold tracking-wide text-slate-700">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {annualMode && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              Jährlich ÷ 12
            </span>
          )}
        </div>
      </div>

      {/* Sparrate */}
      {onSparRateChange !== undefined && (
        <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={sparRateActive ?? false}
              onChange={e => onSparRateChange(sparRate, e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#8b5cf6', cursor: 'pointer', flexShrink: 0 }}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-slate-600">Sparrate vom Einkommen</span>
              {sparRateActive && sparRate !== undefined && einkuenfte !== undefined && einkuenfte > 0 && (
                <span className="text-xs text-slate-400 font-mono">
                  = {fmt((einkuenfte * sparRate) / 100)} / Monat
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" style={{ opacity: sparRateActive ? 1 : 0.4 }}>
            <input
              type="number"
              value={sparRate ?? ''}
              onChange={e => onSparRateChange(e.target.value === '' ? undefined : parseFloat(e.target.value), sparRateActive ?? false)}
              disabled={!sparRateActive}
              placeholder="0"
              min="0"
              max="100"
              step="1"
              className="w-16 bg-transparent px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:outline-none text-right"
            />
            <span className="pr-3 text-slate-400 text-xs select-none">%</span>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="flex flex-col gap-2">
        {items.map(item => {
          const effective = (item.amount ?? 0) * (item.share ?? 1)
          const showShare = item.share !== undefined

          return (
            <div key={item.id} className="flex flex-col gap-0.5">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={item.label}
                  onChange={e => updateField(item.id, 'label', e.target.value)}
                  placeholder="Position"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-slate-400 transition-colors"
                  style={{ flex: 1 }}
                />
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <input
                    type="number"
                    value={item.amount ?? ''}
                    onChange={e => updateField(item.id, 'amount', e.target.value)}
                    placeholder="0"
                    step="0.01"
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none text-right min-w-0"
                  />
                  <span className="pr-3 text-slate-400 text-xs select-none">€</span>
                </div>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <input
                    type="number"
                    value={item.share ?? ''}
                    onChange={e => updateField(item.id, 'share', e.target.value)}
                    placeholder="1"
                    step="0.1"
                    min="0"
                    max="1"
                    className="w-full bg-transparent px-2 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none text-right"
                  />
                </div>
                {showAnnualToggle ? (
                  <button
                    onClick={() => toggleAnnual(item.id)}
                    title={item.isAnnual ? 'Jährlich (klicken zum Deaktivieren)' : 'Als jährlich markieren'}
                    className={`p-2 rounded-lg transition-all ${
                      item.isAnnual
                        ? 'text-orange-500 bg-orange-50 border border-orange-200'
                        : 'text-slate-300 hover:text-orange-400 hover:bg-orange-50 border border-transparent'
                    }`}
                  >
                    <CalendarClock size={14} />
                  </button>
                ) : <div />}
                <button
                  onClick={() => remove(item.id)}
                  className="p-2 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {showShare && item.amount !== null && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '80px' }}>
                  <span className="text-xs text-slate-400">
                    = <span className="font-mono font-medium" style={{ color }}>{fmt(effective)}</span> dein Anteil
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mt-0.5 w-fit px-2 py-1 rounded-lg hover:bg-slate-50"
      >
        <Plus size={13} />
        Position hinzufügen
      </button>

      {items.length > 0 && (
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gesamt</span>
          <span className="text-sm font-mono font-bold" style={{ color }}>{fmt(total)}</span>
        </div>
      )}
    </div>
  )
}
