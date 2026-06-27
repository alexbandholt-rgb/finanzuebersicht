export interface LineItem {
  id: string
  label: string
  amount: number | null  // bei Schulden: aktueller Restbetrag
  share?: number
  isAnnual?: boolean
  coinId?: string
  coinQuantity?: number
  // Schulden-Felder
  gesamtbetrag?: number
  monatlicheRate?: number
  startDatum?: string
}

export interface Category {
  id: string
  name: string
  items: LineItem[]
}

export interface MonthData {
  id?: string
  user_id?: string
  year: number
  month: number
  einkuenfte: LineItem[]
  wohnungskosten: LineItem[]
  auto: LineItem[]
  fixkosten: LineItem[]
  sparen: LineItem[]
  versicherungen: LineItem[]
  jaehrliche_kosten: LineItem[]
  lebenshaltung: LineItem[]
  barvermoegen?: LineItem[]
  barvermoegenSichtbar?: boolean
  schulden?: LineItem[]
  sparRate?: number
  sparRateActive?: boolean
  notes?: string
  budgets?: Record<string, number>
  created_at?: string
  updated_at?: string
}

export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

export const DEFAULT_ITEMS = {
  einkuenfte: [
    { label: 'Gehalt' },
    { label: 'Sonstiges' },
  ],
  wohnungskosten: [
    { label: 'Miete' },
    { label: 'Strom' },
    { label: 'Internet' },
    { label: 'Gas' },
    { label: 'Wasser / Abwasser' },
    { label: 'GEZ' },
  ],
  auto: [
    { label: 'Versicherung' },
    { label: 'Steuer' },
    { label: 'Sprit' },
    { label: 'Wartung' },
  ],
  fixkosten: [
    { label: 'Handy / Telefon' },
    { label: 'Streaming' },
    { label: 'Musik' },
    { label: 'Mitgliedschaften' },
    { label: 'Kontoführung' },
  ],
  sparen: [
    { label: 'ETF' },
    { label: 'Rohstoffe' },
    { label: 'Aktien' },
  ],
  versicherungen: [
    { label: 'Haftpflicht' },
    { label: 'Hausrat' },
    { label: 'Kranken-Zusatz' },
    { label: 'Rechtsschutz' },
    { label: 'Berufsunfähigkeit' },
  ],
  jaehrliche_kosten: [] as { label: string }[],
  barvermoegen: [
    { label: 'Bargeld' },
    { label: 'Liquides Geld' },
    { label: 'ETF' },
    { label: 'Krypto' },
  ],
  lebenshaltung: [
    { label: 'Verpflegung' },
    { label: 'Tageskasse' },
  ],
}
