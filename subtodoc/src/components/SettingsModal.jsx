import { useState } from 'react'

const LANGUAGES = ['한국어', '영어', '일본어', '중국어']

const TRANSCRIPT_PROVIDERS = [
  { id: 'supadata', label: 'Supadata (무료 API)' },
  { id: 'local',    label: '로컬 Python 서버' },
  { id: 'auto',     label: '자동 (불안정)' },
]

// groq + groq-oss는 같은 Groq API 키 공유
const AI_PROVIDERS = [
  {
    id: 'groq',
    label: 'Groq',
    model: 'llama-4-scout',
    badge: '기본',
    keyField: 'groqApiKey',
    placeholder: 'gsk_...',
    link: 'https://console.groq.com',
    linkLabel: '무료 키 발급 →',
  },
  {
    id: 'groq-oss',
    label: 'OpenAI',
    model: 'gpt-oss-120b',
    badge: 'via Groq',
    keyField: 'groqApiKey',   // groq 키 그대로 사용
    placeholder: 'gsk_...',
    link: 'https://console.groq.com',
    linkLabel: 'Groq 키 발급 →',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    model: 'gemini-1.5-flash',
    badge: '',
    keyField: 'geminiApiKey',
    placeholder: 'AIza...',
    link: 'https://aistudio.google.com/app/apikey',
    linkLabel: '무료 키 발급 →',
  },
]

export default function SettingsModal({ settings, onSave, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  const handleSave = () => {
    onSave(local)
    onClose()
  }

  const currentProvider = AI_PROVIDERS.find(p => p.id === local.provider) ?? AI_PROVIDERS[0]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-5">
        <h2 className="text-lg font-semibold">설정</h2>

        {/* ── 자막 소스 ─────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">자막 소스</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">자막 가져오기 방법</label>
            <div className="flex flex-col gap-1.5">
              {TRANSCRIPT_PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setLocal(l => ({ ...l, transcriptProvider: p.id }))}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    local.transcriptProvider === p.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {local.transcriptProvider === 'supadata' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Supadata API Key
                <a
                  href="https://supadata.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-400 hover:text-blue-300 text-xs"
                >
                  무료 가입 →
                </a>
              </label>
              <input
                type="password"
                value={local.supadadataApiKey}
                onChange={e => setLocal(l => ({ ...l, supadadataApiKey: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                placeholder="sup_..."
              />
              <p className="text-xs text-gray-500 mt-1">무료 플랜: 10회/일. supadata.ai에서 가입 후 API 키 발급</p>
            </div>
          )}

          {local.transcriptProvider === 'local' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">로컬 서버 주소</label>
              <input
                type="text"
                value={local.localServerUrl}
                onChange={e => setLocal(l => ({ ...l, localServerUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                placeholder="http://localhost:8000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Python 서버가 <code className="text-gray-400">GET /transcript?videoId=XXX</code>를 처리해야 합니다
              </p>
            </div>
          )}
        </section>

        {/* ── AI Provider ───────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">AI 설정</h3>

          {/* 3-choice provider selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">AI 모델 선택</label>
            <div className="flex flex-col gap-1.5">
              {AI_PROVIDERS.map(p => {
                const isSelected = local.provider === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setLocal(l => ({ ...l, provider: p.id }))}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                        {p.label}
                      </span>
                      <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                        {p.model}
                      </span>
                    </span>
                    {p.badge && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        isSelected
                          ? 'bg-blue-500/60 text-blue-100'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {p.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {/* groq + groq-oss 공유 키 안내 */}
            {(local.provider === 'groq' || local.provider === 'groq-oss') && (
              <p className="text-xs text-gray-600 mt-1.5">
                Groq · OpenAI(gpt-oss) 모두 같은 Groq API 키를 사용합니다.
              </p>
            )}
          </div>

          {/* API Key input — dynamic by provider */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {currentProvider.label} API Key
              <a
                href={currentProvider.link}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-400 hover:text-blue-300 text-xs"
              >
                {currentProvider.linkLabel}
              </a>
            </label>
            <input
              key={currentProvider.keyField}
              type="password"
              value={local[currentProvider.keyField] ?? ''}
              onChange={e => setLocal(l => ({ ...l, [currentProvider.keyField]: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-100"
              placeholder={currentProvider.placeholder}
            />
          </div>

          {/* Output language */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">출력 언어</label>
            <select
              value={local.language}
              onChange={e => setLocal(l => ({ ...l, language: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-100"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
