import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { MonthData } from '../types'
import { analyzeFinanceImage } from '../lib/ai'

interface Props {
  data: MonthData
  onResult: (data: MonthData) => void
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ImageUpload({ data, onResult, onClose }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Bitte nur Bilddateien hochladen (JPG, PNG, etc.)')
      setStatus('error')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      setStatus('loading')

      try {
        const base64 = dataUrl.split(',')[1]
        const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        const result = await analyzeFinanceImage(base64, mediaType, data)
        onResult(result)
        setStatus('success')
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Fehler beim Analysieren des Bildes')
        setStatus('error')
      }
    }
    reader.readAsDataURL(file)
  }, [data, onResult])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#1a1d27] border border-slate-700 rounded-2xl p-6 w-[480px] max-w-[90vw] flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-violet-400" />
            <h3 className="font-semibold text-slate-200">Übersicht hochladen</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Lade ein Foto oder Screenshot deiner Finanzübersicht hoch. Claude erkennt die Beträge automatisch und ordnet sie den richtigen Kategorien zu.
        </p>

        {status === 'idle' && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
              dragOver
                ? 'border-violet-500 bg-violet-950/20'
                : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="text-slate-500" />
            <div className="text-center">
              <p className="text-sm text-slate-300">Bild hier ablegen</p>
              <p className="text-xs text-slate-500 mt-1">oder klicken zum Auswählen</p>
            </div>
            <p className="text-xs text-slate-600">JPG, PNG, HEIC unterstützt</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-6">
            {preview && (
              <img src={preview} alt="Vorschau" className="max-h-32 rounded-lg opacity-50 object-contain" />
            )}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin text-violet-400" />
              Claude analysiert deine Übersicht...
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle size={36} className="text-emerald-400" />
            <p className="text-sm text-emerald-300 font-medium">Erfolgreich erkannt!</p>
            <p className="text-xs text-slate-500 text-center">
              Die Beträge wurden den Kategorien zugeordnet und zur aktuellen Ansicht hinzugefügt.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
            >
              Fertig
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <AlertCircle size={36} className="text-red-400" />
            <p className="text-sm text-red-300 font-medium">Fehler beim Analysieren</p>
            <p className="text-xs text-slate-500 text-center">{errorMsg}</p>
            <button
              onClick={() => { setStatus('idle'); setPreview(null); setErrorMsg('') }}
              className="mt-2 px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
