import type { MonthData, LineItem } from '../types'
import { sum } from '../lib/calc'
import CategorySection from './CategorySection'
import Summary from './Summary'
import { useIsMobile } from '../hooks/useIsMobile'

const COLORS = {
  einkuenfte: '#34d399',
  wohnungskosten: '#60a5fa',
  auto: '#f59e0b',
  fixkosten: '#a78bfa',
  sparen: '#fb7185',
  versicherungen: '#38bdf8',
  jaehrliche_kosten: '#f97316',
  lebenshaltung: '#14b8a6',
}

interface Props {
  data: MonthData
  onChange: (data: MonthData) => void
}

type CategoryKey = 'einkuenfte' | 'wohnungskosten' | 'auto' | 'fixkosten' | 'sparen' | 'versicherungen' | 'jaehrliche_kosten' | 'lebenshaltung' | 'barvermoegen'

export default function MonthView({ data, onChange }: Props) {
  const isMobile = useIsMobile()
  const update = (key: CategoryKey) => (items: LineItem[]) => {
    onChange({ ...data, [key]: items })
  }

  const einkuenfte = sum(data.einkuenfte)

  const sidebar = (
    <div className="flex flex-col gap-4" style={isMobile ? {} : { position: 'sticky', top: '1.5rem', alignSelf: 'start', maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto' }}>
      <Summary data={data} onChange={onChange} />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notizen</p>
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
  )

  const categories = (
    <div className="flex flex-col gap-5">
      <div id="section-einkuenfte"><CategorySection title="Einkünfte" color={COLORS.einkuenfte} items={data.einkuenfte} onChange={update('einkuenfte')} /></div>
      <div id="section-wohnungskosten"><CategorySection title="Wohnungskosten" color={COLORS.wohnungskosten} items={data.wohnungskosten} onChange={update('wohnungskosten')} /></div>
      <div id="section-auto"><CategorySection title="Fahrzeuge" color={COLORS.auto} items={data.auto} onChange={update('auto')} showAnnualToggle /></div>
      <div id="section-fixkosten"><CategorySection title="Fixkosten" color={COLORS.fixkosten} items={data.fixkosten} onChange={update('fixkosten')} /></div>
      <div id="section-sparen"><CategorySection
        title="Sparen"
        color={COLORS.sparen}
        items={data.sparen}
        onChange={update('sparen')}
        sparRate={data.sparRate}
        sparRateActive={data.sparRateActive}
        onSparRateChange={(rate, active) => onChange({ ...data, sparRate: rate, sparRateActive: active })}
        einkuenfte={einkuenfte}
      /></div>
      <div id="section-versicherungen"><CategorySection title="Versicherungen" color={COLORS.versicherungen} items={data.versicherungen} onChange={update('versicherungen')} showAnnualToggle /></div>
      <div id="section-lebenshaltung"><CategorySection title="Lebenshaltung" color={COLORS.lebenshaltung} items={data.lebenshaltung ?? []} onChange={update('lebenshaltung')} /></div>

      <div className="flex items-center gap-3 mt-2">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Vermögen</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <div id="section-barvermoegen"><CategorySection title="Barvermögen" color="#6366f1" items={data.barvermoegen ?? []} onChange={update('barvermoegen')} /></div>
    </div>
  )

  if (isMobile) {
    return (
      <div className="flex flex-col gap-5">
        {sidebar}
        {categories}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
      <div style={{ paddingLeft: '1rem' }}>{categories}</div>
      {sidebar}
    </div>
  )
}
