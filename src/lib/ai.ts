import Anthropic from '@anthropic-ai/sdk'
import type { MonthData, LineItem } from '../types'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

interface ExtractedData {
  einkuenfte: { label: string; amount: number }[]
  wohnungskosten: { label: string; amount: number }[]
  auto: { label: string; amount: number }[]
  fixkosten: { label: string; amount: number }[]
  sparen: { label: string; amount: number }[]
  versicherungen: { label: string; amount: number }[]
  jaehrliche_kosten: { label: string; amount: number }[]
}

const SYSTEM_PROMPT = `Du bist ein Finanzassistent. Analysiere das Bild einer Finanzübersicht und extrahiere alle Beträge.
Ordne jeden Posten einer dieser Kategorien zu:
- einkuenfte: Gehalt, Lohn, Einnahmen
- wohnungskosten: Miete, Strom, Gas, Wasser, Internet, GEZ, Nebenkosten
- auto: KFZ-Versicherung, Steuer, Sprit, Benzin, Tankkosten, Reparatur, Wartung
- fixkosten: Handy, Streaming, Abos, Mitgliedschaften, Kontoführung
- sparen: ETF, Aktien, Rohstoffe, Gold, Silber, Investitionen, Sparplan
- versicherungen: Haftpflicht, Hausrat, Krankenversicherung, Rechtsschutz, Berufsunfähigkeit
- jaehrliche_kosten: Jahreszahlungen, jährliche Beiträge

Antworte NUR mit validem JSON in diesem Format, ohne weitere Erklärungen:
{
  "einkuenfte": [{"label": "...", "amount": 0.00}],
  "wohnungskosten": [{"label": "...", "amount": 0.00}],
  "auto": [{"label": "...", "amount": 0.00}],
  "fixkosten": [{"label": "...", "amount": 0.00}],
  "sparen": [{"label": "...", "amount": 0.00}],
  "versicherungen": [{"label": "...", "amount": 0.00}],
  "jaehrliche_kosten": [{"label": "...", "amount": 0.00}]
}`

function toLineItems(items: { label: string; amount: number }[]): LineItem[] {
  return items.map(item => ({
    id: crypto.randomUUID(),
    label: item.label,
    amount: item.amount,
  }))
}

export async function bewerteFiananzen(summary: {
  einkuenfte: number
  wohnungskosten: number
  auto: number
  fixkosten: number
  sparen: number
  versicherungen: number
  jaehrlichProMonat: number
  gesamtAusgaben: number
  verbleibend: number
  sparRate?: number
}): Promise<string> {
  const sparquote = summary.einkuenfte > 0
    ? ((summary.sparen / summary.einkuenfte) * 100).toFixed(1)
    : '0'
  const wohnquote = summary.einkuenfte > 0
    ? ((summary.wohnungskosten / summary.einkuenfte) * 100).toFixed(1)
    : '0'

  const prompt = `Du bist ein freundlicher Finanzberater. Bewerte diese monatliche Finanzsituation kurz und präzise auf Deutsch.

Finanzdaten:
- Einkünfte: ${summary.einkuenfte.toFixed(2)} €
- Wohnungskosten: ${summary.wohnungskosten.toFixed(2)} € (${wohnquote}% des Einkommens)
- Auto: ${summary.auto.toFixed(2)} €
- Fixkosten: ${summary.fixkosten.toFixed(2)} €
- Sparen: ${summary.sparen.toFixed(2)} € (${sparquote}% Sparquote)
- Versicherungen: ${summary.versicherungen.toFixed(2)} €
- Jährl. Kosten/Monat: ${summary.jaehrlichProMonat.toFixed(2)} €
- Gesamt Ausgaben: ${summary.gesamtAusgaben.toFixed(2)} €
- Verbleibend: ${summary.verbleibend.toFixed(2)} €

Gib eine kurze Bewertung (2-3 Sätze) und dann 2-3 konkrete, praxisnahe Tipps als kurze Stichpunkte. Sei direkt und hilfreich, kein Marketing-Sprech.`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function analyzeFinanceImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
  currentData: MonthData
): Promise<MonthData> {
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: 'Bitte extrahiere alle Finanzposten aus diesem Bild und ordne sie den Kategorien zu.',
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Keine gültigen Daten im Bild gefunden')

  const extracted: ExtractedData = JSON.parse(jsonMatch[0])

  // Merge extracted data: add new items to existing ones
  return {
    ...currentData,
    einkuenfte: [
      ...currentData.einkuenfte,
      ...toLineItems(extracted.einkuenfte || []),
    ],
    wohnungskosten: [
      ...currentData.wohnungskosten,
      ...toLineItems(extracted.wohnungskosten || []),
    ],
    auto: [
      ...currentData.auto,
      ...toLineItems(extracted.auto || []),
    ],
    fixkosten: [
      ...currentData.fixkosten,
      ...toLineItems(extracted.fixkosten || []),
    ],
    sparen: [
      ...currentData.sparen,
      ...toLineItems(extracted.sparen || []),
    ],
    versicherungen: [
      ...currentData.versicherungen,
      ...toLineItems(extracted.versicherungen || []),
    ],
    jaehrliche_kosten: [
      ...currentData.jaehrliche_kosten,
      ...toLineItems(extracted.jaehrliche_kosten || []),
    ],
  }
}
