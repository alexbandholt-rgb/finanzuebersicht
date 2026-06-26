import { useState } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { bewerteFiananzen } from '../lib/ai'
import { calcSummary } from '../lib/calc'
import type { MonthData } from '../types'

interface Props {
  data: MonthData
}

export default function AIBewertung({ data }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyse = async () => {
    setLoading(true)
    setError('')
    setText('')
    try {
      const s = calcSummary(data)
      const result = await bewerteFiananzen({ ...s, sparRate: data.sparRate })
      setText(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei der KI-Analyse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-violet-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">KI-Bewertung</span>
        </div>
        {text && (
          <button
            onClick={analyse}
            disabled={loading}
            className="text-slate-400 hover:text-violet-500 transition-colors"
            title="Neu analysieren"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>

      {!text && !loading && !error && (
        <button
          onClick={analyse}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 text-sm font-medium border border-violet-200 transition-all"
        >
          <Sparkles size={14} />
          Finanzen analysieren
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
          <Loader2 size={14} className="animate-spin text-violet-400" />
          Claude analysiert deine Finanzen…
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {text && (
        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      )}
    </div>
  )
}
