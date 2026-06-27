import type { MonthData } from '../types'
import { calcSummary } from '../lib/calc'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: MonthData
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

const BLOCKS = [
  { key: 'einkuenfte', label: 'Einkünfte', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', sectionId: 'section-einkuenfte' },
  { key: 'wohnungskosten', label: 'Wohnung', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', sectionId: 'section-wohnungskosten' },
  { key: 'auto', label: 'Auto', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', sectionId: 'section-auto' },
  { key: 'fixkosten', label: 'Fixkosten', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', sectionId: 'section-fixkosten' },
  { key: 'sparen', label: 'Sparen', color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', sectionId: 'section-sparen' },
  { key: 'versicherungen', label: 'Versicherungen', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', sectionId: 'section-versicherungen' },
  { key: 'jaehrlichProMonat', label: 'Jährl. / Monat', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', sectionId: 'section-jaehrliche_kosten' },
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
  { key: 'auto', name: 'Auto', color: '#f59e0b' },
  { key: 'fixkosten', name: 'Fixkosten', color: '#8b5cf6' },
  { key: 'sparen', name: 'Sparen', color: '#ec4899' },
  { key: 'versicherungen', name: 'Versicherungen', color: '#0ea5e9' },
  { key: 'jaehrlichProMonat', name: 'Jährl./Monat', color: '#f97316' },
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

export default function Summary({ data }: Props) {
  const s = calcSummary(data)
  const isPositive = s.verbleibend >= 0

  const sparquote = s.einkuenfte > 0 ? (s.sparen / s.einkuenfte) * 100 : 0
  const sparquoteColor = sparquote >= 20 ? '#10b981' : sparquote >= 10 ? '#f59e0b' : '#ef4444'

  const pieData = [
    ...PIE_CATEGORIES.map(c => ({ name: c.name, value: (s as any)[c.key] as number, color: c.color })).filter(c => c.value > 0),
    ...(s.verbleibend > 0 ? [{ name: 'Verbleibend', value: s.verbleibend, color: '#e2e8f0' }] : []),
  ]

  return (
    <div className="flex flex-col gap-3">

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sparquote</p>
            <p className="text-2xl font-mono font-bold mt-0.5" style={{ color: sparquoteColor }}>
              {sparquote.toFixed(1)} %
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Ziel: 10–20 %</p>
            <p className="text-xs mt-1 font-medium" style={{ color: sparquoteColor }}>
              {sparquote >= 20 ? '✓ Sehr gut' : sparquote >= 10 ? '~ Im Ziel' : '↑ Unter Ziel'}
            </p>
          </div>
        </div>
      )}

      {/* Kacheln */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {BLOCKS.map(block => {
          const val = (s as any)[block.key] as number
          const pct = s.einkuenfte > 0 ? Math.min(100, (val / s.einkuenfte) * 100) : 0
          return (
            <div
              key={block.key}
              className="rounded-lg border flex flex-col gap-1 shadow-sm"
              style={{ background: block.bg, borderColor: block.border, padding: '6px 8px', cursor: 'pointer', transition: 'opacity 0.15s' }}
              onClick={() => scrollToSection(block.sectionId, block.color)}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              title={`Zu ${block.label} springen`}
            >
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: block.color }} />
                <span className="text-[9px] font-bold uppercase tracking-wide truncate" style={{ color: block.color }}>
                  {block.label}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-700">{fmt(val)}</span>
              <div className="h-1 bg-white rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: block.color, opacity: 0.7 }} />
              </div>
            </div>
          )
        })}

        <div style={{ gridColumn: '1 / -1' }} className="rounded-2xl p-3 bg-slate-50 border border-slate-200 flex items-center justify-between shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gesamtausgaben</span>
          <span className="text-sm font-mono font-semibold text-slate-700">{fmt(s.gesamtAusgaben)}</span>
        </div>
      </div>

      {/* Verbleibend */}
      <div className={`rounded-2xl p-4 border flex items-center justify-between shadow-sm ${
        isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
      }`}>
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
    </div>
  )
}
