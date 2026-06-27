import { useState, useEffect } from 'react'
import type { MonthData } from '../types'
import { cloudLoadMonth } from '../lib/cloudStorage'
import KryptoChart from './KryptoChart'
import { COMMON_COINS } from '../lib/crypto'
import { MONTH_NAMES } from '../types'

interface Props {
  allMonths: { year: number; month: number }[]
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export default function KryptoView({ allMonths }: Props) {
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
    return <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Lade Kryptodaten…</div>
  }

  // Alle Monate mit Krypto-Positionen
  const sorted = [...monthData]
    .filter(d => (d.barvermoegen ?? []).some(i => i.coinId))
    .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month))

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
        <p className="text-sm">Noch keine Krypto-Positionen eingetragen.</p>
        <p className="text-xs">Aktiviere ₿ bei einer Position in der Vermögensübersicht.</p>
      </div>
    )
  }

  // Aktuelle Bestände aus dem letzten Monat
  const latest = sorted.at(-1)!
  const cryptoItems = (latest.barvermoegen ?? []).filter(i => i.coinId)

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '800px' }}>

      {/* Chart */}
      <KryptoChart monthData={monthData} />

      {/* Aktuelle Bestände */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div style={{ padding: '1.25rem 1.5rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
            Aktuelle Bestände — {MONTH_NAMES[latest.month - 1]} {latest.year}
          </h3>
        </div>
        <div className="flex flex-col">
          {cryptoItems.map(item => {
            const coin = COMMON_COINS.find(c => c.id === item.coinId)
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#6366f1' }}>
                    {coin?.symbol ?? '?'}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{coin?.name ?? item.coinId}</p>
                    {item.coinQuantity && (
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>{item.coinQuantity} {coin?.symbol}</p>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>
                    {item.amount !== null ? fmt(item.amount) : '—'}
                  </p>
                </div>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px', background: '#f5f3ff' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#4c1d95' }}>Gesamt</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#6366f1', fontFamily: 'monospace' }}>
              {fmt(cryptoItems.reduce((acc, i) => acc + (i.amount ?? 0), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Verlauf pro Monat */}
      {sorted.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div style={{ padding: '1.25rem 1.5rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Monatsverlauf</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '8px 24px', color: '#94a3b8', fontWeight: 500 }}>Coin</th>
                  {sorted.map(m => (
                    <th key={`${m.year}-${m.month}`} style={{ textAlign: 'right', padding: '8px 16px', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {MONTH_NAMES[m.month - 1].slice(0, 3)} {m.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(sorted.flatMap(m => (m.barvermoegen ?? []).filter(i => i.coinId).map(i => i.coinId!)))).map((coinId, idx) => {
                  const coin = COMMON_COINS.find(c => c.id === coinId)
                  return (
                    <tr key={coinId} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '8px 24px', fontWeight: 600, color: '#334155' }}>{coin?.symbol ?? coinId}</td>
                      {sorted.map(m => {
                        const item = (m.barvermoegen ?? []).find(i => i.coinId === coinId)
                        return (
                          <td key={`${m.year}-${m.month}`} style={{ textAlign: 'right', padding: '8px 16px', fontFamily: 'monospace', color: item ? '#6366f1' : '#cbd5e1' }}>
                            {item?.amount !== undefined && item.amount !== null ? fmt(item.amount) : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f5f3ff' }}>
                  <td style={{ padding: '10px 24px', fontWeight: 700, color: '#4c1d95' }}>Gesamt</td>
                  {sorted.map(m => {
                    const total = (m.barvermoegen ?? []).filter(i => i.coinId).reduce((acc, i) => acc + (i.amount ?? 0), 0)
                    return (
                      <td key={`${m.year}-${m.month}`} style={{ textAlign: 'right', padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>
                        {fmt(total)}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
