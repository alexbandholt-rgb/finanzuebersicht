import { useState } from 'react'
import { Shield, Check, BarChart2 } from 'lucide-react'

interface Props {
  onAccept: () => void
}

export default function PrivacyConsentScreen({ onAccept }: Props) {
  const [checked, setChecked] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', maxWidth: '480px', width: '100%', padding: '40px 36px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <BarChart2 size={18} style={{ color: '#10b981' }} />
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>Finanzübersicht</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', marginTop: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={20} style={{ color: '#16a34a' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Datenschutzhinweis</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, marginTop: '2px' }}>Bitte lies und bestätige vor der Nutzung</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          <Section title="Was gespeichert wird">
            Deine E-Mail-Adresse sowie die von dir eingetragenen Finanzdaten (Einnahmen, Ausgaben, Vermögen) werden in einer Datenbank gespeichert, um die App zu betreiben.
          </Section>

          <Section title="Wer Zugriff hat">
            Deine Daten liegen in einer Supabase-Datenbank. Der App-Betreiber hat technisch Lesezugriff auf diese Datenbank. Es gibt keine Weitergabe an Dritte. Die Daten werden ausschließlich für den Betrieb dieser App genutzt.
          </Section>

          <Section title="Deine Rechte">
            Du kannst dein Konto und alle gespeicherten Daten jederzeit löschen lassen. Wende dich dazu an den Betreiber oder lösche dein Konto direkt in den Kontoeinstellungen.
          </Section>

          <Section title="Datensicherheit">
            Die Verbindung zur Datenbank ist verschlüsselt (TLS). Die Daten selbst werden nicht clientseitig verschlüsselt — der Betreiber hat über das Datenbankpanel Zugriff auf Klartextdaten.
          </Section>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '24px' }}>
          <div
            onClick={() => setChecked(c => !c)}
            style={{
              width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
              border: checked ? '2px solid #7c3aed' : '2px solid #cbd5e1',
              background: checked ? '#7c3aed' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {checked && <Check size={13} color="white" strokeWidth={3} />}
          </div>
          <span style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
            Ich habe den Datenschutzhinweis gelesen und bin damit einverstanden, dass meine Daten wie beschrieben gespeichert und verarbeitet werden.
          </span>
        </label>

        <button
          onClick={() => { if (checked) onAccept() }}
          disabled={!checked}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: checked ? '#7c3aed' : '#e2e8f0',
            color: checked ? 'white' : '#94a3b8',
            fontSize: '15px', fontWeight: 600, cursor: checked ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          Zustimmen und fortfahren
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px 0' }}>{title}</p>
      <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.6 }}>{children}</p>
    </div>
  )
}
