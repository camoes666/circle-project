import { useState } from 'react'
import UrlInput from './components/UrlInput'
import FormatSelector from './components/FormatSelector'
import ResultViewer from './components/ResultViewer'
import ExportButtons from './components/ExportButtons'
import SettingsModal from './components/SettingsModal'
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

  const handleConvert = async () => {
    setError('')
    setResult('')
    const videoId = extractVideoId(url)
    if (!videoId) {
      setError('유효한 YouTube URL을 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const transcript = await fetchTranscript(videoId)
      const prompt = buildPrompt(format, settings.language)
      const doc = await generateDocument(transcript, prompt, settings)
      setResult(doc)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

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
        <UrlInput value={url} onChange={setUrl} />
        <FormatSelector selected={format} onChange={setFormat} />

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          onClick={handleConvert}
          disabled={loading || !url}
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
