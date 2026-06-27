import { supabase } from './supabase'
import type { MonthData } from '../types'
import type { Stammdaten } from './storage'

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function cloudLoadMonth(year: number, month: number): Promise<MonthData | null> {
  const uid = await getUserId()
  if (!uid) return null

  // ORDER BY updated_at DESC + LIMIT 1: funktioniert auch bei Duplikaten, nimmt immer den neuesten
  const { data, error } = await supabase
    .from('month_data')
    .select('data')
    .eq('user_id', uid)
    .eq('year', year)
    .eq('month', month)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (!error && data && data.length > 0) return (data[0] as any).data as MonthData

  // Fallback: lokale Kopie wenn Cloud nicht erreichbar
  try {
    const raw = localStorage.getItem(`finanz_local_${year}_${month}`)
    if (raw) {
      const backup = JSON.parse(raw) as { data: MonthData; savedAt: number }
      return backup.data
    }
  } catch {}
  return null
}

export async function cloudSaveMonth(monthData: MonthData): Promise<void> {
  const uid = await getUserId()
  if (!uid) return

  // Sofort lokal sichern (kein Netzwerkrisiko)
  try {
    localStorage.setItem(
      `finanz_local_${monthData.year}_${monthData.month}`,
      JSON.stringify({ data: monthData, savedAt: Date.now() })
    )
  } catch {}

  // Alle Zeilen für diesen Monat laden (kann Duplikate enthalten)
  const { data: rows } = await supabase
    .from('month_data')
    .select('id')
    .eq('user_id', uid)
    .eq('year', monthData.year)
    .eq('month', monthData.month)
    .order('updated_at', { ascending: false })

  const ids: string[] = (rows ?? []).map((r: any) => r.id)

  if (ids.length > 0) {
    // Neueste Zeile updaten
    const { error } = await supabase
      .from('month_data')
      .update({ data: monthData, updated_at: new Date().toISOString() })
      .eq('id', ids[0])
    if (error) console.error('cloudSaveMonth update error:', error)

    // Duplikate löschen
    if (ids.length > 1) {
      await supabase.from('month_data').delete().in('id', ids.slice(1))
    }
  } else {
    const { error } = await supabase
      .from('month_data')
      .insert({
        user_id: uid,
        year: monthData.year,
        month: monthData.month,
        data: monthData,
        updated_at: new Date().toISOString(),
      })
    if (error) console.error('cloudSaveMonth insert error:', error)
  }
}

export async function cloudDeleteMonth(year: number, month: number): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  await supabase
    .from('month_data')
    .delete()
    .eq('user_id', uid)
    .eq('year', year)
    .eq('month', month)
}

export async function cloudGetAllMonths(): Promise<{ year: number; month: number }[]> {
  const uid = await getUserId()
  if (!uid) return []
  const { data, error } = await supabase
    .from('month_data')
    .select('year, month')
    .eq('user_id', uid)
    .order('year', { ascending: true })
    .order('month', { ascending: true })
  if (error || !data) return []
  const seen = new Set<string>()
  return (data as { year: number; month: number }[]).filter(({ year, month }) => {
    const key = `${year}-${month}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function cloudLoadStammdaten(): Promise<Stammdaten | null> {
  const uid = await getUserId()
  if (!uid) return null
  const { data, error } = await supabase
    .from('stammdaten')
    .select('data')
    .eq('user_id', uid)
    .single()
  if (error || !data) return null
  return data.data as Stammdaten
}

export async function cloudSaveStammdaten(stammdaten: Stammdaten): Promise<void> {
  const uid = await getUserId()
  if (!uid) return
  await supabase
    .from('stammdaten')
    .upsert({
      user_id: uid,
      data: stammdaten,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
}

export async function migrateLocalStorageToCloud(): Promise<void> {
  const allMonthsRaw = localStorage.getItem('finanz_all_months')
  const keys: string[] = allMonthsRaw ? JSON.parse(allMonthsRaw) : []

  for (const key of keys) {
    const raw = localStorage.getItem(`finanz_${key.replace('-', '_')}`) ?? localStorage.getItem(`finanz_${key}`)
    if (!raw) continue
    const monthData: MonthData = JSON.parse(raw)
    await cloudSaveMonth(monthData)
  }

  const stammdatenRaw = localStorage.getItem('finanz_stammdaten')
  if (stammdatenRaw) {
    const stammdaten: Stammdaten = JSON.parse(stammdatenRaw)
    await cloudSaveStammdaten(stammdaten)
  }
}
