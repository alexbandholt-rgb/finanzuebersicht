import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, GitCompare, BarChart2, Check, Trash2, CalendarDays, LogOut, UserCircle, PiggyBank } from 'lucide-react'
import { useIsMobile } from './hooks/useIsMobile'
import type { MonthData } from './types'
import { MONTH_NAMES } from './types'
import { createNewMonth, defaultStammdaten, migrateMonthData } from './lib/storage'
import { cloudLoadMonth, cloudSaveMonth, cloudDeleteMonth, cloudGetAllMonths } from './lib/cloudStorage'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import MonthView from './components/MonthView'
import CompareView from './components/CompareView'
import JahresUebersicht from './components/JahresUebersicht'
import BarvermoegenView from './components/BarvermoegenView'
import AuthScreen from './components/AuthScreen'
import AccountView from './components/AccountView'
import NutzerView from './components/NutzerView'
import NameSetupScreen from './components/NameSetupScreen'
import NewPasswordScreen from './components/NewPasswordScreen'
import OnboardingWizard from './components/OnboardingWizard'

const ADMIN_EMAIL = 'alex.bandholt@web.de'

const now = new Date()
const THIS_YEAR = now.getFullYear()
const THIS_MONTH = now.getMonth() + 1

function addMonths(year: number, month: number, delta: number) {
  const total = (year * 12 + month - 1) + delta
  return { year: Math.floor(total / 12), month: (total % 12) + 1 }
}

function compareYM(y1: number, m1: number, y2: number, m2: number) {
  return y1 * 12 + m1 - (y2 * 12 + m2)
}

type Tab = 'monat' | 'jahresuebersicht' | 'barvermoegen' | 'compare' | 'konto' | 'nutzer'

