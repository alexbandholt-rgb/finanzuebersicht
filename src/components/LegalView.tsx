import { useState } from 'react'

type Section = 'impressum' | 'datenschutz' | 'agb'

const EMAIL = 'hallo@finanzuebersicht.de' // Platzhalter — ersetzen wenn Domain eingerichtet
const STEUERNUMMER = '[Steuernummer einfügen]' // Platzhalter

export default function LegalView() {
  const [section, setSection] = useState<Section>('impressum')

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {(['impressum', 'datenschutz', 'agb'] as Section[]).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              borderColor: section === s ? '#ddd6fe' : '#e2e8f0',
              background: section === s ? '#f5f3ff' : 'white',
              color: section === s ? '#7c3aed' : '#64748b',
            }}
          >
            {s === 'impressum' ? 'Impressum' : s === 'datenschutz' ? 'Datenschutz' : 'AGB'}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', lineHeight: 1.7, color: '#334155', fontSize: '14px' }}>
        {section === 'impressum' && <Impressum />}
        {section === 'datenschutz' && <Datenschutz />}
        {section === 'agb' && <AGB />}
      </div>
    </div>
  )
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', marginTop: 0 }}>{children}</h1>
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginTop: '28px', marginBottom: '8px' }}>{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 12px 0', color: '#475569' }}>{children}</p>
}

function Impressum() {
  return (
    <>
      <H1>Impressum</H1>
      <H2>Angaben gemäß § 5 TMG</H2>
      <P>
        Alexander Bandholt<br />
        Övelgönner Straße 5<br />
        20257 Hamburg<br />
        Deutschland
      </P>
      <H2>Kontakt</H2>
      <P>
        E-Mail: <a href={`mailto:${EMAIL}`} style={{ color: '#7c3aed' }}>{EMAIL}</a>
      </P>
      <H2>Steuerliche Angaben</H2>
      <P>
        Steuernummer: {STEUERNUMMER}<br />
        Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).
      </P>
      <H2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</H2>
      <P>
        Alexander Bandholt<br />
        Övelgönner Straße 5<br />
        20257 Hamburg
      </P>
      <H2>Haftungsausschluss</H2>
      <P>
        Die Inhalte dieser App wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr. Die App ersetzt keine steuerliche oder finanzielle Beratung.
      </P>
    </>
  )
}

function Datenschutz() {
  return (
    <>
      <H1>Datenschutzerklärung</H1>
      <P>Stand: Juni 2026</P>

      <H2>1. Verantwortlicher</H2>
      <P>
        Alexander Bandholt<br />
        Övelgönner Straße 5, 20257 Hamburg<br />
        E-Mail: <a href={`mailto:${EMAIL}`} style={{ color: '#7c3aed' }}>{EMAIL}</a>
      </P>

      <H2>2. Welche Daten wir erheben</H2>
      <P>
        Bei der Registrierung und Nutzung der App werden folgende Daten verarbeitet:
      </P>
      <ul style={{ paddingLeft: '20px', color: '#475569', marginBottom: '12px' }}>
        <li>E-Mail-Adresse (für Konto und Kommunikation)</li>
        <li>Anzeigename (freiwillig, von dir angegeben)</li>
        <li>Finanzdaten (Einnahmen, Ausgaben, Vermögenswerte) — ausschließlich von dir eingetragen</li>
        <li>Zeitpunkt der Erstellung und Änderung von Datensätzen</li>
      </ul>

      <H2>3. Zweck der Verarbeitung</H2>
      <P>
        Die Daten werden ausschließlich zum Betrieb der App und zur Bereitstellung der Finanzblick genutzt. Es findet keine Auswertung, kein Verkauf und keine Weitergabe an Dritte zu Werbezwecken statt.
      </P>

      <H2>4. Rechtsgrundlage</H2>
      <P>
        Die Verarbeitung erfolgt auf Basis deiner ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sowie zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
      </P>

      <H2>5. Auftragsverarbeiter</H2>
      <P>
        Wir setzen folgende Dienstleister ein, mit denen ein Auftragsverarbeitungsvertrag (AVV) besteht oder dessen Abschluss geplant ist:
      </P>
      <ul style={{ paddingLeft: '20px', color: '#475569', marginBottom: '12px' }}>
        <li><strong>Supabase Inc.</strong> (USA) — Datenbankhosting und Authentifizierung. Datenübertragung in die USA auf Basis von Standardvertragsklauseln (SCCs).</li>
        <li><strong>Vercel Inc.</strong> (USA) — Hosting der Webanwendung. Keine personenbezogenen Daten werden dauerhaft bei Vercel gespeichert.</li>
        <li><strong>CoinGecko</strong> — Abruf öffentlicher Kryptowährungskurse. Es werden keine personenbezogenen Daten übermittelt.</li>
      </ul>

      <H2>6. Speicherdauer</H2>
      <P>
        Deine Daten werden gespeichert, solange dein Konto besteht. Nach Löschung des Kontos werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht.
      </P>

      <H2>7. Deine Rechte</H2>
      <P>Du hast das Recht auf:</P>
      <ul style={{ paddingLeft: '20px', color: '#475569', marginBottom: '12px' }}>
        <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
        <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Widerruf deiner Einwilligung jederzeit mit Wirkung für die Zukunft</li>
      </ul>
      <P>
        Zur Ausübung deiner Rechte wende dich an: <a href={`mailto:${EMAIL}`} style={{ color: '#7c3aed' }}>{EMAIL}</a>
      </P>

      <H2>8. Beschwerderecht</H2>
      <P>
        Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig ist der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit (HmbBfDI).
      </P>

      <H2>9. Datensicherheit</H2>
      <P>
        Alle Verbindungen zur Datenbank sind TLS-verschlüsselt. Die Finanzdaten werden serverseitig gespeichert und sind für den Betreiber über das Datenbankpanel einsehbar — dies wird im Rahmen der Einwilligung transparent kommuniziert.
      </P>
    </>
  )
}

