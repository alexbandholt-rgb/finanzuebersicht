import { useState, useEffect } from 'react'
import type { MonthData, LineItem } from '../types'
import { MONTH_NAMES } from '../types'
import { cloudLoadMonth } from '../lib/cloudStorage'

interface Props {
  allMonths: { year: number; month: number }[]
}

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

function restlaufzeit(restbetrag: number, monatlicheRate: number): string {
  if (!monatlicheRate || monatlicheRate <= 0) return '—'
  const monate = Math.ceil(restbetrag / monatlicheRate)
  const jahre = Math.floor(monate / 12)
  const rest = monate % 12
  if (jahre === 0) return `${rest} Monat${rest !== 1 ? 'e' : ''}`
  if (rest === 0) return `${jahre} Jahr${jahre !== 1 ? 'e' : ''}`
  return `${jahre} Jahr${jahre !== 1 ? 'e' : ''} ${rest} Monat${rest !== 1 ? 'e' : ''}`
}

function schuldenfreiBis(restbetrag: number, monatlicheRate: number): string {
  if (!monatlicheRate || monatlicheRate <= 0) return '—'
  const monate = Math.ceil(restbetrag / monatlicheRate)
  const datum = new Date()
  datum.setMonth(datum.getMonth() + monate)
  return `${MONTH_NAMES[datum.getMonth()]} ${datum.getFullYear()}`
}

