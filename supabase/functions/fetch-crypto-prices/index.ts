import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const COINS = [
  'bitcoin', 'ethereum', 'ripple', 'solana', 'cardano',
  'binancecoin', 'dogecoin', 'polkadot', 'avalanche-2', 'matic-network',
]

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const today = new Date().toISOString().split('T')[0]

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(',')}&vs_currencies=eur`
    const res = await fetch(url)
    const json = await res.json()

    const rows = COINS
      .filter(id => json[id]?.eur)
      .map(coin_id => ({ coin_id, price_eur: json[coin_id].eur, date: today }))

    const { error } = await supabase
      .from('crypto_daily_prices')
      .upsert(rows, { onConflict: 'coin_id,date' })

    if (error) throw error

    return new Response(JSON.stringify({ ok: true, date: today, count: rows.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
