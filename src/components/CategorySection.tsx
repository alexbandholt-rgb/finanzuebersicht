import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, CalendarClock, ChevronDown, ChevronUp } from 'lucide-react'
import type { LineItem } from '../types'
import { COMMON_COINS, fetchCryptoPrices } from '../lib/crypto'

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'


interface Props {
  title: string
  color: string
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  annualMode?: boolean
  showAnnualToggle?: boolean
  hideShare?: boolean
  showCrypto?: boolean
  sparRate?: number
  sparRateActive?: boolean
  onSparRateChange?: (rate: number | undefined, active: boolean) => void
  einkuenfte?: number
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), label: '', amount: null }
}

export default function CategorySection({ title, color, items, onChange, annualMode, showAnnualToggle, hideShare, showCrypto, sparRate, sparRateActive, onSparRateChange, einkuenfte }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [annualTooltip, setAnnualTooltip] = useState<{ id: string; x: number; y: number; isAnnual: boolean } | null>(null)
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({})
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showCrypto) return
    const coinIds = items.map(i => i.coinId).filter(Boolean) as string[]
    if (coinIds.length === 0) return
    fetchCryptoPrices(coinIds).then(prices => {
      setCryptoPrices(prices)
      // Auto-update amounts
      const updated = items.map(item => {
        if (!item.coinId || !item.coinQuantity || !prices[item.coinId]) return item
        return { ...item, amount: Math.round(prices[item.coinId] * item.coinQuantity * 100) / 100 }
      })
      onChange(updated)
    })
  }, [showCrypto, items.map(i => (i.coinId ?? '') + (i.coinQuantity ?? '')).join(',')])

  const toggleCrypto = (id: string) => {
    onChange(items.map(item =>
      item.id === id
        ? { ...item, coinId: item.coinId ? undefined : COMMON_COINS[0].id, coinQuantity: item.coinId ? undefined : undefined, amount: item.coinId ? item.amount : null }
        : item
    ))
  }

  const updateCoin = (id: string, coinId: string) => {
    onChange(items.map(item => item.id === id ? { ...item, coinId, label: COMMON_COINS.find(c => c.id === coinId)?.symbol ?? item.label } : item))
  }

  const updateCoinQuantity = (id: string, qty: number | null) => {
    const price = items.find(i => i.id === id)?.coinId ? cryptoPrices[items.find(i => i.id === id)!.coinId!] : null
    const amount = qty && price ? Math.round(price * qty * 100) / 100 : null
    onChange(items.map(item => item.id === id ? { ...item, coinQuantity: qty ?? undefined, amount } : item))
  }
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

  const monthlyTotal = items.filter(i => !i.isAnnual).reduce((acc, i) => acc + (i.amount ?? 0) * (i.share ?? 1), 0)
  const annualTotal = items.filter(i => i.isAnnual).reduce((acc, i) => acc + (i.amount ?? 0) * (i.share ?? 1), 0)
  const sparRateBetrag = sparRateActive && sparRate && einkuenfte ? (einkuenfte * sparRate) / 100 : 0
  const total = showAnnualToggle ? monthlyTotal : items.reduce((acc, i) => acc + (i.amount ?? 0) * (i.share ?? 1), 0) + sparRateBetrag

  return (
    <div
      ref={cardRef}
      className="rounded-2xl flex flex-col gap-4 bg-white shadow-sm"
      style={{ borderLeft: `4px solid ${color}`, maxWidth: '590px', padding: '24px', position: 'relative' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setCollapsed(c => !c)}>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          <h2 className="text-sm font-bold tracking-wide text-slate-700">{title}</h2>
          {collapsed && total > 0 && (
            <span className="text-xs font-mono text-slate-400">{fmt(total)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {annualMode && !collapsed && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              Jährlich ÷ 12
            </span>
          )}
          <span className="text-slate-300">
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </span>
        </div>
      </div>

      {annualTooltip && (
        <div style={{
          position: 'absolute', zIndex: 20,
          left: annualTooltip.x, top: annualTooltip.y,
          transform: 'translate(-50%, -100%)',
          background: '#1e293b', color: 'white',
          fontSize: '12px', borderRadius: '8px',
          padding: '6px 10px', whiteSpace: 'nowrap',
          pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {annualTooltip.isAnnual ? 'Jährlicher Betrag — wird ÷ 12 gerechnet. Klicken zum Deaktivieren.' : 'Als Jahresbetrag markieren — wird ÷ 12 pro Monat angerechnet.'}
        </div>
      )}

      {collapsed ? null : (<>

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
                {/* Label oder Coin-Dropdown */}
                {item.coinId ? (
                  <select
                    value={item.coinId}
                    onChange={e => updateCoin(item.id, e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none"
                    style={{ flex: 1 }}
                  >
                    {COMMON_COINS.map(c => (
                      <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => updateField(item.id, 'label', e.target.value)}
                    placeholder="Position"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-slate-400 transition-colors"
                    style={{ flex: 1 }}
                  />
                )}

                {/* Menge (Krypto) oder Betrag (normal) */}
                {item.coinId ? (
                  <div className="flex flex-col gap-0.5" style={{ width: '140px' }}>
                    <div className="flex items-center bg-slate-50 border border-indigo-200 rounded-xl overflow-hidden">
                      <input
                        type="number"
                        value={item.coinQuantity ?? ''}
                        onChange={e => updateCoinQuantity(item.id, e.target.value === '' ? null : parseFloat(e.target.value))}
                        placeholder="Menge"
                        step="any"
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none text-right min-w-0"
                      />
                      <span className="pr-2 text-indigo-400 text-xs select-none">{COMMON_COINS.find(c => c.id === item.coinId)?.symbol ?? ''}</span>
                    </div>
                    {item.amount !== null && (
                      <span className="text-xs font-mono text-indigo-500 text-right pr-1">≈ {fmt(item.amount)}</span>
                    )}
                    {item.coinId && cryptoPrices[item.coinId] && (
                      <span className="text-xs text-slate-400 text-right pr-1">{fmt(cryptoPrices[item.coinId])} / Stk.</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden" style={{ width: '120px' }}>
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
                )}

                {!hideShare && !item.coinId && (
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden" style={{ width: '52px' }}>
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
                )}

                {/* Krypto-Toggle */}
                {showCrypto && (
                  <button
                    onClick={() => toggleCrypto(item.id)}
                    title={item.coinId ? 'Krypto-Modus deaktivieren' : 'Als Krypto eintragen'}
                    style={{ padding: '6px', borderRadius: '8px', border: `1px solid ${item.coinId ? '#a5b4fc' : 'transparent'}`, background: item.coinId ? '#eef2ff' : 'transparent', color: item.coinId ? '#6366f1' : '#cbd5e1', fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    ₿
                  </button>
                )}

                <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                  {showAnnualToggle ? (
                    <button
                      onClick={() => toggleAnnual(item.id)}
                      onMouseEnter={e => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        const cardRect = cardRef.current?.getBoundingClientRect()
                        if (cardRect) setAnnualTooltip({ id: item.id, x: rect.left - cardRect.left + rect.width / 2, y: rect.top - cardRect.top - 8, isAnnual: !!item.isAnnual })
                      }}
                      onMouseLeave={() => setAnnualTooltip(null)}
                      className={`p-2 rounded-lg transition-all ${
                        item.isAnnual
                          ? 'text-orange-500 bg-orange-50 border border-orange-200'
                          : 'text-slate-300 hover:text-orange-400 hover:bg-orange-50 border border-transparent'
                      }`}
                    >
                      <CalendarClock size={14} />
                    </button>
                  ) : null}
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="p-2 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                  style={{ width: '30px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {showShare && item.amount !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1 }} />
                  <div style={{ width: '120px', display: 'flex', justifyContent: 'flex-end', paddingRight: '4px' }}>
                    <span className="text-xs text-slate-400">
                      = <span className="font-mono font-medium" style={{ color }}>{fmt(effective)}</span> dein Anteil
                    </span>
                  </div>
                  <div style={{ width: '52px' }} />
                  <div style={{ width: '30px' }} />
                  <div style={{ width: '30px' }} />
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
        <div className="flex flex-col gap-1 pt-3 mt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gesamt monatlich</span>
            <span className="text-sm font-mono font-bold" style={{ color }}>{fmt(total)}</span>
          </div>
          {showAnnualToggle && annualTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Jährlich (÷ 12 = {fmt(annualTotal / 12)}/Monat)</span>
              <span className="text-xs font-mono text-slate-400">{fmt(annualTotal)}</span>
            </div>
          )}
        </div>
      )}
      </>)}
    </div>
  )
}
