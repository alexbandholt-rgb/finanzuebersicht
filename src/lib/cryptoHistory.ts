import { supabase } from './supabase'

export interface DailyPrice {
  coin_id: string
  price_eur: number
  date: string
}

export async function fetchDailyPrices(coinIds: string[], fromDate: string, toDate: string): Promise<DailyPrice[]> {
  const { data, error } = await supabase
    .from('crypto_daily_prices')
    .select('coin_id, price_eur, date')
    .in('coin_id', coinIds)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true })

  if (error) { console.error(error); return [] }
  return data ?? []
}

// Letzten verfügbaren Preis für einen Monat (letzter Tag ≤ Monatsende)
export async function fetchMonthEndPrice(coinId: string, year: number, month: number): Promise<number | null> {
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0] // letzter Tag des Monats
  const { data } = await supabase
    .from('crypto_daily_prices')
    .select('price_eur')
    .eq('coin_id', coinId)
    .lte('date', lastDay)
    .order('date', { ascending: false })
    .limit(1)
    .single()
  return data?.price_eur ?? null
}
