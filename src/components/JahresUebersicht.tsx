import { useState, useEffect, useRef } from 'react'
import { MONTH_NAMES } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'
import type { MonthData } from '../types'
import { calcSummary } from '../lib/calc'
import { cloudLoadMonth } from '../lib/cloudStorage'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList
} from 'recharts'

interface Props {
  year: number
  allMonths: { year: number; month: number }[]
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs flex flex-col gap-1">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <div className="flex justify-between gap-6">
        <span className="text-slate-400">Einkünfte</span>
        <span className="font-mono text-emerald-600">{fmt(d.einkuenfte)}</span>
      </div>
      <div className="flex justify-between gap-6">
        <span className="text-slate-400">Ausgaben</span>
        <span className="font-mono text-blue-500">{fmt(d.ausgaben)}</span>
      </div>
      <div className="flex justify-between gap-6">
        <span className="text-slate-400">Verbleibend</span>
        <span className={`font-mono ${d.verbleibend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmt(d.verbleibend)}</span>
      </div>
      <div className="flex justify-between gap-6 pt-1 border-t border-slate-100">
        <span className="text-slate-400">Sparquote</span>
        <span className="font-mono font-semibold text-violet-500">{d.sparquote.toFixed(1)} %</span>
      </div>
    </div>
  )
}


const SparquoteLabel = ({ x, y, width, index, data }: any) => {
  const m = data?.[index]
  if (!m || !m.sparquote) return null
  return (
    <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={10} fill="#8b5cf6" fontWeight="600">
      {m.sparquote.toFixed(0)}%
    </text>
  )
}

const CustomXTick = ({ x, y, payload, data, onNoteEnter, onNoteLeave }: any) => {
  const m = data?.find((d: any) => d.name === payload.value)
  const note = m?.notes?.trim()
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={12} fill="#94a3b8">{payload.value}</text>
      {note && (
        <g
          transform="translate(-7, 18)"
          style={{ cursor: 'default' }}
          onMouseEnter={(e) => onNoteEnter?.(note, e)}
          onMouseLeave={() => onNoteLeave?.()}
        >
          <rect x={0} y={0} width={14} height={14} fill="transparent" />
          <rect x={0} y={0} width={10} height={13} rx={1.5} fill="#fef3c7" stroke="#fde68a" strokeWidth={0.8} />
          <path d="M7 0 L10 3 L7 3 Z" fill="#fde68a" />
          <line x1={2} y1={5.5} x2={8} y2={5.5} stroke="#f59e0b" strokeWidth={1} strokeLinecap="round" />
          <line x1={2} y1={8} x2={8} y2={8} stroke="#f59e0b" strokeWidth={1} strokeLinecap="round" />
          <line x1={2} y1={10.5} x2={6} y2={10.5} stroke="#f59e0b" strokeWidth={1} strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}

export default function JahresUebersicht({ year, allMonths }: Props) {
  const isMobile = useIsMobile()
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [noteTooltip, setNoteTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const gespeichert = allMonths.filter(m => m.year === year)
    if (gespeichert.length === 0) { setMonthData([]); setLoading(false); return }
    Promise.all(gespeichert.map(({ month }) => cloudLoadMonth(year, month))).then(results => {
      setMonthData(results.filter((d): d is MonthData => d !== null))
      setLoading(false)
    })
  }, [year, allMonths])

  const monate = monthData.map(data => {
    const s = calcSummary(data)
    const sparquote = s.einkuenfte > 0 ? (s.sparen / s.einkuenfte) * 100 : 0
    return {
      name: MONTH_NAMES[data.month - 1].slice(0, 3),
      fullName: MONTH_NAMES[data.month - 1],
      einkuenfte: s.einkuenfte,
      ausgaben: s.gesamtAusgaben,
      sparen: s.sparen,
      verbleibend: s.verbleibend,
      sparquote,
      notes: data.notes ?? '',
      budgets: data.budgets ?? {},
      wohnungskosten: s.wohnungskosten,
      auto: s.auto,
      fixkosten: s.fixkosten,
      versicherungen: s.versicherungen,
      jaehrlichProMonat: s.jaehrlichProMonat,
      lebenshaltung: s.lebenshaltung,
    }
  })

  const DEFAULT_BUDGETS: Record<string, number> = {
    wohnungskosten: 30, auto: 10, fixkosten: 10, sparen: 20,
    versicherungen: 5, lebenshaltung: 15,
  }

  const KATEGORIE_CONFIG = [
    { key: 'wohnungskosten', label: 'Wohnung', color: '#3b82f6' },
    { key: 'auto', label: 'Fahrzeuge', color: '#f59e0b' },
    { key: 'fixkosten', label: 'Fixkosten', color: '#8b5cf6' },
    { key: 'lebenshaltung', label: 'Lebenshaltung', color: '#14b8a6' },
    { key: 'sparen', label: 'Sparen', color: '#ec4899', invert: true },
    { key: 'versicherungen', label: 'Versicherungen', color: '#0ea5e9' },
  ]

  const budgetJahr = KATEGORIE_CONFIG.map(k => {
    const avgPct = monate.length > 0
      ? monate.reduce((acc, m) => {
          const val = (m as any)[k.key] ?? 0
          return acc + (m.einkuenfte > 0 ? (val / m.einkuenfte) * 100 : 0)
        }, 0) / monate.length
      : 0
    const budget = monate.length > 0
      ? ({ ...DEFAULT_BUDGETS, ...(monate[0].budgets ?? {}) })[k.key] ?? DEFAULT_BUDGETS[k.key]
      : DEFAULT_BUDGETS[k.key]
    const ratio = budget > 0 ? avgPct / budget : 0
    const color = k.invert
      ? ratio >= 1 ? '#10b981' : ratio >= 0.75 ? '#f59e0b' : '#ef4444'
      : ratio > 1.05 ? '#ef4444' : ratio > 1.02 ? '#f59e0b' : '#10b981'
    const barWidth = k.invert ? Math.min(100, ratio * 100) : Math.min(100, ratio * 100)
    return { ...k, avgPct, budget, color, barWidth }
  })

  const gesamtEinkuenfte = monate.reduce((a, m) => a + m.einkuenfte, 0)
  const gesamtAusgaben = monate.reduce((a, m) => a + m.ausgaben, 0)
  const gesamtSparen = monate.reduce((a, m) => a + m.sparen, 0)
  const durchschnittSparquote = monate.length > 0
    ? monate.reduce((a, m) => a + m.sparquote, 0) / monate.length
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Lade Jahresübersicht…
      </div>
    )
  }

  if (monate.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p className="text-sm">Noch keine Monate für {year} gespeichert.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Jahreszusammenfassung */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'Gesamteinkünfte', value: gesamtEinkuenfte, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Gesamtausgaben', value: gesamtAusgaben, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Gesamtsparbetrag', value: gesamtSparen, color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8' },
          { label: 'Ø Sparquote', value: null, sparquote: durchschnittSparquote, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: k.border, background: k.bg, padding: isMobile ? '10px 12px' : '1rem' }}>
            <p className="font-semibold uppercase tracking-wide mb-1" style={{ color: k.color, fontSize: isMobile ? '9px' : '11px' }}>{k.label}</p>
            <p className="font-mono font-bold text-slate-700" style={{ fontSize: isMobile ? '14px' : '20px' }}>
              {k.sparquote !== undefined ? `${k.sparquote.toFixed(1)} %` : fmt(k.value!)}
            </p>
          </div>
        ))}
      </div>

      {/* Balkendiagramm */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: isMobile ? '1rem' : '1.5rem', position: 'relative' }} ref={chartRef}>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">
          Jahresvergleich {year}
        </h3>
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 320}>
          <BarChart data={monate} barCategoryGap="25%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={(props: any) => <CustomXTick
                {...props}
                data={monate}
                onNoteEnter={(text: string, e: React.MouseEvent) => {
                  const rect = chartRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setNoteTooltip({ text, x: e.clientX - rect.left, y: e.clientY - rect.top })
                }}
                onNoteLeave={() => setNoteTooltip(null)}
              />}
              axisLine={false}
              tickLine={false}
              height={50}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}€`}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="einkuenfte" name="Einkünfte" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="ausgaben" name="Ausgaben" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="sparen" name="Sparen" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={28}>
              <LabelList content={(props: any) => <SparquoteLabel {...props} data={monate} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {noteTooltip && (
          <div style={{
            position: 'absolute',
            left: noteTooltip.x,
            top: noteTooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            maxWidth: '220px',
            zIndex: 50,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }}>
            {noteTooltip.text}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-xs text-slate-400">Einkünfte</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /><span className="text-xs text-slate-400">Ausgaben</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-violet-500" /><span className="text-xs text-slate-400">Sparen (% = Sparquote)</span></div>
        </div>
      </div>

      {/* Budgeteinhaltung */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-5">Budgeteinhaltung {year}</h3>
        <div className="flex flex-col gap-4">
          {budgetJahr.map(k => (
            <div key={k.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: k.color }} />
                  <span className="text-xs font-medium text-slate-600">{k.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: k.color }}>
                    Ø {k.avgPct.toFixed(1)} %
                  </span>
                  <span className="text-xs text-slate-300">/</span>
                  <span className="text-xs font-mono text-slate-400">Ziel {k.budget} %</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${k.barWidth}%`, background: k.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
