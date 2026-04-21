import { useState, useMemo } from 'react'
import UrlInput from './components/UrlInput'
import FormatSelector from './components/FormatSelector'
import ResultViewer from './components/ResultViewer'
import ExportButtons from './components/ExportButtons'
import SettingsModal from './components/SettingsModal'
import TranscriptPaste from './components/TranscriptPaste'
import VideoPreview from './components/VideoPreview'
import HistoryPanel from './components/HistoryPanel'
import { useSettings } from './hooks/useSettings'
import { useHistory } from './hooks/useHistory'
import { extractVideoId, fetchTranscript } from './services/transcript'
import { buildPrompt } from './services/prompts'
import { generateDocument } from './services/ai'

export default function App() {
  const { settings, updateSettings } = useSettings()
  const { history, addEntry, removeEntry, clearHistory } = useHistory()

  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('summary')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState('url')
  const [manualTranscript, setManualTranscript] = useState('')

  // v2 state
  const [includeTimestamps, setIncludeTimestamps] = useState(false)
  const [customInstruction, setCustomInstruction] = useState('')
  const [showCustomInstruction, setShowCustomInstruction] = useState(false)

  // Task 1: videoId as derived state
  const videoId = useMemo(() => extractVideoId(url), [url])

  const handleConvert = async () => {
    setError('')
    setResult('')
    setLoading(true)

    try {
      let transcript

      if (activeTab === 'paste') {
        if (!manualTranscript.trim()) { setLoading(false); return }
        transcript = manualTranscript.trim()
      } else {
        if (!videoId) {
          setError('유효한 YouTube URL을 입력해주세요.')
          setLoading(false)
          return
        }
        try {
          transcript = await fetchTranscript(videoId, {
            ...settings,
            withTimestamps: includeTimestamps,
          })
        } catch (e) {
          setError(e.message)
          if (
            e.message.includes('자막') ||
            e.message.includes('fetch') ||
            e.message.includes('API') ||
            e.message.includes('Failed')
          ) {
            setActiveTab('paste')
          }
          setLoading(false)
          return
        }
      }

      const prompt = buildPrompt(format, settings.language, {
        includeTimestamps,
        customInstruction: showCustomInstruction ? customInstruction : '',
      })
      const doc = await generateDocument(transcript, prompt, settings)
      setResult(doc)

      addEntry({
        url: activeTab === 'url' ? url : '',
        videoId: activeTab === 'url' ? (videoId ?? null) : null,
        format,
        result: doc,
        customInstruction: showCustomInstruction ? customInstruction : '',
        includeTimestamps,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = (entry) => {
    if (entry.url) {
      setActiveTab('url')
      setUrl(entry.url)
    }
    setFormat(entry.format)
    setResult(entry.result)
    setCustomInstruction(entry.customInstruction || '')
    setShowCustomInstruction(!!entry.customInstruction)
    setIncludeTimestamps(entry.includeTimestamps || false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const canConvert =
    !loading &&
    (activeTab === 'paste'
      ? manualTranscript.trim().length > 0
      : url.trim().length > 0)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm select-none">
              S
            </span>
            <span className="font-bold text-white tracking-tight">SubToDoc</span>
            <span className="hidden sm:inline text-xs text-gray-500 ml-1">YouTube → 문서</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="설정 열기"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* Input Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-fade-in">

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {[
              {
                id: 'url',
                label: 'YouTube URL',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
                  </svg>
                ),
              },
              {
                id: 'paste',
                label: '자막 붙여넣기',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="4" rx="1"/>
                    <path d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2"/>
                    <path d="M9 12h6M9 16h4"/>
                  </svg>
                ),
              },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError('') }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5'
                    : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5 space-y-5">
            {activeTab === 'url' ? (
              <div className="space-y-3">
                <UrlInput value={url} onChange={setUrl} />
                <VideoPreview videoId={videoId} />
              </div>
            ) : (
              <TranscriptPaste value={manualTranscript} onChange={setManualTranscript} />
            )}

            <FormatSelector
              selected={format}
              onChange={setFormat}
              includeTimestamps={includeTimestamps}
              onTimestampsChange={setIncludeTimestamps}
              showCustomInstruction={showCustomInstruction}
              onShowCustomInstructionToggle={(show) => {
                setShowCustomInstruction(show)
                if (!show) setCustomInstruction('')
              }}
              customInstruction={customInstruction}
              onCustomInstructionChange={setCustomInstruction}
            />

            {/* Error */}
            {error && (
              <div className="flex gap-3 p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl animate-slide-up">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 flex-shrink-0 mt-0.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div className="space-y-1 text-sm">
                  <p className="text-red-300">{error}</p>
                  {activeTab === 'url' && (
                    <p className="text-gray-500">
                      자막 자동 가져오기 실패 —{' '}
                      <button
                        type="button"
                        onClick={() => { setActiveTab('paste'); setError('') }}
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                      >
                        직접 붙여넣기
                      </button>
                      로 시도해보세요.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!canConvert}
              className={`w-full h-12 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                canConvert
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin-slow w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>변환 중...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M18.36 18.36l.7.7M3 12h1M20 12h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7"/>
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                  변환하기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="animate-slide-up space-y-3">
            <ResultViewer
              content={result}
              videoId={activeTab === 'url' ? videoId : null}
            />
            <ExportButtons content={result} />
          </div>
        )}

        {/* History */}
        <HistoryPanel
          history={history}
          onRestore={handleRestore}
          onRemove={removeEntry}
          onClear={clearHistory}
        />
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