export default function App() {
  const isMobile = useIsMobile()
  const [isPasswordReset] = useState(() => {
    const hash = window.location.hash
    return hash.includes('type=recovery')
  })
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [year, setYear] = useState(THIS_YEAR)
  const [month, setMonth] = useState(THIS_MONTH)
  const [data, setData] = useState<MonthData>(() => createNewMonth(THIS_YEAR, THIS_MONTH, defaultStammdaten()))
  const [tab, setTab] = useState<Tab>('monat')
  const [compareMonths, setCompareMonths] = useState<MonthData[]>([])
  const [allMonths, setAllMonths] = useState<{ year: number; month: number }[]>([])
  const [saved, setSaved] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [comparePickerOpen, setComparePickerOpen] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [futureLimit, setFutureLimit] = useState(0)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [pastLimit, setPastLimit] = useState(0)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const maxFuture = addMonths(THIS_YEAR, THIS_MONTH, futureLimit)
  const minPast = addMonths(THIS_YEAR, THIS_MONTH, -pastLimit)
  const isAtMax = compareYM(year, month, maxFuture.year, maxFuture.month) >= 0
  const isAtMin = compareYM(year, month, minPast.year, minPast.month) <= 0

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Nach Login: State zurücksetzen und Daten aus Cloud laden
  useEffect(() => {
    if (!user) return
    setYear(THIS_YEAR)
    setMonth(THIS_MONTH)
    setTab('monat')
    setFutureLimit(0)
    setPastLimit(0)
    setIsDirty(false)
    const init = async () => {
      const [cloudMonths, cloudMonth] = await Promise.all([
        cloudGetAllMonths(),
        cloudLoadMonth(THIS_YEAR, THIS_MONTH),
      ])
      setAllMonths(cloudMonths)
      if (cloudMonth) setData(migrateMonthData(cloudMonth))
      else {
        const prev = cloudMonths.filter(m => m.year * 12 + m.month < THIS_YEAR * 12 + THIS_MONTH).at(-1)
        const template = prev ? await cloudLoadMonth(prev.year, prev.month) : null
        setData(createNewMonth(THIS_YEAR, THIS_MONTH, template ?? defaultStammdaten()))
      }
      if (cloudMonths.length === 0 || localStorage.getItem('finanz_show_onboarding') === '1') {
        localStorage.removeItem('finanz_show_onboarding')
        setShowOnboarding(true)
      }
    }
    init()
  }, [user])

  // Monat wechseln → aus Cloud laden
  useEffect(() => {
    if (!user) return
    setIsDirty(false)
    const load = async () => {
      const d = await cloudLoadMonth(year, month)
      if (d) { setData(migrateMonthData(d)); return }
      const all = await cloudGetAllMonths()
      const prev = all.filter(m => m.year * 12 + m.month < year * 12 + month).at(-1)
      const template = prev ? await cloudLoadMonth(prev.year, prev.month) : null
      setData(createNewMonth(year, month, template ?? defaultStammdaten()))
    }
    load()
  }, [year, month, user])

  // Auto-save: 1 Sekunde nach letzter Nutzer-Änderung
  useEffect(() => {
    if (!user || !isDirty) return
    const timer = setTimeout(async () => {
      await cloudSaveMonth(data)
      const updated = await cloudGetAllMonths()
      setAllMonths(updated)
      setIsDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }, 1000)
    return () => clearTimeout(timer)
  }, [data, isDirty])

  const handleOnboardingComplete = async (budgets: Record<string, number>) => {
    const newMonth = { ...data, budgets }
    setData(newMonth)
    await cloudSaveMonth(newMonth)
    const updated = await cloudGetAllMonths()
    setAllMonths(updated)
    setShowOnboarding(false)
  }

  const handleDelete = async () => {
    await cloudDeleteMonth(year, month)
    const updated = await cloudGetAllMonths()
    setAllMonths(updated)
    setDeleteConfirmOpen(false)
    const last = updated[updated.length - 1]
    const targetYear = last ? last.year : THIS_YEAR
    const targetMonth = last ? last.month : THIS_MONTH
    setYear(targetYear)
    setMonth(targetMonth)
    const d = last ? await cloudLoadMonth(targetYear, targetMonth) : null
    setData(d ?? createNewMonth(targetYear, targetMonth, defaultStammdaten()))
  }

  const prevMonth = () => {
    if (isAtMin) return
    const p = addMonths(year, month, -1)
    setYear(p.year); setMonth(p.month)
  }

  const nextMonth = () => {
    if (isAtMax) return
    const p = addMonths(year, month, 1)
    setYear(p.year); setMonth(p.month); setTab('monat')
  }

  const toggleCompareMonth = (key: string) => {
    setSelectedForCompare(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const startCompare = async () => {
    const months = await Promise.all(selectedForCompare.map(async key => {
      const [y, m] = key.split('-').map(Number)
      return (await cloudLoadMonth(y, m)) ?? createNewMonth(y, m, defaultStammdaten())
    }))
    setCompareMonths(months)
    setComparePickerOpen(false)
    setTab('compare')
  }

  // allMonths beim Öffnen der Übersichten aktualisieren
  useEffect(() => {
    if ((tab === 'jahresuebersicht' || tab === 'barvermoegen') && user) {
      cloudGetAllMonths().then(setAllMonths)
    }
  }, [tab])

  const navItems = [
    { id: 'monat' as Tab, label: 'Monatsübersicht', icon: <BarChart2 size={16} /> },
    { id: 'jahresuebersicht' as Tab, label: 'Jahresübersicht', icon: <CalendarDays size={16} /> },
    { id: 'barvermoegen' as Tab, label: 'Vermögen', icon: <PiggyBank size={16} /> },
    { id: 'konto' as Tab, label: 'Konto', icon: <UserCircle size={16} /> },
  ]

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Laden…</p>
      </div>
    )
  }

  if (isPasswordReset && user) return <NewPasswordScreen />

  if (user === null) return <AuthScreen />

  if (user && !user.user_metadata?.name) {
    return <NameSetupScreen onDone={() => window.location.reload()} />
  }

return (
    <div className="min-h-screen text-slate-800 flex" style={{ background: '#f8fafc', flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Sidebar (Desktop) */}
      {!isMobile && (
      <aside style={{ width: '224px', flexShrink: 0, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', paddingTop: '2rem', boxShadow: '1px 0 4px rgba(0,0,0,0.04)', minHeight: '100vh' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '2.5rem', padding: '0 24px' }}>
          <BarChart2 size={18} className="text-emerald-500" />
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>Finanzübersicht</span>
        </div>

        <nav className="flex flex-col gap-1" style={{ padding: '0 12px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{ padding: '10px 14px' }}
              className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left ${
                tab === item.id
                  ? 'bg-violet-50 text-violet-700 border border-violet-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={tab === item.id ? 'text-violet-500' : 'text-slate-400'}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          {user.email === ADMIN_EMAIL && (
            <button
              onClick={() => setTab('nutzer')}
              style={{ padding: '10px 14px' }}
              className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all w-full text-left ${
                tab === 'nutzer'
                  ? 'bg-violet-50 text-violet-700 border border-violet-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={tab === 'nutzer' ? 'text-violet-500' : 'text-slate-400'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              Nutzer
            </button>
          )}

          <div className="mt-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => tab === 'compare' ? setTab('monat') : setComparePickerOpen(true)}
              style={{ padding: '10px 14px' }}
              className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all w-full text-left ${
                tab === 'compare'
                  ? 'bg-violet-50 text-violet-700 border border-violet-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={tab === 'compare' ? 'text-violet-500' : 'text-slate-400'}><GitCompare size={16} /></span>
              {tab === 'compare' ? 'Zurück' : 'Vergleichen'}
            </button>
          </div>
        </nav>
      </aside>
      )}

      {/* Hauptbereich */}
      <div className="flex-1 flex flex-col min-w-0" style={{ paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom))' : 0 }}>

        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 shadow-sm" style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1.5rem' }}>
          {/* Erste Zeile: Monatsnavigation + Speichern/Abmelden */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            {tab === 'monat' && (
              isMobile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '6px' }}>
                  <button onClick={() => setPastLimit(l => l + 1)} style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '12px', fontWeight: 600, lineHeight: 1, flexShrink: 0 }} title="Vergangenen Monat laden">
                    ←+
                  </button>
                  <button onClick={prevMonth} disabled={isAtMin} style={{ padding: '7px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: isAtMin ? '#cbd5e1' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setMonthPickerOpen(true)} style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '15px', color: '#334155', whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 4px' }}>
                    {MONTH_NAMES[month - 1]} {year}
                  </button>
                  {isAtMax ? (
                    <button onClick={async () => {
                      setFutureLimit(l => l + 1)
                      const p = addMonths(year, month, 1)
                      const newMonth = createNewMonth(p.year, p.month, data)
                      await cloudSaveMonth(newMonth)
                      const updated = await cloudGetAllMonths()
                      setAllMonths(updated)
                      setData(newMonth)
                      setYear(p.year); setMonth(p.month)
                    }} style={{ padding: '7px', borderRadius: '10px', border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button onClick={nextMonth} style={{ padding: '7px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* + Vergangener Monat */}
                  <button onClick={() => setPastLimit(l => l + 1)} title="Vergangenen Monat hinzufügen" style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    +
                  </button>
                  {/* Pfeil links */}
                  <button onClick={prevMonth} disabled={isAtMin} style={{ padding: '6px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: isAtMin ? '#cbd5e1' : '#64748b', display: 'flex', alignItems: 'center', cursor: isAtMin ? 'not-allowed' : 'pointer' }}>
                    <ChevronLeft size={16} />
                  </button>
                  {/* Monatsname klickbar */}
                  <button onClick={() => setMonthPickerOpen(true)} style={{ padding: '6px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, fontSize: '14px', color: '#334155', cursor: 'pointer', minWidth: '160px', textAlign: 'center' }}>
                    {MONTH_NAMES[month - 1]} {year}
                  </button>
                  {/* Pfeil rechts */}
                  <button onClick={nextMonth} disabled={isAtMax} style={{ padding: '6px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: isAtMax ? '#cbd5e1' : '#64748b', display: 'flex', alignItems: 'center', cursor: isAtMax ? 'not-allowed' : 'pointer' }}>
                    <ChevronRight size={16} />
                  </button>
                  {/* + Zukünftiger Monat */}
                  <button onClick={async () => {
                    setFutureLimit(l => l + 1)
                    const p = addMonths(year, month, 1)
                    const newMonth = createNewMonth(p.year, p.month, data)
                    await cloudSaveMonth(newMonth)
                    const updated = await cloudGetAllMonths()
                    setAllMonths(updated)
                    setData(newMonth)
                    setYear(p.year); setMonth(p.month)
                  }} title="Nächsten Monat hinzufügen" style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    +
                  </button>
                </div>
              )
            )}
            <div style={{ flex: 1 }} />
            {tab === 'monat' && saved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium px-2">
                <Check size={13} /> {!isMobile && 'Gespeichert'}
              </span>
            )}
            {tab === 'monat' && !isMobile && (
              <button onClick={() => setDeleteConfirmOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, background: '#fff1f2', color: '#ef4444', border: '1px solid #fecdd3', cursor: 'pointer' }}>
                <Trash2 size={13} />
                Löschen
              </button>
            )}
            {!isMobile && (
              <button onClick={() => supabase.auth.signOut()} style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: '#94a3b8', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>
                <LogOut size={14} />
                Abmelden
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: isMobile ? '1rem' : '2rem 2.5rem' }}>
          {tab === 'monat' && <MonthView data={data} onChange={d => { setData(d); setIsDirty(true) }} />}
          {tab === 'jahresuebersicht' && <JahresUebersicht year={THIS_YEAR} allMonths={allMonths} />}
          {tab === 'barvermoegen' && <BarvermoegenView allMonths={allMonths} />}
          {tab === 'compare' && <CompareView months={compareMonths} />}
          {tab === 'konto' && <AccountView email={user.email ?? ''} />}
          {tab === 'nutzer' && <NutzerView />}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
          {[...navItems, ...(user.email === ADMIN_EMAIL ? [{ id: 'nutzer' as Tab, label: 'Nutzer', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }] : [])].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', color: tab === item.id ? '#7c3aed' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: tab === item.id ? 600 : 400, paddingTop: '12px', paddingBottom: '8px' }}>
              <span style={{ color: tab === item.id ? '#7c3aed' : '#94a3b8' }}>{item.icon}</span>
              {item.label.replace('übersicht', '').replace('Monats', 'Monat')}
            </button>
          ))}
          <button onClick={() => supabase.auth.signOut()} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', paddingTop: '12px', paddingBottom: '8px' }}>
            <LogOut size={20} />
            Abmelden
          </button>
        </nav>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl flex flex-col gap-4" style={{ padding: '28px 24px', width: '320px', maxWidth: 'calc(100vw - 32px)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Monat löschen</h3>
                <p className="text-xs text-slate-400 mt-0.5">{MONTH_NAMES[month - 1]} {year}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">Alle gespeicherten Daten für diesen Monat werden unwiderruflich gelöscht. Bist du sicher?</p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">Abbrechen</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">Ja, löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding */}
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      {/* Month Picker Modal (Mobile) */}
      {monthPickerOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50" onClick={() => setMonthPickerOpen(false)}>
          <div className="bg-white rounded-b-2xl shadow-xl w-full max-h-[60vh] flex flex-col" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid #f1f5f9' }}>
              <p className="text-sm font-semibold text-slate-700">Monat auswählen</p>
            </div>
            <div className="overflow-y-auto flex flex-col">
              {[...allMonths].reverse().map(({ year: y, month: m }) => {
                const isActive = y === year && m === month
                return (
                  <button key={`${y}-${m}`} onClick={() => { setYear(y); setMonth(m); setMonthPickerOpen(false) }}
                    style={{ padding: '14px 20px', textAlign: 'left', background: isActive ? '#f5f3ff' : 'white', color: isActive ? '#7c3aed' : '#334155', fontWeight: isActive ? 700 : 400, fontSize: '15px', border: 'none', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}
                  >
                    {MONTH_NAMES[m - 1]} {y}
                    {isActive && <span style={{ float: 'right', fontSize: '12px' }}>✓</span>}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setMonthPickerOpen(false)} style={{ padding: '14px', color: '#94a3b8', fontSize: '14px', background: 'white', border: 'none', borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Compare Picker Modal */}
      {comparePickerOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setComparePickerOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 max-h-[70vh] flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800">Monate vergleichen</h3>
            <p className="text-xs text-slate-400">Wähle 2 oder mehr gespeicherte Monate</p>
            {allMonths.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Noch keine Monate gespeichert</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto">
                {allMonths.map(({ year: y, month: m }) => {
                  const key = `${y}-${m}`
                  const selected = selectedForCompare.includes(key)
                  return (
                    <button key={key} onClick={() => toggleCompareMonth(key)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm border transition-all ${
                        selected ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {MONTH_NAMES[m - 1]} {y}
                      {selected && <Check size={14} />}
                    </button>
                  )
                })}
              </div>
            )}
            <button onClick={startCompare} disabled={selectedForCompare.length < 2}
              className="mt-2 w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Vergleich starten ({selectedForCompare.length} Monate)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