export default function SchuldenView({ allMonths }: Props) {
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [rechnerRate, setRechnerRate] = useState('')
  const [rechnerRest, setRechnerRest] = useState('')

  useEffect(() => {
    if (allMonths.length === 0) { setMonthData([]); setLoading(false); return }
    Promise.all(allMonths.map(({ year, month }) => cloudLoadMonth(year, month)))
      .then(results => {
        setMonthData(results.filter((d): d is MonthData => d !== null))
        setLoading(false)
      })
  }, [allMonths])

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Lade Schulden…</div>

  const sorted = [...monthData].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month))
  const latest = sorted.at(-1)
  const schulden: LineItem[] = (latest?.schulden ?? []).filter(s => s.label || (s.amount ?? 0) > 0)

  const totalRest = schulden.reduce((acc, s) => acc + (s.amount ?? 0), 0)
  const totalGesamt = schulden.reduce((acc, s) => acc + (s.gesamtbetrag ?? 0), 0)
  const totalRate = schulden.reduce((acc, s) => acc + (s.monatlicheRate ?? 0), 0)

  // Verlauf: Restschuld pro Monat
  const verlauf = sorted
    .filter(m => (m.schulden ?? []).length > 0)
    .map(m => ({
      label: `${MONTH_NAMES[m.month - 1].slice(0, 3)} ${m.year}`,
      total: (m.schulden ?? []).reduce((acc, s) => acc + (s.amount ?? 0), 0),
    }))

  // Rechner
  const rRate = parseFloat(rechnerRate) || 0
  const rRest = parseFloat(rechnerRest) || 0

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '800px' }}>

      {schulden.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
          <p className="text-sm">Noch keine Schulden eingetragen.</p>
          <p className="text-xs">Füge sie in der Monatsübersicht unter „Schulden" ein.</p>
        </div>
      ) : (
        <>
          {/* Übersicht-Kacheln */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <Kachel label="Gesamtschuld" value={fmt(totalRest)} sub={totalGesamt ? `von ${fmt(totalGesamt)}` : undefined} color="#f43f5e" />
            <Kachel label="Monatl. Raten" value={fmt(totalRate)} color="#f97316" />
            <Kachel label="Restlaufzeit" value={totalRate ? restlaufzeit(totalRest, totalRate) : '—'} sub={totalRate ? `Schuldenfrei: ${schuldenfreiBis(totalRest, totalRate)}` : undefined} color="#8b5cf6" />
          </div>

          {/* Einzelne Schulden */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div style={{ padding: '1.25rem 1.5rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Tilgungsfortschritt</h3>
            </div>
            <div className="flex flex-col">
              {schulden.map(s => {
                const progress = s.gesamtbetrag && s.amount !== null
                  ? Math.max(0, Math.min(100, ((s.gesamtbetrag - s.amount) / s.gesamtbetrag) * 100))
                  : null
                const laufzeit = s.monatlicheRate && s.amount ? restlaufzeit(s.amount, s.monatlicheRate) : null
                const frei = s.monatlicheRate && s.amount ? schuldenfreiBis(s.amount, s.monatlicheRate) : null

                return (
                  <div key={s.id} style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{s.label || 'Unbenannt'}</p>
                        {s.monatlicheRate && (
                          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{fmt(s.monatlicheRate)} / Monat</p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#f43f5e', fontFamily: 'monospace' }}>{fmt(s.amount ?? 0)}</p>
                        {s.gesamtbetrag && (
                          <p style={{ fontSize: '11px', color: '#94a3b8' }}>von {fmt(s.gesamtbetrag)}</p>
                        )}
                      </div>
                    </div>

                    {progress !== null && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ height: '8px', background: '#fee2e2', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #f43f5e, #fb7185)', borderRadius: '99px', transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 600 }}>{progress.toFixed(1)}% getilgt</span>
                          {laufzeit && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Noch {laufzeit} — frei {frei}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Verlauf */}
          {verlauf.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div style={{ padding: '1.25rem 1.5rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Restschuld-Verlauf</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '20px 24px', overflowX: 'auto' }}>
                {verlauf.map((v, i) => {
                  const max = Math.max(...verlauf.map(x => x.total))
                  const h = max > 0 ? Math.max(8, (v.total / max) * 120) : 8
                  const prev = verlauf[i - 1]
                  const delta = prev ? v.total - prev.total : null
                  return (
                    <div key={v.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '60px' }}>
                      <span style={{ fontSize: '10px', color: delta !== null ? (delta < 0 ? '#10b981' : '#f43f5e') : '#94a3b8', fontWeight: 600 }}>
                        {delta !== null ? (delta < 0 ? `−${fmt(Math.abs(delta))}` : `+${fmt(delta)}`) : ''}
                      </span>
                      <div style={{ width: '36px', height: `${h}px`, background: 'linear-gradient(180deg, #f43f5e, #fda4af)', borderRadius: '6px 6px 2px 2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap' }}>{v.label}</span>
                      <span style={{ fontSize: '10px', color: '#334155', fontFamily: 'monospace', fontWeight: 600, textAlign: 'center' }}>{fmt(v.total)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Restlaufzeitrechner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: '24px' }}>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Restlaufzeitrechner</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '160px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Restbetrag</span>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <input type="number" value={rechnerRest} onChange={e => setRechnerRest(e.target.value)} placeholder="10000" className="no-spinner"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 10px', fontSize: '14px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }} />
              <span style={{ paddingRight: '10px', fontSize: '12px', color: '#94a3b8' }}>€</span>
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '160px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Monatliche Rate</span>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <input type="number" value={rechnerRate} onChange={e => setRechnerRate(e.target.value)} placeholder="200" className="no-spinner"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 10px', fontSize: '14px', color: '#334155', outline: 'none', textAlign: 'right', minWidth: 0 }} />
              <span style={{ paddingRight: '10px', fontSize: '12px', color: '#94a3b8' }}>€</span>
            </div>
          </label>
        </div>
        {rRest > 0 && rRate > 0 ? (
          <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Restlaufzeit</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#6d28d9' }}>{restlaufzeit(rRest, rRate)}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schuldenfrei ab</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#6d28d9' }}>{schuldenfreiBis(rRest, rRate)}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gesamtzahlung</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#6d28d9' }}>{fmt(Math.ceil(rRest / rRate) * rRate)}</p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Trage Restbetrag und monatliche Rate ein.</p>
        )}
      </div>
    </div>
  )
}

function Kachel({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: '16px 20px' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{sub}</p>}
    </div>
  )
}
