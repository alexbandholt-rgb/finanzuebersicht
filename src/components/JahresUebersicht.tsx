import { useState, useEffect, useRef } from 'react'
import { MONTH_NAMES } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'
import type { MonthData } from '../types'
import { calcSummary } from '../lib/calc'
import { cloudLoadMonth } from '../lib/cloudStorage'
import { FileText } from 'lucide-react'
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

function NoteChip({ name, notes }: { name: string; notes: string }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{name}</span>
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}
      >
        <FileText size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
      </div>
      {visible && (
        <div style={{
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
          marginTop: '6px', background: '#1e293b', color: '#f8fafc',
          borderRadius: '10px', padding: '8px 12px', fontSize: '12px', lineHeight: '1.5',
          whiteSpace: 'pre-wrap', maxWidth: '200px', zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
        }}>
          {notes}
        </div>
      )}
    </div>
  )
}

export default function JahresUebersicht({ year, allMonths }: Props) {
  const isMobile = useIsMobile()
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)

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
    }
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">
          Jahresvergleich {year}
        </h3>
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 320}>
          <BarChart data={monate} barCategoryGap="25%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
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

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-xs text-slate-400">Einkünfte</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /><span className="text-xs text-slate-400">Ausgaben</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-violet-500" /><span className="text-xs text-slate-400">Sparen (% = Sparquote)</span></div>
        </div>

        {monate.some(m => m.notes.trim()) && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            {monate.filter(m => m.notes.trim()).map((m, i) => (
              <NoteChip key={i} name={m.name} notes={m.notes} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
