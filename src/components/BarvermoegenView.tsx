import { useState, useEffect } from 'react'
import { MONTH_NAMES } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'
import type { MonthData } from '../types'
import { cloudLoadMonth } from '../lib/cloudStorage'

interface Props {
  allMonths: { year: number; month: number }[]
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

const fmtDelta = (n: number) => {
  const s = fmt(Math.abs(n))
  return n >= 0 ? `+${s}` : `-${s}`
}

export default function BarvermoegenView({ allMonths }: Props) {
  const isMobile = useIsMobile()
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (allMonths.length === 0) { setMonthData([]); setLoading(false); return }
    Promise.all(allMonths.map(({ year, month }) => cloudLoadMonth(year, month)))
      .then(results => {
        setMonthData(results.filter((d): d is MonthData => d !== null))
        setLoading(false)
      })
  }, [allMonths])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Lade Vermögen…
      </div>
    )
  }

  const eintraege = monthData
    .filter(d => (d.barvermoegen ?? []).length > 0 || (d.sachwerte ?? []).length > 0)
    .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month))
    .map(d => ({
      label: `${MONTH_NAMES[d.month - 1]} ${d.year}`,
      items: (d.barvermoegen ?? []).filter(i => i.amount && i.amount > 0),
      sachItems: (d.sachwerte ?? []).filter(i => i.amount && i.amount > 0),
      barTotal: (d.barvermoegen ?? []).reduce((acc, i) => acc + (i.amount ?? 0), 0),
      sachTotal: (d.sachwerte ?? []).reduce((acc, i) => acc + (i.amount ?? 0), 0),
      total: (d.barvermoegen ?? []).reduce((acc, i) => acc + (i.amount ?? 0), 0)
            + (d.sachwerte ?? []).reduce((acc, i) => acc + (i.amount ?? 0), 0),
    }))

  if (eintraege.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p className="text-sm">Noch kein Vermögen eingetragen.</p>
        <p className="text-xs mt-1">Trage es in der Monatsübersicht unter "Vermögen" oder "Sachwerte" ein.</p>
      </div>
    )
  }

  // Sammle alle vorkommenden Labels für Kategorien
  const alleLabels = Array.from(new Set(eintraege.flatMap(e => e.items.map(i => i.label))))
  const alleSachLabels = Array.from(new Set(eintraege.flatMap(e => e.sachItems.map(i => i.label))))

  return (
    <div className="flex flex-col gap-6">

      {/* Übersichts-Kacheln */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: '0.75rem' }}>
        {eintraege.map((e, idx) => {
          const prev = eintraege[idx - 1]
          const delta = prev ? e.total - prev.total : null
          return (
            <div key={e.label} className="bg-white rounded-2xl border border-indigo-100 shadow-sm" style={{ padding: isMobile ? '10px 12px' : '1rem' }}>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">{e.label}</p>
              <p className="text-xl font-mono font-bold text-indigo-600">{fmt(e.total)}</p>
              {delta !== null && (
                <p className="text-xs font-mono mt-0.5" style={{ color: delta >= 0 ? '#10b981' : '#ef4444' }}>
                  {fmtDelta(delta)}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Detailtabelle pro Kategorie */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Aufschlüsselung</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px 16px', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>Kategorie</th>
                {eintraege.map(e => (
                  <th key={e.label} style={{ textAlign: 'right', padding: '8px 16px', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>{e.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alleLabels.map((label, rowIdx) => (
                <tr key={label} style={{ borderBottom: '1px solid #f8fafc', background: rowIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '8px 16px', color: '#475569' }}>{label}</td>
                  {eintraege.map(e => {
                    const item = e.items.find(i => i.label === label)
                    return (
                      <td key={e.label} style={{ textAlign: 'right', padding: '8px 16px', fontFamily: 'monospace', color: item ? '#6366f1' : '#cbd5e1' }}>
                        {item ? fmt(item.amount ?? 0) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {alleSachLabels.length > 0 && (
                <>
                  <tr style={{ background: '#ecfeff' }}>
                    <td colSpan={eintraege.length + 1} style={{ padding: '6px 16px', fontSize: '11px', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Sachwerte
                    </td>
                  </tr>
                  {alleSachLabels.map((label, rowIdx) => (
                    <tr key={'s-' + label} style={{ borderBottom: '1px solid #f8fafc', background: rowIdx % 2 === 0 ? 'white' : '#f0fdfe' }}>
                      <td style={{ padding: '8px 16px', color: '#475569' }}>{label}</td>
                      {eintraege.map(e => {
                        const item = e.sachItems.find(i => i.label === label)
                        return (
                          <td key={e.label} style={{ textAlign: 'right', padding: '8px 16px', fontFamily: 'monospace', color: item ? '#0891b2' : '#cbd5e1' }}>
                            {item ? fmt(item.amount ?? 0) : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </>
              )}
              <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f5f3ff' }}>
                <td style={{ padding: '10px 16px', fontWeight: 700, color: '#4c1d95' }}>Gesamt</td>
                {eintraege.map((e, idx) => {
                  const prev = eintraege[idx - 1]
                  const delta = prev ? e.total - prev.total : null
                  return (
                    <td key={e.label} style={{ textAlign: 'right', padding: '10px 16px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>{fmt(e.total)}</div>
                      {delta !== null && (
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: delta >= 0 ? '#10b981' : '#ef4444' }}>{fmtDelta(delta)}</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
