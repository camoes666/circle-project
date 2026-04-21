import { useState } from 'react'

const LANGUAGES = ['한국어', '영어', '일본어', '중국어']

const TRANSCRIPT_PROVIDERS = [
  { id: 'supadata', label: 'Supadata (무료 API)' },
  { id: 'local',    label: '로컬 Python 서버' },
  { id: 'auto',     label: '자동 (불안정)' },
]

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
    keyField: 'groqApiKey',
    placeholder: 'gsk_...',
    link: 'https://console.groq.com',
    linkLabel: 'Groq 키 발급 →',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    model: 'gemini-2.5-flash-lite',
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-[#1a1a1a] border border-[#5e5e5e] rounded-[2px] p-6 w-full max-w-md space-y-5" style={{ boxShadow: 'rgba(0,0,0,0.3) 0px 0px 5px 0px' }}>
        <h2 className="text-lg font-bold text-white tracking-tight">설정</h2>

        {/* ── 자막 소스 ─────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#76b900]">자막 소스</h3>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a7a7a7] mb-2">자막 가져오기 방법</label>
            <div className="flex flex-col gap-1.5">
              {TRANSCRIPT_PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setLocal(l => ({ ...l, transcriptProvider: p.id }))}
                  className={`text-left px-3 py-2 rounded-[2px] text-sm font-bold transition-colors ${
                    local.transcriptProvider === p.id
                      ? 'bg-[#76b900]/10 border-2 border-[#76b900] text-white'
                      : 'bg-[#000000] border border-[#5e5e5e] text-[#a7a7a7] hover:border-[#76b900]/60 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {local.transcriptProvider === 'supadata' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#a7a7a7] mb-1">
                Supadata API Key
                <a href="https://supadata.ai" target="_blank" rel="noopener noreferrer"
                  className="ml-2 normal-case font-normal text-[#76b900] hover:text-[#bff230] text-xs">
                  무료 가입 →
                </a>
              </label>
              <input
                type="password"
                value={local.supadadataApiKey}
                onChange={e => setLocal(l => ({ ...l, supadadataApiKey: e.target.value }))}
                className="w-full px-3 py-2 bg-[#000000] border border-[#5e5e5e] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-white"
                placeholder="sup_..."
              />
              <p className="text-xs text-[#757575] mt-1">무료 플랜: 10회/일. supadata.ai에서 가입 후 API 키 발급</p>
            </div>
          )}

          {local.transcriptProvider === 'local' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#a7a7a7] mb-1">로컬 서버 주소</label>
              <input
                type="text"
                value={local.localServerUrl}
                onChange={e => setLocal(l => ({ ...l, localServerUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-[#000000] border border-[#5e5e5e] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-white"
                placeholder="http://localhost:8000"
              />
              <p className="text-xs text-[#757575] mt-1">
                Python 서버가 <code className="text-[#76b900]">GET /transcript?videoId=XXX</code>를 처리해야 합니다
              </p>
            </div>
          )}
        </section>

        {/* ── AI Provider ───────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#76b900]">AI 설정</h3>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a7a7a7] mb-2">AI 모델 선택</label>
            <div className="flex flex-col gap-1.5">
              {AI_PROVIDERS.map(p => {
                const isSelected = local.provider === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setLocal(l => ({ ...l, provider: p.id }))}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-[2px] text-sm font-bold transition-colors text-left ${
                      isSelected
                        ? 'bg-[#76b900]/10 border-2 border-[#76b900] text-white'
                        : 'bg-[#000000] border border-[#5e5e5e] text-[#a7a7a7] hover:border-[#76b900]/60 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-white">{p.label}</span>
                      <span className={`text-xs font-normal ${isSelected ? 'text-[#a7a7a7]' : 'text-[#757575]'}`}>
                        {p.model}
                      </span>
                    </span>
                    {p.badge && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-[2px] font-bold ${
                        isSelected ? 'bg-[#76b900]/30 text-[#76b900]' : 'bg-[#1a1a1a] text-[#757575]'
                      }`}>
                        {p.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {(local.provider === 'groq' || local.provider === 'groq-oss') && (
              <p className="text-xs text-[#757575] mt-1.5">
                Groq · OpenAI(gpt-oss) 모두 같은 Groq API 키를 사용합니다.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a7a7a7] mb-1">
              {currentProvider.label} API Key
              <a href={currentProvider.link} target="_blank" rel="noopener noreferrer"
                className="ml-2 normal-case font-normal text-[#76b900] hover:text-[#bff230] text-xs">
                {currentProvider.linkLabel}
              </a>
            </label>
            <input
              key={currentProvider.keyField}
              type="password"
              value={local[currentProvider.keyField] ?? ''}
              onChange={e => setLocal(l => ({ ...l, [currentProvider.keyField]: e.target.value }))}
              className="w-full px-3 py-2 bg-[#000000] border border-[#5e5e5e] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-white"
              placeholder={currentProvider.placeholder}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a7a7a7] mb-1">출력 언어</label>
            <select
              value={local.language}
              onChange={e => setLocal(l => ({ ...l, language: e.target.value }))}
              className="w-full px-3 py-2 bg-[#000000] border border-[#5e5e5e] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-white"
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
            className="px-4 py-2 text-sm font-bold text-[#a7a7a7] hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-transparent border-2 border-[#76b900] rounded-[2px] text-sm font-bold text-white hover:bg-[#1eaedb] hover:border-[#1eaedb] transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
