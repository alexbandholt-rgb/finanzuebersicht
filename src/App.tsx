import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, GitCompare, BarChart2, Save, Check, Settings2, Trash2, CalendarDays, LogOut } from 'lucide-react'
import type { MonthData } from './types'
import { MONTH_NAMES } from './types'
import { loadMonth, saveMonth, getAllMonths, loadStammdaten, saveStammdaten, deleteMonth } from './lib/storage'
import type { Stammdaten } from './lib/storage'
import { cloudLoadMonth, cloudSaveMonth, cloudDeleteMonth, cloudGetAllMonths, cloudLoadStammdaten, cloudSaveStammdaten, migrateLocalStorageToCloud } from './lib/cloudStorage'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import MonthView from './components/MonthView'
import CompareView from './components/CompareView'
import StammdatenView from './components/StammdatenView'
import JahresUebersicht from './components/JahresUebersicht'
import AuthScreen from './components/AuthScreen'

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

type Tab = 'monat' | 'stammdaten' | 'jahresuebersicht' | 'compare'

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [year, setYear] = useState(THIS_YEAR)
  const [month, setMonth] = useState(THIS_MONTH)
  const [data, setData] = useState<MonthData>(() => loadMonth(THIS_YEAR, THIS_MONTH))
  const [stammdaten, setStammdaten] = useState<Stammdaten>(() => loadStammdaten())
  const [tab, setTab] = useState<Tab>('monat')
  const [compareMonths, setCompareMonths] = useState<MonthData[]>([])
  const [allMonths, setAllMonths] = useState<{ year: number; month: number }[]>([])
  const [saved, setSaved] = useState(false)
  const [comparePickerOpen, setComparePickerOpen] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [futureLimit, setFutureLimit] = useState(0)
  const [pastLimit, setPastLimit] = useState(0)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [migrating, setMigrating] = useState(false)

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

  // Nach Login: Daten laden + ggf. migrieren
  useEffect(() => {
    if (!user) return
    const init = async () => {
      const localKeys = getAllMonths()
      if (localKeys.length > 0) {
        setMigrating(true)
        await migrateLocalStorageToCloud()
        setMigrating(false)
      }
      const [cloudMonths, cloudStamm, cloudMonth] = await Promise.all([
        cloudGetAllMonths(),
        cloudLoadStammdaten(),
        cloudLoadMonth(THIS_YEAR, THIS_MONTH),
      ])
      setAllMonths(cloudMonths)
      if (cloudStamm) setStammdaten(cloudStamm)
      if (cloudMonth) setData(cloudMonth)
      else setData(loadMonth(THIS_YEAR, THIS_MONTH))
    }
    init()
  }, [user])

  // Monat wechseln → aus Cloud laden
  useEffect(() => {
    if (!user) return
    cloudLoadMonth(year, month).then(d => {
      if (d) setData(d)
      else setData(loadMonth(year, month))
    })
  }, [year, month, user])

  const handleSave = useCallback(async () => {
    if (tab === 'stammdaten') {
      saveStammdaten(stammdaten)
      await cloudSaveStammdaten(stammdaten)
    } else {
      saveMonth(data)
      await cloudSaveMonth(data)
      const updated = await cloudGetAllMonths()
      setAllMonths(updated)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [tab, data, stammdaten])

  const handleCopyToStammdaten = (key: string, items: MonthData[keyof MonthData]) => {
    const updated = { ...stammdaten, [key]: items }
    setStammdaten(updated)
    saveStammdaten(updated)
  }

  const handleCopyMonthToStammdaten = () => {
    const updated: typeof stammdaten = {
      ...stammdaten,
      einkuenfte: data.einkuenfte,
      wohnungskosten: data.wohnungskosten,
      auto: data.auto,
      fixkosten: data.fixkosten,
      sparen: data.sparen,
      versicherungen: data.versicherungen,
      jaehrliche_kosten: data.jaehrliche_kosten,
      sparRate: data.sparRate,
    }
    setStammdaten(updated)
    saveStammdaten(updated)
  }

  const handleDelete = async () => {
    deleteMonth(year, month)
    await cloudDeleteMonth(year, month)
    const updated = await cloudGetAllMonths()
    setAllMonths(updated)
    setData(loadMonth(year, month))
    setDeleteConfirmOpen(false)
  }

  const prevMonth = () => {
    if (isAtMin) return
    const p = addMonths(year, month, -1)
    setYear(p.year); setMonth(p.month)
  }

  const nextMonth = () => {
    if (isAtMax) return
    const p = addMonths(year, month, 1)
    setYear(p.year); setMonth(p.month)
  }

  const toggleCompareMonth = (key: string) => {
    setSelectedForCompare(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const startCompare = () => {
    const months = selectedForCompare.map(key => {
      const [y, m] = key.split('-').map(Number)
      return loadMonth(y, m)
    })
    setCompareMonths(months)
    setComparePickerOpen(false)
    setTab('compare')
  }

  const navItems = [
    { id: 'monat' as Tab, label: 'Monatsübersicht', icon: <BarChart2 size={16} /> },
    { id: 'stammdaten' as Tab, label: 'Stammdaten', icon: <Settings2 size={16} /> },
    { id: 'jahresuebersicht' as Tab, label: 'Jahresübersicht', icon: <CalendarDays size={16} /> },
  ]

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Laden…</p>
      </div>
    )
  }

  if (user === null) return <AuthScreen />

  if (migrating) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: 600 }}>Daten werden in die Cloud übertragen…</p>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>Einen Moment bitte.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-800 flex" style={{ background: '#f0f2f7' }}>

      {/* Linke Seitenleiste */}
      <aside className="w-52 shrink-0 bg-white border-r border-slate-200 flex flex-col pt-6 shadow-sm" style={{ minHeight: '100vh' }}>
        <div className="flex items-center gap-2 px-5 mb-8">
          <BarChart2 size={18} className="text-emerald-500" />
          <span className="font-bold text-slate-800 text-sm">Finanzübersicht</span>
        </div>


        <nav className="flex flex-col gap-1 px-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                tab === item.id
                  ? 'bg-violet-50 text-violet-700 border border-violet-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={tab === item.id ? 'text-violet-500' : 'text-slate-400'}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="mt-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => tab === 'compare' ? setTab('monat') : setComparePickerOpen(true)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
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

      {/* Hauptbereich */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 shadow-sm">
          {tab === 'monat' && (
            <>
              {isAtMin && (
                <button onClick={() => setPastLimit(l => l + 1)} className="text-xs text-slate-500 hover:text-violet-600 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-violet-300 bg-white">
                  + Vergangener Monat
                </button>
              )}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button onClick={prevMonth} disabled={isAtMin} className="px-3 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-2 text-sm font-semibold text-slate-700 min-w-[140px] text-center">
                  {MONTH_NAMES[month - 1]} {year}
                </span>
                <button onClick={nextMonth} disabled={isAtMax} className="px-3 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
              {isAtMax && (
                <button onClick={() => setFutureLimit(l => l + 1)} className="text-xs text-slate-500 hover:text-violet-600 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-violet-300 bg-white">
                  + Zukünftiger Monat
                </button>
              )}
              <button onClick={() => setDeleteConfirmOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all">
                <Trash2 size={14} />
                Löschen
              </button>
            </>
          )}

          <div style={{ flex: 1 }} />
          {tab !== 'compare' && tab !== 'jahresuebersicht' && (
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                saved
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {saved ? <Check size={15} /> : <Save size={15} />}
              {saved ? 'Gespeichert' : 'Speichern'}
            </button>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ marginLeft: '1.5rem' }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all"
          >
            <LogOut size={14} />
            Abmelden
          </button>
        </header>

        {/* Content */}
        <main style={{ padding: '2rem 2.5rem' }}>
          {tab === 'monat' && <MonthView data={data} onChange={setData} onCopyToStammdaten={handleCopyToStammdaten} />}
          {tab === 'stammdaten' && <StammdatenView data={stammdaten} onChange={setStammdaten} />}
          {tab === 'jahresuebersicht' && <JahresUebersicht year={THIS_YEAR} />}
          {tab === 'compare' && <CompareView months={compareMonths} />}
        </main>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
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
