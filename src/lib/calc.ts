import type { MonthData, LineItem } from '../types'

export function sum(items: LineItem[]): number {
  return items.reduce((acc, i) => acc + (i.amount || 0) * (i.share ?? 1), 0)
}

export function annualPerMonth(items: LineItem[]): number {
  return sum(items) / 12
}

export function calcSummary(data: MonthData) {
  const einkuenfte = sum(data.einkuenfte)
  const wohnungskosten = sum(data.wohnungskosten)
  const auto = sum(data.auto)
  const fixkosten = sum(data.fixkosten)
  const sparRateBetrag = data.sparRate && data.sparRateActive !== false && einkuenfte > 0 ? (einkuenfte * data.sparRate) / 100 : 0
  const sparen = sum(data.sparen) + sparRateBetrag
  const versicherungen = sum(data.versicherungen.filter(i => !i.isAnnual))
  const jaehrlichProMonat = annualPerMonth(data.jaehrliche_kosten)
    + sum(data.versicherungen.filter(i => i.isAnnual)) / 12

  const gesamtAusgaben =
    wohnungskosten + auto + fixkosten + sparen + versicherungen + jaehrlichProMonat

  const verbleibend = einkuenfte - gesamtAusgaben

  return {
    einkuenfte,
    wohnungskosten,
    auto,
    fixkosten,
    sparen,
    versicherungen,
    jaehrlichProMonat,
    gesamtAusgaben,
    verbleibend,
  }
}
