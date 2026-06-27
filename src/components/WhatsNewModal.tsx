import { X, Sparkles } from 'lucide-react'

interface ChangelogEntry {
  date: string // ISO date string, e.g. '2026-06-27'
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-06-27',
    title: 'Sachwerte, Export & mehr',
    items: [
      'Sachwerte (Uhren, Autos etc.) können unter Vermögen eingetragen werden',
      'Eigene Daten als JSON exportieren — im Konto-Tab unter Einstellungen',
      'Schulden ohne Rate zeigen jetzt einen Hinweis, dass der Betrag nicht sinkt',
      'Neuigkeiten-Fenster: jederzeit im Konto-Tab wieder abrufbar',
      'Letzter Login wird im Konto-Tab angezeigt',
      'Schulden-Reiter: Restbetrag sinkt automatisch jeden Monat mit Tilgung & Zinsen',
    ],
  },
  {
    date: '2026-06-20',
    title: 'Sync & Navigation',
    items: [
      'Daten synchronisieren sich automatisch zwischen Geräten beim Tab-Wechsel',
      'Hamburger-Menü auf Mobile ersetzt die überfüllte Navigationsleiste',
      'Schulden werden in der Monatsübersicht vom Vermögen abgezogen',
    ],
  },
]

// Returns entries newer than the given ISO date string (or all if null)
export function getNewEntries(sinceDate: string | null): ChangelogEntry[] {
  if (!sinceDate) return CHANGELOG
  return CHANGELOG.filter(e => e.date > sinceDate)
}

export const LATEST_DATE = CHANGELOG[0]?.date ?? '2000-01-01'

interface Props {
  onClose: () => void
  entries: ChangelogEntry[]
}

export default function WhatsNewModal({ onClose, entries }: Props) {
  if (entries.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#8b5cf6" />
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Was ist neu?</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              width: '30px', height: '30px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Entries */}
        {entries.map(entry => (
          <div key={entry.date} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{entry.title}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {new Date(entry.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {entry.items.map((item, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            padding: '11px',
            borderRadius: '12px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            marginTop: '4px',
          }}
        >
          Verstanden
        </button>
      </div>
    </div>
  )
}
