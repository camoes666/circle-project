import { useState } from 'react'
import UrlInput from './components/UrlInput'
import FormatSelector from './components/FormatSelector'
import ResultViewer from './components/ResultViewer'
import ExportButtons from './components/ExportButtons'
import SettingsModal from './components/SettingsModal'
import TranscriptPaste from './components/TranscriptPaste'
import { useSettings } from './hooks/useSettings'
import { extractVideoId, fetchTranscript } from './services/transcript'
import { buildPrompt } from './services/prompts'
import { generateDocument } from './services/ai'

export default function App() {
  const { settings, updateSettings } = useSettings()
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('summary')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualTranscript, setManualTranscript] = useState('')

  const handleConvert = async () => {
    setError('')
    setResult('')

    // If manual transcript is provided, skip auto-fetch
    if (showManualInput && manualTranscript.trim()) {
      setLoading(true)
      try {
        const prompt = buildPrompt(format, settings.language)
        const doc = await generateDocument(manualTranscript.trim(), prompt, settings)
        setResult(doc)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
      return
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      setError('유효한 YouTube URL을 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const transcript = await fetchTranscript(videoId, settings)
      const prompt = buildPrompt(format, settings.language)
      const doc = await generateDocument(transcript, prompt, settings)
      setResult(doc)
    } catch (e) {
      setError(e.message)
      // Auto-show manual input on transcript fetch failure
      if (
        e.message.includes('자막') ||
        e.message.includes('fetch') ||
        e.message.includes('API') ||
        e.message.includes('Failed')
      ) {
        setShowManualInput(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const canConvert =
    !loading &&
    (showManualInput ? manualTranscript.trim().length > 0 : url.trim().length > 0)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-tight">SubToDoc</h1>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="설정"
          className="text-gray-400 hover:text-gray-100 transition-colors text-xl"
        >
          ⚙️
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* URL input — hide when manual mode is active and has content */}
        {!showManualInput && (
          <UrlInput value={url} onChange={setUrl} />
        )}

        {showManualInput && (
          <div className="space-y-3">
            <UrlInput value={url} onChange={setUrl} />
            <TranscriptPaste value={manualTranscript} onChange={setManualTranscript} />
          </div>
        )}

        {/* Toggle manual input */}
        <button
          type="button"
          onClick={() => {
            setShowManualInput(v => !v)
            setError('')
          }}
          className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
        >
          {showManualInput
            ? '자동으로 자막 가져오기'
            : '자막을 직접 붙여넣고 싶으신가요?'}
        </button>

        <FormatSelector selected={format} onChange={setFormat} />

        {error && (
          <div className="text-red-400 text-sm space-y-1">
            <p>{error}</p>
            {!showManualInput && (
              <p className="text-gray-500">
                자막 자동 가져오기에 실패했습니다.{' '}
                <button
                  type="button"
                  onClick={() => { setShowManualInput(true); setError('') }}
                  className="underline hover:text-gray-300 transition-colors"
                >
                  직접 붙여넣기
                </button>
                를 이용해보세요.
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={!canConvert}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {loading ? '변환 중...' : '변환하기'}
        </button>

        {result && (
          <>
            <ResultViewer content={result} />
            <ExportButtons content={result} />
          </>
        )}
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
