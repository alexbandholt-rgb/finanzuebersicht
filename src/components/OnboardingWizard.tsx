import { useState } from 'react'
import { BarChart2, ChevronRight, Check } from 'lucide-react'

const BUDGET_ITEMS = [
  { key: 'wohnungskosten', label: 'Wohnungskosten', color: '#3b82f6', default: 30, hint: 'Miete, Strom, Internet …' },
  { key: 'auto', label: 'Fahrzeuge', color: '#f59e0b', default: 10, hint: 'Sprit, Versicherung, Steuer …' },
  { key: 'fixkosten', label: 'Fixkosten', color: '#8b5cf6', default: 10, hint: 'Handy, Streaming, Mitgliedschaften …' },
  { key: 'lebenshaltung', label: 'Lebenshaltung', color: '#14b8a6', default: 15, hint: 'Verpflegung, Tageskasse …' },
  { key: 'versicherungen', label: 'Versicherungen', color: '#0ea5e9', default: 5, hint: 'Haftpflicht, Hausrat …' },
  { key: 'jaehrlichProMonat', label: 'Jährl. Kosten / Monat', color: '#f97316', default: 5, hint: 'Jahresbeträge anteilig' },
  { key: 'sparen', label: 'Sparen', color: '#ec4899', default: 20, hint: 'ETF, Aktien, Rücklage …' },
]

interface Props {
  onComplete: (budgets: Record<string, number>, name: string) => void
}

export default function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [budgets, setBudgets] = useState<Record<string, number>>(
    Object.fromEntries(BUDGET_ITEMS.map(i => [i.key, i.default]))
  )

  const total = Object.values(budgets).reduce((a, b) => a + b, 0)
  const remaining = 100 - total

  const update = (key: string, val: number) => {
    setBudgets(prev => ({ ...prev, [key]: Math.max(0, Math.min(100, val)) }))
  }

  if (step === 0) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50" style={{ padding: '24px' }}>
        <div className="bg-white rounded-3xl shadow-xl flex flex-col items-center gap-6 text-center" style={{ padding: '48px 40px', maxWidth: '440px', width: '100%' }}>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <BarChart2 size={28} className="text-emerald-500" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>Willkommen bei Finanzübersicht</h1>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              Hier behältst du deine Finanzen im Blick — Ausgaben, Sparziele und dein Vermögen, alles an einem Ort.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full text-left" style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px' }}>
            {[
              { icon: '📊', text: 'Monatliche Einnahmen & Ausgaben eintragen' },
              { icon: '🎯', text: 'Budgetziele setzen und im Blick behalten' },
              { icon: '📈', text: 'Jahresübersicht & Vermögensverlauf verfolgen' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{icon}</span>
                <span style={{ fontSize: '13px', color: '#475569' }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', textAlign: 'left' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Wie heißt du?</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dein Name"
              autoFocus
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={() => setStep(1)}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Loslegen <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50" style={{ padding: '24px' }}>
        <div className="bg-white rounded-3xl shadow-xl flex flex-col gap-5" style={{ padding: '36px 32px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="flex flex-col gap-1">
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Schritt 1 von 1</p>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>Budgetziele festlegen</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Wie viel Prozent deines Einkommens soll wohin fließen? Du kannst das jederzeit ändern.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {BUDGET_ITEMS.map(item => (
              <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      value={budgets[item.key]}
                      onChange={e => update(item.key, parseFloat(e.target.value) || 0)}
                      min={0} max={100} step={1}
                      style={{ width: '52px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 6px', fontSize: '13px', fontWeight: 700, color: item.color, outline: 'none' }}
                    />
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0} max={60} step={1}
                  value={budgets[item.key]}
                  onChange={e => update(item.key, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: item.color, height: '4px' }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.hint}</span>
              </div>
            ))}
          </div>

          {/* Summenanzeige */}
          <div style={{ borderRadius: '12px', padding: '12px 16px', background: remaining < 0 ? '#fff1f2' : remaining === 0 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${remaining < 0 ? '#fecdd3' : remaining === 0 ? '#bbf7d0' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: remaining < 0 ? '#ef4444' : remaining === 0 ? '#10b981' : '#64748b' }}>
              {remaining < 0 ? `${Math.abs(remaining)}% zu viel vergeben` : remaining === 0 ? '✓ Perfekt aufgeteilt' : `${remaining}% noch verfügbar`}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: remaining < 0 ? '#ef4444' : '#334155' }}>{total}%</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setStep(0)}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
            >
              Zurück
            </button>
            <button
              onClick={() => onComplete(budgets, name)}
              style={{ flex: 2, padding: '12px', borderRadius: '12px', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Check size={16} /> Fertig & loslegen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
