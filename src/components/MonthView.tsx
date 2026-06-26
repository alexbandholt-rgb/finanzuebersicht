import type { MonthData, LineItem } from '../types'
import { sum } from '../lib/calc'
import CategorySection from './CategorySection'
import Summary from './Summary'

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
  data: MonthData
  onChange: (data: MonthData) => void
  onCopyToStammdaten?: (key: string, items: MonthData[keyof MonthData]) => void
}

type CategoryKey = 'einkuenfte' | 'wohnungskosten' | 'auto' | 'fixkosten' | 'sparen' | 'versicherungen' | 'jaehrliche_kosten'

export default function MonthView({ data, onChange, onCopyToStammdaten }: Props) {
  const update = (key: CategoryKey) => (items: LineItem[]) => {
    onChange({ ...data, [key]: items })
  }

  const copy = (key: CategoryKey) =>
    onCopyToStammdaten ? () => onCopyToStammdaten(key, data[key]) : undefined

  const einkuenfte = sum(data.einkuenfte)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="flex flex-col gap-5" style={{ paddingLeft: '1rem' }}>
          <CategorySection
            title="Einkünfte"
            color={COLORS.einkuenfte}
            items={data.einkuenfte}
            onChange={update('einkuenfte')}
            onCopyToStammdaten={copy('einkuenfte')}
          />
          <CategorySection
            title="Wohnungskosten"
            color={COLORS.wohnungskosten}
            items={data.wohnungskosten}
            onChange={update('wohnungskosten')}
            onCopyToStammdaten={copy('wohnungskosten')}
          />
          <CategorySection
            title="Auto"
            color={COLORS.auto}
            items={data.auto}
            onChange={update('auto')}
            onCopyToStammdaten={copy('auto')}
          />
          <CategorySection
            title="Fixkosten"
            color={COLORS.fixkosten}
            items={data.fixkosten}
            onChange={update('fixkosten')}
            onCopyToStammdaten={copy('fixkosten')}
          />
          <CategorySection
            title="Sparen"
            color={COLORS.sparen}
            items={data.sparen}
            onChange={update('sparen')}
            sparRate={data.sparRate}
            sparRateActive={data.sparRateActive}
            onSparRateChange={(rate, active) => onChange({ ...data, sparRate: rate, sparRateActive: active })}
            einkuenfte={einkuenfte}
            onCopyToStammdaten={copy('sparen')}
          />
          <CategorySection
            title="Versicherungen"
            color={COLORS.versicherungen}
            items={data.versicherungen}
            onChange={update('versicherungen')}
            showAnnualToggle
            onCopyToStammdaten={copy('versicherungen')}
          />
          <CategorySection
            title="Jährliche Kosten"
            color={COLORS.jaehrliche_kosten}
            items={data.jaehrliche_kosten}
            onChange={update('jaehrliche_kosten')}
            annualMode
            onCopyToStammdaten={copy('jaehrliche_kosten')}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Summary data={data} />
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Notizen</p>
            <textarea
              value={data.notes ?? ''}
              onChange={e => onChange({ ...data, notes: e.target.value })}
              placeholder="Kurze Notiz zu diesem Monat…"
              rows={4}
              style={{
                width: '100%',
                resize: 'vertical',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '8px 10px',
                fontSize: '13px',
                color: '#475569',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.5',
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
