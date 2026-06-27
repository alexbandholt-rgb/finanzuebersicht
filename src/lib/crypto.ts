export const COMMON_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
]

let priceCache: Record<string, number> = {}
let lastFetch = 0

export async function fetchCryptoPrices(coinIds: string[]): Promise<Record<string, number>> {
  const now = Date.now()
  const ids = coinIds.filter(id => id)
  if (ids.length === 0) return {}

  // Cache for 5 minutes
  if (now - lastFetch < 5 * 60 * 1000 && ids.every(id => priceCache[id] !== undefined)) {
    return priceCache
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=eur`
    const res = await fetch(url)
    const json = await res.json()
    const prices: Record<string, number> = {}
    for (const id of ids) {
      if (json[id]?.eur) prices[id] = json[id].eur
    }
    priceCache = { ...priceCache, ...prices }
    lastFetch = now
    return priceCache
  } catch {
    return priceCache
  }
}
