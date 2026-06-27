import type { MonthData, LineItem } from '../types'
import { DEFAULT_ITEMS } from '../types'

function makeDefaultItems(defs: { label: string }[]): LineItem[] {
  return defs.map((d, i) => ({ id: `${i}`, label: d.label, amount: null }))
}

function copyItems(items: LineItem[]): LineItem[] {
  return items.map(item => ({ ...item, id: crypto.randomUUID() }))
}

export type Stammdaten = Omit<MonthData, 'year' | 'month'>

export function defaultStammdaten(): Stammdaten {
  return {
    einkuenfte: makeDefaultItems(DEFAULT_ITEMS.einkuenfte),
    wohnungskosten: makeDefaultItems(DEFAULT_ITEMS.wohnungskosten),
    auto: makeDefaultItems(DEFAULT_ITEMS.auto),
    fixkosten: makeDefaultItems(DEFAULT_ITEMS.fixkosten),
    sparen: makeDefaultItems(DEFAULT_ITEMS.sparen),
    versicherungen: makeDefaultItems(DEFAULT_ITEMS.versicherungen),
    jaehrliche_kosten: makeDefaultItems(DEFAULT_ITEMS.jaehrliche_kosten),
    lebenshaltung: makeDefaultItems(DEFAULT_ITEMS.lebenshaltung),
    barvermoegen: makeDefaultItems(DEFAULT_ITEMS.barvermoegen),
  }
}

export function migrateMonthData(data: MonthData): MonthData {
  return {
    ...data,
    lebenshaltung: data.lebenshaltung ?? makeDefaultItems(DEFAULT_ITEMS.lebenshaltung),
    barvermoegen: data.barvermoegen ?? makeDefaultItems(DEFAULT_ITEMS.barvermoegen),
  }
}

export function createNewMonth(year: number, month: number, stammdaten: Stammdaten): MonthData {
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
    lebenshaltung: copyItems(stammdaten.lebenshaltung ?? []),
    barvermoegen: copyItems(stammdaten.barvermoegen ?? []),
    sparRate: stammdaten.sparRate ?? 10,
    sparRateActive: stammdaten.sparRateActive ?? false,
  }
}
