import type { MonthData } from '../types'
import { MONTH_NAMES } from '../types'
import { calcSummary } from '../lib/calc'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Props {
  months: MonthData[]
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'


const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1d27] border border-slate-700 rounded-lg p-3 text-xs">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-slate-200 font-mono">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CompareView({ months }: Props) {
  if (months.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        Keine Monate zum Vergleichen ausgewählt
      </div>
    )
  }

  const summaries = months.map(m => ({
    name: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
    ...calcSummary(m),
  }))

  const tableCategories = [
    { key: 'einkuenfte', label: 'Einkünfte' },
    { key: 'wohnungskosten', label: 'Wohnung' },
    { key: 'auto', label: 'Fahrzeuge' },
    { key: 'fixkosten', label: 'Fixkosten' },
    { key: 'sparen', label: 'Sparen' },
    { key: 'versicherungen', label: 'Versicherungen' },
    { key: 'jaehrlichProMonat', label: 'Jährl./Monat' },
    { key: 'gesamtAusgaben', label: 'Gesamtausgaben' },
    { key: 'verbleibend', label: 'Verbleibend' },
  ]

  const chartData = summaries.map(s => ({
    name: s.name,
    Einkünfte: s.einkuenfte,
    Ausgaben: s.gesamtAusgaben,
    Verbleibend: Math.max(0, s.verbleibend),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#1a1d27] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-5">
          Übersicht
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Bar dataKey="Einkünfte" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Ausgaben" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Verbleibend" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#1a1d27] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-5 py-3 text-slate-500 font-medium">Kategorie</th>
              {summaries.map((s, i) => (
                <th key={i} className="text-right px-5 py-3 text-slate-300 font-medium">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableCategories.map(({ key, label }, rowIdx) => {
              const isSpecial = key === 'gesamtAusgaben' || key === 'verbleibend'
              return (
                <tr
                  key={key}
                  className={`border-b border-slate-800/50 ${
                    isSpecial ? 'bg-slate-800/20' : rowIdx % 2 === 0 ? '' : 'bg-slate-800/10'
                  }`}
                >
                  <td className={`px-5 py-3 ${isSpecial ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                    {label}
                  </td>
                  {summaries.map((s, i) => {
                    const val = (s as any)[key] as number
                    const isVerbleibend = key === 'verbleibend'
                    return (
                      <td
                        key={i}
                        className={`px-5 py-3 text-right font-mono ${
                          isVerbleibend
                            ? val >= 0 ? 'text-emerald-400' : 'text-red-400'
                            : isSpecial ? 'text-slate-200 font-medium' : 'text-slate-300'
                        }`}
                      >
                        {fmt(val)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