function AGB() {
  return (
    <>
      <H1>Allgemeine Geschäftsbedingungen (AGB)</H1>
      <P>Stand: Juni 2026</P>

      <H2>1. Geltungsbereich</H2>
      <P>
        Diese AGB gelten für die Nutzung der Web-App „Finanzblick", angeboten von Alexander Bandholt, Övelgönner Straße 5, 20257 Hamburg (nachfolgend „Anbieter").
      </P>

      <H2>2. Leistungsbeschreibung</H2>
      <P>
        Finanzblick ist eine persönliche Finanzplanungs-App, die es Nutzern ermöglicht, Einnahmen, Ausgaben und Vermögenswerte zu erfassen und auszuwerten. Die App wird als Software-as-a-Service (SaaS) über das Internet bereitgestellt.
      </P>

      <H2>3. Nutzungsmodell</H2>
      <P>
        Die App wird in einem Freemium-Modell angeboten. Der Basisumfang ist kostenlos nutzbar. Erweiterte Funktionen (Premium) sind kostenpflichtig und werden separat ausgewiesen. Die jeweils aktuellen Preise sind in der App einsehbar.
      </P>

      <H2>4. Registrierung und Konto</H2>
      <P>
        Für die Nutzung ist eine Registrierung mit E-Mail-Adresse erforderlich. Der Nutzer ist verpflichtet, seine Zugangsdaten sicher aufzubewahren. Je Person ist ein Konto zulässig. Die Weitergabe von Zugangsdaten an Dritte ist untersagt.
      </P>

      <H2>5. Pflichten des Nutzers</H2>
      <P>Der Nutzer verpflichtet sich:</P>
      <ul style={{ paddingLeft: '20px', color: '#475569', marginBottom: '12px' }}>
        <li>Keine rechtswidrigen Inhalte einzutragen</li>
        <li>Die App nicht zu missbrauchen oder technisch zu manipulieren</li>
        <li>Wahrheitsgemäße Angaben bei der Registrierung zu machen</li>
      </ul>

      <H2>6. Verfügbarkeit</H2>
      <P>
        Der Anbieter strebt eine hohe Verfügbarkeit an, übernimmt jedoch keine Garantie für eine unterbrechungsfreie Nutzung. Wartungsarbeiten werden nach Möglichkeit angekündigt.
      </P>

      <H2>7. Haftungsbeschränkung</H2>
      <P>
        Der Anbieter haftet nicht für Schäden, die durch die Nutzung der App entstehen, insbesondere nicht für finanzielle Entscheidungen, die auf Basis der App-Daten getroffen werden. Die App ersetzt keine professionelle Finanz- oder Steuerberatung.
      </P>

      <H2>8. Kündigung und Kontolöschung</H2>
      <P>
        Nutzer können ihr Konto jederzeit und kostenlos löschen. Premium-Abonnements können zum Ende des jeweiligen Abrechnungszeitraums gekündigt werden. Der Anbieter kann Konten bei Verstößen gegen diese AGB sperren oder löschen.
      </P>

      <H2>9. Änderungen der AGB</H2>
      <P>
        Der Anbieter behält sich vor, diese AGB anzupassen. Nutzer werden über wesentliche Änderungen per E-Mail oder In-App-Hinweis informiert. Die weitere Nutzung nach Inkrafttreten der Änderungen gilt als Zustimmung.
      </P>

      <H2>10. Anzuwendendes Recht und Gerichtsstand</H2>
      <P>
        Es gilt deutsches Recht. Gerichtsstand ist Hamburg, soweit gesetzlich zulässig.
      </P>

      <H2>11. Kontakt</H2>
      <P>
        Bei Fragen zu diesen AGB: <a href={`mailto:${EMAIL}`} style={{ color: '#7c3aed' }}>{EMAIL}</a>
      </P>
    </>
  )
}
