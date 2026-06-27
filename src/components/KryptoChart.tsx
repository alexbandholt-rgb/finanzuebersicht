import { useState, useEffect } from 'react'
import { fetchDailyPrices, type DailyPrice } from '../lib/cryptoHistory'
import { COMMON_COINS } from '../lib/crypto'
import type { MonthData } from '../types'
import { MONTH_NAMES } from '../types'

interface Props {
  monthData: MonthData[]
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#84cc16']

const fmtEur = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'

export default function KryptoChart({ monthData }: Props) {
  const [prices, setPrices] = useState<DailyPrice[]>([])
  const [activeCoin, setActiveCoin] = useState<string | null>(null)

  // Alle Coins aus allen Monaten sammeln
  const cryptoItems = monthData.flatMap(d =>
    (d.barvermoegen ?? []).filter(i => i.coinId && i.coinQuantity)
  )
  const coinIds = Array.from(new Set(cryptoItems.map(i => i.coinId!)))

  // Datumsbereich: erster Monat bis heute
  const sorted = [...monthData].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month))
  const firstMonth = sorted[0]
  const fromDate = firstMonth ? `${firstMonth.year}-${String(firstMonth.month).padStart(2, '0')}-01` : ''
  const toDate = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (coinIds.length === 0 || !fromDate) return
    fetchDailyPrices(coinIds, fromDate, toDate).then(setPrices)
  }, [coinIds.join(','), fromDate])

  if (coinIds.length === 0) return null

  // Kurven bauen: pro Coin eine Linie aus täglichen Preisen × Menge des jeweiligen Monats
  const coinLines = coinIds.map((coinId, idx) => {
    const coin = COMMON_COINS.find(c => c.id === coinId)
    const color = COLORS[idx % COLORS.length]

    const points = prices
      .filter(p => p.coin_id === coinId)
      .map(p => {
        const d = new Date(p.date)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        // Menge aus dem entsprechenden Monat
        const md = sorted.find(m => m.year === year && m.month === month)
          ?? sorted.filter(m => m.year * 12 + m.month <= year * 12 + month).at(-1)
        const item = (md?.barvermoegen ?? []).find(i => i.coinId === coinId)
        const quantity = item?.coinQuantity ?? 0
        return { date: p.date, value: p.price_eur * quantity }
      })
      .filter(p => p.value > 0)

    return { coinId, symbol: coin?.symbol ?? coinId, color, points }
  }).filter(l => l.points.length > 0)

  if (coinLines.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
          Noch keine Preishistorie vorhanden — Daten werden täglich um 08:00 Uhr gesammelt.
        </p>
      </div>
    )
  }

  // Chart-Dimensionen
  const W = 600
  const H = 200
  const PAD = { top: 16, right: 16, bottom: 16, left: 60 }
  const CW = W - PAD.left - PAD.right
  const CH = H - PAD.top - PAD.bottom

  const allPoints = coinLines.flatMap(l => l.points)
  const allDates = Array.from(new Set(allPoints.map(p => p.date))).sort()
  const allValues = allPoints.map(p => p.value)
  const minV = 0
  const maxV = Math.max(...allValues) * 1.1 || 1

  const xOf = (date: string) => {
    const i = allDates.indexOf(date)
    return PAD.left + (i / Math.max(allDates.length - 1, 1)) * CW
  }
  const yOf = (value: number) => PAD.top + CH - ((value - minV) / (maxV - minV)) * CH

  const toPath = (points: { date: string; value: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.date).toFixed(1)},${yOf(p.value).toFixed(1)}`).join(' ')

  // Y-Achse Labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    value: minV + t * (maxV - minV),
    y: PAD.top + CH - t * CH,
  }))

  // X-Achse: nur Monats-Labels
  const monthLabels = sorted.map(m => {
    const dateStr = `${m.year}-${String(m.month).padStart(2, '0')}-15`
    const closest = allDates.reduce((a, b) =>
      Math.abs(new Date(a).getTime() - new Date(dateStr).getTime()) <
      Math.abs(new Date(b).getTime() - new Date(dateStr).getTime()) ? a : b
    , allDates[0])
    return { label: `${MONTH_NAMES[m.month - 1].slice(0, 3)} ${m.year}`, x: xOf(closest) }
  })

  const displayLines = activeCoin ? coinLines.filter(l => l.coinId === activeCoin) : coinLines

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Krypto-Wertentwicklung</h3>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {coinLines.map(l => (
            <button
              key={l.coinId}
              onClick={() => setActiveCoin(activeCoin === l.coinId ? null : l.coinId)}
              style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                border: `1px solid ${l.color}`,
                background: activeCoin === null || activeCoin === l.coinId ? l.color : 'white',
                color: activeCoin === null || activeCoin === l.coinId ? 'white' : l.color,
                cursor: 'pointer',
              }}
            >
              {l.symbol}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid-Linien */}
        {yTicks.map(t => (
          <g key={t.value}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
              {fmtEur(t.value)}
            </text>
          </g>
        ))}


        {/* Linien */}
        {displayLines.map(l => (
          <g key={l.coinId}>
            {/* Fläche unter der Kurve */}
            {l.points.length > 1 && (
              <path
                d={`${toPath(l.points)} L${xOf(l.points.at(-1)!.date).toFixed(1)},${(PAD.top + CH).toFixed(1)} L${xOf(l.points[0].date).toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`}
                fill={l.color}
                fillOpacity="0.07"
              />
            )}
            {/* Kurve */}
            <path
              d={toPath(l.points)}
              fill="none"
              stroke={l.color}
              strokeWidth={activeCoin === l.coinId ? '2.5' : '1.8'}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Letzter Punkt */}
            {l.points.length > 0 && (() => {
              const last = l.points.at(-1)!
              return <circle cx={xOf(last.date)} cy={yOf(last.value)} r="3" fill={l.color} />
            })()}
          </g>
        ))}
      </svg>

      {/* X-Achse Labels als HTML — schärfer als SVG-Text */}
      <div style={{ position: 'relative', height: '20px', marginLeft: `${(PAD.left / W * 100).toFixed(2)}%`, marginRight: `${(PAD.right / W * 100).toFixed(2)}%` }}>
        {monthLabels.map((m, i) => {
          const pct = ((m.x - PAD.left) / (W - PAD.left - PAD.right) * 100)
          const clamped = Math.max(0, Math.min(100, pct))
          return (
            <span key={i} style={{
              position: 'absolute',
              left: `${clamped}%`,
              transform: 'translateX(-50%)',
              fontSize: '11px',
              fontWeight: 500,
              color: '#64748b',
              whiteSpace: 'nowrap',
              lineHeight: '20px',
            }}>{m.label}</span>
          )
        })}
      </div>
      </div>

      {/* Legende mit aktuellem Wert */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
        {coinLines.map(l => {
          const last = l.points.at(-1)
          return (
            <div key={l.coinId} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{l.symbol}</span>
              {last && <span style={{ fontSize: '12px', color: l.color, fontFamily: 'monospace' }}>{fmtEur(last.value)}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
