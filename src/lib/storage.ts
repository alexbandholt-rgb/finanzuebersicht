import type { MonthData, LineItem } from '../types'
import { DEFAULT_ITEMS } from '../types'

const KEY = (year: number, month: number) => `finanz_${year}_${month}`
const ALL_MONTHS_KEY = 'finanz_all_months'
const STAMMDATEN_KEY = 'finanz_stammdaten'

function makeDefaultItems(defs: { label: string }[]): LineItem[] {
  return defs.map((d, i) => ({ id: `${i}`, label: d.label, amount: null }))
}

function copyItems(items: LineItem[]): LineItem[] {
  return items.map(item => ({ ...item, id: crypto.randomUUID() }))
}

export type Stammdaten = Omit<MonthData, 'year' | 'month'>

export function loadStammdaten(): Stammdaten {
  try {
    const raw = localStorage.getItem(STAMMDATEN_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    einkuenfte: makeDefaultItems(DEFAULT_ITEMS.einkuenfte),
    wohnungskosten: makeDefaultItems(DEFAULT_ITEMS.wohnungskosten),
    auto: makeDefaultItems(DEFAULT_ITEMS.auto),
    fixkosten: makeDefaultItems(DEFAULT_ITEMS.fixkosten),
    sparen: makeDefaultItems(DEFAULT_ITEMS.sparen),
    versicherungen: makeDefaultItems(DEFAULT_ITEMS.versicherungen),
    jaehrliche_kosten: makeDefaultItems(DEFAULT_ITEMS.jaehrliche_kosten),
  }
}

export function saveStammdaten(data: Stammdaten): void {
  localStorage.setItem(STAMMDATEN_KEY, JSON.stringify(data))
}

export function loadMonth(year: number, month: number): MonthData {
  try {
    const raw = localStorage.getItem(KEY(year, month))
    if (raw) return JSON.parse(raw)
  } catch {}

  // Neuer Monat → Stammdaten als Vorlage (mit Beträgen)
  const stammdaten = loadStammdaten()
  return {
    year,
    month,
    einkuenfte: copyItems(stammdaten.einkuenfte),
    wohnungskosten: copyItems(stammdaten.wohnungskosten),
    auto: copyItems(stammdaten.auto),
    fixkosten: copyItems(stammdaten.fixkosten),
    sparen: copyItems(stammdaten.sparen),
    versicherungen: copyItems(stammdaten.versicherungen),
    jaehrliche_kosten: copyItems(stammdaten.jaehrliche_kosten),
    sparRate: stammdaten.sparRate ?? 10,
    sparRateActive: stammdaten.sparRateActive ?? false,
  }
}

export function saveMonth(data: MonthData): void {
  localStorage.setItem(KEY(data.year, data.month), JSON.stringify(data))
  const all = getAllMonthKeys()
  const key = `${data.year}-${data.month}`
  if (!all.includes(key)) {
    all.push(key)
    localStorage.setItem(ALL_MONTHS_KEY, JSON.stringify(all))
  }
}

export function getAllMonthKeys(): string[] {
  try {
    const raw = localStorage.getItem(ALL_MONTHS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function deleteMonth(year: number, month: number): void {
  localStorage.removeItem(KEY(year, month))
  const all = getAllMonthKeys().filter(k => k !== `${year}-${month}`)
  localStorage.setItem(ALL_MONTHS_KEY, JSON.stringify(all))
}

export function getAllMonths(): { year: number; month: number }[] {
  return getAllMonthKeys()
    .map(k => {
      const [y, m] = k.split('-').map(Number)
      return { year: y, month: m }
    })
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
}
