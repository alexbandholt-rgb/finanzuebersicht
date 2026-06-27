import type { LineItem } from '../types'
import type { Stammdaten } from '../lib/storage'
import { sum } from '../lib/calc'
import CategorySection from './CategorySection'

const COLORS = {
  einkuenfte: '#34d399',
  wohnungskosten: '#60a5fa',
  auto: '#f59e0b',
  fixkosten: '#a78bfa',
  sparen: '#fb7185',
  versicherungen: '#38bdf8',
  jaehrliche_kosten: '#f97316',
}

interface Props {
  data: Stammdaten
  onChange: (data: Stammdaten) => void
}

type Key = keyof Stammdaten

export default function StammdatenView({ data, onChange }: Props) {
  const update = (key: Key) => (items: LineItem[]) => onChange({ ...data, [key]: items })
  const einkuenfte = sum(data.einkuenfte)

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 px-8">
      <p className="text-sm text-slate-400 mb-2">
        Hier trägst du deine festen monatlichen Werte ein. Diese werden automatisch in jeden neuen Monat übernommen.
      </p>
      <CategorySection title="Einkünfte" color={COLORS.einkuenfte} items={data.einkuenfte} onChange={update('einkuenfte')} />
      <CategorySection title="Wohnungskosten" color={COLORS.wohnungskosten} items={data.wohnungskosten} onChange={update('wohnungskosten')} />
      <CategorySection title="Fahrzeuge" color={COLORS.auto} items={data.auto} onChange={update('auto')} />
      <CategorySection title="Fixkosten" color={COLORS.fixkosten} items={data.fixkosten} onChange={update('fixkosten')} />
      <CategorySection title="Sparen" color={COLORS.sparen} items={data.sparen} onChange={update('sparen')} sparRate={data.sparRate} sparRateActive={data.sparRateActive} onSparRateChange={(rate, active) => onChange({ ...data, sparRate: rate, sparRateActive: active })} einkuenfte={einkuenfte} />
      <CategorySection title="Versicherungen" color={COLORS.versicherungen} items={data.versicherungen} onChange={update('versicherungen')} showAnnualToggle />
      <CategorySection title="Jährliche Kosten" color={COLORS.jaehrliche_kosten} items={data.jaehrliche_kosten} onChange={update('jaehrliche_kosten')} annualMode />
    </div>
  )
}
