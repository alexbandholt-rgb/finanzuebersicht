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
  const autoMonatlich = sum(data.auto.filter(i => !i.isAnnual))
  const autoJaehrlichProMonat = sum(data.auto.filter(i => i.isAnnual)) / 12
  const auto = autoMonatlich + autoJaehrlichProMonat
  const schuldenRaten = (data.schulden ?? [])
    .filter(s => s.inkludiereInFixkosten && (s.monatlicheRate ?? 0) > 0)
    .reduce((acc, s) => acc + (s.monatlicheRate ?? 0), 0)
  const fixkosten = sum(data.fixkosten) + schuldenRaten
  const sparRateBetrag = data.sparRate && data.sparRateActive === true && einkuenfte > 0 ? (einkuenfte * data.sparRate) / 100 : 0
  const sparen = sum(data.sparen) + sparRateBetrag
  const versicherungen = sum(data.versicherungen.filter(i => !i.isAnnual))
  // jaehrlichProMonat enthält auto annual/12 für Anzeige — wird aber nicht in gesamtAusgaben gezählt (auto enthält es bereits)
  const jaehrlichProMonat = annualPerMonth(data.jaehrliche_kosten)
    + sum(data.versicherungen.filter(i => i.isAnnual)) / 12
    + autoJaehrlichProMonat
  const lebenshaltung = sum(data.lebenshaltung ?? [])

  const gesamtAusgaben =
    wohnungskosten + auto + fixkosten + versicherungen + jaehrlichProMonat - autoJaehrlichProMonat + lebenshaltung

  const verbleibend = einkuenfte - gesamtAusgaben - sparen

  return {
    einkuenfte,
    wohnungskosten,
    auto,
    fixkosten,
    sparen,
    versicherungen,
    jaehrlichProMonat,
    lebenshaltung,
    gesamtAusgaben,
    verbleibend,
  }
}
