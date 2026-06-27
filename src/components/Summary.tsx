import { useState } from 'react'
import type { MonthData } from '../types'
import { calcSummary } from '../lib/calc'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Pencil, Check } from 'lucide-react'

interface Props {
  data: MonthData
  onChange?: (data: MonthData) => void
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

const DEFAULT_BUDGETS: Record<string, number> = {
  wohnungskosten: 30,
  auto: 10,
  fixkosten: 10,
  sparen: 20,
  versicherungen: 5,
  jaehrlichProMonat: 5,
  lebenshaltung: 15,
}

const BLOCKS = [
  { key: 'einkuenfte', label: 'Einkünfte', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', sectionId: 'section-einkuenfte' },
  { key: 'wohnungskosten', label: 'Wohnung', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', sectionId: 'section-wohnungskosten' },
  { key: 'auto', label: 'Fahrzeuge', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', sectionId: 'section-auto' },
  { key: 'fixkosten', label: 'Fixkosten', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', sectionId: 'section-fixkosten' },
  { key: 'sparen', label: 'Sparen & Investieren', color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', sectionId: 'section-sparen' },
  { key: 'versicherungen', label: 'Versicherungen', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', sectionId: 'section-versicherungen' },
  { key: 'jaehrlichProMonat', label: 'Jährl. / Monat', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', sectionId: '' },
  { key: 'lebenshaltung', label: 'Lebenshaltung', color: '#14b8a6', bg: '#f0fdfa', border: '#99f6e4', sectionId: 'section-lebenshaltung' },
]

function scrollToSection(sectionId: string, color: string) {
  const el = document.getElementById(sectionId)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top, behavior: 'smooth' })
  const card = el.firstElementChild as HTMLElement | null
  if (!card) return
  card.style.transition = 'box-shadow 0.3s ease'
  card.style.boxShadow = `0 0 0 3px ${color}88`
  setTimeout(() => {
    card.style.transition = 'box-shadow 0.6s ease'
    card.style.boxShadow = ''
  }, 1000)
}

const PIE_CATEGORIES = [
  { key: 'wohnungskosten', name: 'Wohnung', color: '#3b82f6' },
  { key: 'auto', name: 'Fahrzeuge', color: '#f59e0b' },
  { key: 'fixkosten', name: 'Fixkosten', color: '#8b5cf6' },
  { key: 'sparen', name: 'Sparen & Investieren', color: '#ec4899' },
  { key: 'versicherungen', name: 'Versicherungen', color: '#0ea5e9' },
  { key: 'jaehrlichProMonat', name: 'Jährl./Monat', color: '#f97316' },
  { key: 'lebenshaltung', name: 'Lebenshaltung', color: '#14b8a6' },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-slate-700 font-medium">{payload[0].name}</p>
      <p className="text-slate-500 font-mono mt-0.5">{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function Summary({ data, onChange }: Props) {
  const s = calcSummary(data)
  const isPositive = s.verbleibend >= 0
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [budgetInput, setBudgetInput] = useState('')

  const customBudgets = data.budgets ?? {}
  const budgets = { ...DEFAULT_BUDGETS, ...customBudgets }

  const saveBudget = (key: string) => {
    const val = parseFloat(budgetInput)
    const updated = { ...customBudgets }
    if (isNaN(val) || val <= 0) {
      delete updated[key]
    } else {
      updated[key] = val
    }
    onChange?.({ ...data, budgets: updated })
    setEditingBudget(null)
  }

  const budgetColor = (pct: number, budgetPct: number, invert = false) => {
    const ratio = pct / budgetPct
    if (invert) {
      if (ratio >= 1) return '#10b981'
      if (ratio >= 0.75) return '#f59e0b'
      return '#ef4444'
    }
    if (ratio > 1.05) return '#ef4444'
    if (ratio > 1.02) return '#f59e0b'
    return '#10b981'
  }

  const sparquote = s.einkuenfte > 0 ? (s.sparen / s.einkuenfte) * 100 : 0
  const sparquoteColor = sparquote >= 10 ? '#10b981' : sparquote >= 8 ? '#f59e0b' : '#ef4444'

  const pieData = [
    ...PIE_CATEGORIES.map(c => ({ name: c.name, value: (s as any)[c.key] as number, color: c.color })).filter(c => c.value > 0),
    ...(s.verbleibend > 0 ? [{ name: 'Verbleibend', value: s.verbleibend, color: '#e2e8f0' }] : []),
  ]

  return (
    <div className="flex flex-col gap-3">

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100" style={{ padding: '20px' }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Verteilung</p>
          <div className="flex items-center gap-3">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={34} outerRadius={58} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              {PIE_CATEGORIES.map(c => {
                const val = (s as any)[c.key] as number
                if (val <= 0) return null
                return (
                  <div key={c.key} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-slate-400 truncate">{c.name}</span>
                    </div>
                    <span className="font-mono text-slate-600 shrink-0">{fmt(val)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sparquote */}
      {s.einkuenfte > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-3" style={{ padding: '20px' }}>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sparquote</p>
            <p className="text-2xl font-mono font-bold mt-0.5" style={{ color: sparquoteColor }}>
              {sparquote.toFixed(1)} %
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Ziel: ab 10 %</p>
            <p className="text-xs mt-1 font-medium" style={{ color: sparquoteColor }}>
              {sparquote >= 10 ? '✓ Im Ziel' : sparquote >= 8 ? '~ Knapp drunter' : '↑ Unter Ziel'}
            </p>
          </div>
        </div>
      )}

      {/* Kacheln */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
        {BLOCKS.map(block => {
          const val = (s as any)[block.key] as number
          const pct = s.einkuenfte > 0 ? (val / s.einkuenfte) * 100 : 0
          const budget = budgets[block.key]
          const barColor = budget ? budgetColor(pct, budget, block.key === 'sparen') : block.color
          const barWidth = budget ? Math.min(100, (pct / budget) * 100) : Math.min(100, pct)
          const isEditing = editingBudget === block.key

          return (
            <div
              key={block.key}
              className="rounded-xl border flex flex-col gap-1.5 shadow-sm group"
              style={{ background: block.bg, borderColor: isEditing ? barColor : block.border, padding: '10px 12px', cursor: block.sectionId ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
              onClick={() => { if (!isEditing && block.sectionId) scrollToSection(block.sectionId, block.color) }}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: block.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: block.color }}>
                    {block.label}
                  </span>
                </div>
                {onChange && !isEditing && (
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => { e.stopPropagation(); setBudgetInput((budgets[block.key] ?? '').toString()); setEditingBudget(block.key) }}
                    title="Budget setzen"
                    style={{ padding: '1px', lineHeight: 1 }}
                  >
                    <Pencil size={10} style={{ color: block.color }} />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    type="number"
                    value={budgetInput}
                    onChange={e => setBudgetInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveBudget(block.key); if (e.key === 'Escape') setEditingBudget(null) }}
                    placeholder="z.B. 30"
                    min="0" max="100"
                    style={{ width: '100%', fontSize: '11px', border: `1px solid ${barColor}`, borderRadius: '4px', padding: '2px 4px', outline: 'none', background: 'white' }}
                  />
                  <span style={{ fontSize: '9px', color: block.color, flexShrink: 0 }}>%</span>
                  <button onClick={() => saveBudget(block.key)} style={{ flexShrink: 0 }}>
                    <Check size={11} style={{ color: barColor }} />
                  </button>
                </div>
              ) : (
                <div className="flex items-end justify-between gap-1">
                  <span className="text-[13px] font-mono font-bold text-slate-700">{fmt(val)}</span>
                  {budget && (
                    <span className="text-[10px] font-mono shrink-0" style={{ color: barColor }}>
                      {pct.toFixed(1)}/{budget}%
                    </span>
                  )}
                </div>
              )}

              <div className="h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, background: barColor, opacity: budget ? 1 : 0.7 }} />
              </div>
            </div>
          )
        })}

        <div style={{ gridColumn: '1 / -1', padding: '16px 20px' }} className="rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gesamtausgaben</span>
          <span className="text-sm font-mono font-semibold text-slate-700">{fmt(s.gesamtAusgaben)}</span>
        </div>
      </div>

      {/* Verbleibend */}
      <div className={`rounded-2xl border flex items-center justify-between shadow-sm ${
        isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
      }`} style={{ padding: '16px 20px' }}>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            Verbleibend
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            vor Sparen: {fmt(s.einkuenfte - s.gesamtAusgaben)}
          </p>
        </div>
        <span className={`text-xl font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {fmt(s.verbleibend)}
        </span>
      </div>

      {/* Barvermögen */}
      {((data.barvermoegen ?? []).length > 0 || (data.sachwerte ?? []).length > 0) && (() => {
        const sichtbar = data.barvermoegenSichtbar !== false
        const aktivSchulden = (data.schulden ?? []).filter(s => (s.amount ?? 0) > 0)
        const schuldenTotal = aktivSchulden.reduce((acc, s) => acc + (s.amount ?? 0), 0)
        const barvermoegenTotal = (data.barvermoegen ?? []).reduce((acc, i) => acc + (i.amount ?? 0), 0)
        const sachwerteTotal = (data.sachwerte ?? []).reduce((acc, i) => acc + (i.amount ?? 0), 0)
        const vermoegenTotal = barvermoegenTotal + sachwerteTotal
        const nettovermoegen = vermoegenTotal - schuldenTotal
        return (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between cursor-pointer" style={{ padding: '16px 20px' }}
              onClick={() => scrollToSection('section-barvermoegen', '#6366f1')}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sichtbar}
                  onChange={e => { e.stopPropagation(); onChange?.({ ...data, barvermoegenSichtbar: e.target.checked }) }}
                  onClick={e => e.stopPropagation()}
                  style={{ width: '14px', height: '14px', accentColor: '#6366f1', cursor: 'pointer', flexShrink: 0 }}
                />
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Vermögen</p>
              </div>
              {sichtbar && (
                <div style={{ textAlign: 'right' }}>
                  <span className="text-lg font-mono font-bold" style={{ color: nettovermoegen >= 0 ? '#4f46e5' : '#f43f5e' }}>{fmt(nettovermoegen)}</span>
                  {schuldenTotal > 0 && <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>Nettovermögen</p>}
                </div>
              )}
            </div>
            {sichtbar && (
              <div className="flex flex-col gap-0.5" style={{ padding: '0 20px 16px' }}>
                {(data.barvermoegen ?? []).filter(i => i.amount && i.amount > 0).map(i => (
                  <div key={i.id} className="flex items-center justify-between text-xs">
                    <span className="text-indigo-400">{i.label}</span>
                    <span className="font-mono text-indigo-500">{fmt(i.amount ?? 0)}</span>
                  </div>
                ))}
                {sachwerteTotal > 0 && (
                  <>
                    {barvermoegenTotal > 0 && <div style={{ height: '1px', background: '#c7d2fe', margin: '6px 0' }} />}
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: '#0891b2', fontWeight: 600 }}>Sachwerte</span>
                      <span className="font-mono" style={{ color: '#0891b2' }}>{fmt(sachwerteTotal)}</span>
                    </div>
                    {(data.sachwerte ?? []).filter(i => i.amount && i.amount > 0).map(i => (
                      <div key={i.id} className="flex items-center justify-between text-xs" style={{ paddingLeft: '8px' }}>
                        <span style={{ color: '#0891b2' }}>{i.label}</span>
                        <span className="font-mono" style={{ color: '#0891b2' }}>{fmt(i.amount ?? 0)}</span>
                      </div>
                    ))}
                  </>
                )}
                {schuldenTotal > 0 && (
                  <>
                    <div style={{ height: '1px', background: '#c7d2fe', margin: '6px 0' }} />
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: '#f43f5e', fontWeight: 600 }}>Schulden</span>
                      <span className="font-mono" style={{ color: '#f43f5e' }}>− {fmt(schuldenTotal)}</span>
                    </div>
                    {aktivSchulden.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-xs" style={{ paddingLeft: '8px' }}>
                        <span style={{ color: '#fca5a5' }}>{s.label || 'Unbenannt'}</span>
                        <span className="font-mono" style={{ color: '#fca5a5' }}>{fmt(s.amount ?? 0)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* Schulden (nur wenn kein Vermögen vorhanden, damit Schulden immer sichtbar sind) */}
      {(data.barvermoegen ?? []).length === 0 && (data.sachwerte ?? []).length === 0 && (() => {
        const aktivSchulden = (data.schulden ?? []).filter(s => (s.amount ?? 0) > 0)
        if (aktivSchulden.length === 0) return null
        const schuldenTotal = aktivSchulden.reduce((acc, s) => acc + (s.amount ?? 0), 0)
        return (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between" style={{ padding: '16px 20px' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#f43f5e' }}>Schulden</p>
              <span className="text-lg font-mono font-bold" style={{ color: '#f43f5e' }}>{fmt(schuldenTotal)}</span>
            </div>
            <div className="flex flex-col gap-0.5" style={{ padding: '0 20px 16px' }}>
              {aktivSchulden.map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span style={{ color: '#fca5a5' }}>{s.label || 'Unbenannt'}</span>
                  <span className="font-mono" style={{ color: '#f43f5e' }}>{fmt(s.amount ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
