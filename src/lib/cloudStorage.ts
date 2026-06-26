import { supabase } from './supabase'
import type { MonthData } from '../types'
import type { Stammdaten } from './storage'

export async function cloudLoadMonth(year: number, month: number): Promise<MonthData | null> {
  const { data, error } = await supabase
    .from('month_data')
    .select('data')
    .eq('year', year)
    .eq('month', month)
    .single()
  if (error || !data) return null
  return data.data as MonthData
}

export async function cloudSaveMonth(monthData: MonthData): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('month_data')
    .upsert({
      user_id: user.id,
      year: monthData.year,
      month: monthData.month,
      data: monthData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,year,month' })
}

export async function cloudDeleteMonth(year: number, month: number): Promise<void> {
  await supabase
    .from('month_data')
    .delete()
    .eq('year', year)
    .eq('month', month)
}

export async function cloudGetAllMonths(): Promise<{ year: number; month: number }[]> {
  const { data, error } = await supabase
    .from('month_data')
    .select('year, month')
    .order('year', { ascending: true })
    .order('month', { ascending: true })
  if (error || !data) return []
  return data as { year: number; month: number }[]
}

export async function cloudLoadStammdaten(): Promise<Stammdaten | null> {
  const { data, error } = await supabase
    .from('stammdaten')
    .select('data')
    .single()
  if (error || !data) return null
  return data.data as Stammdaten
}

export async function cloudSaveStammdaten(stammdaten: Stammdaten): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('stammdaten')
    .upsert({
      user_id: user.id,
      data: stammdaten,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
}

export async function migrateLocalStorageToCloud(): Promise<void> {
  const allMonthsRaw = localStorage.getItem('finanz_all_months')
  const keys: string[] = allMonthsRaw ? JSON.parse(allMonthsRaw) : []

  for (const key of keys) {
    const raw = localStorage.getItem(`finanz_${key.replace('-', '_')}`)
    if (!raw) {
      const raw2 = localStorage.getItem(`finanz_${key}`)
      if (!raw2) continue
      const monthData: MonthData = JSON.parse(raw2)
      await cloudSaveMonth(monthData)
    } else {
      const monthData: MonthData = JSON.parse(raw)
      await cloudSaveMonth(monthData)
    }
  }

  const stammdatenRaw = localStorage.getItem('finanz_stammdaten')
  if (stammdatenRaw) {
    const stammdaten: Stammdaten = JSON.parse(stammdatenRaw)
    await cloudSaveStammdaten(stammdaten)
  }
}
