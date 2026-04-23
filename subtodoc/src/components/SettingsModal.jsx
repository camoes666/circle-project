import { useState } from 'react'

const LANGUAGES = ['한국어', '영어', '일본어', '중국어']

export default function SettingsModal({ settings, onSave, onClose }) {
  const [local, setLocal] = useState({ ...settings })
  const handleSave = () => { onSave(local); onClose() }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2px] p-6 w-full max-w-md space-y-5" style={{ boxShadow: 'rgba(0,0,0,0.3) 0px 0px 5px 0px' }}>
        <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">설정 — API 키 관리</h2>

        {/* 자막 소스 설정 */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#76b900]">자막 소스</h3>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              자체 서버 URL
            </label>
            <input
              type="text"
              value={local.customServerUrl ?? 'http://115.68.193.201'}
              onChange={e => setLocal(l => ({ ...l, customServerUrl: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="http://115.68.193.201"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">POST /api/transcript 엔드포인트를 지원하는 서버 주소</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Supadata API Key
              <a href="https://supadata.ai" target="_blank" rel="noopener noreferrer" className="ml-2 normal-case font-normal text-[#76b900] hover:text-[#bff230] text-xs">무료 가입 →</a>
            </label>
            <input
              type="password"
              value={local.supadadataApiKey ?? ''}
              onChange={e => setLocal(l => ({ ...l, supadadataApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="sup_..."
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">무료 플랜: 10회/일</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">로컬 서버 주소</label>
            <input
              type="text"
              value={local.localServerUrl ?? 'http://localhost:8000'}
              onChange={e => setLocal(l => ({ ...l, localServerUrl: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="http://localhost:8000"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Python 서버가 <code className="text-[#76b900]">GET /transcript?videoId=XXX</code>를 처리해야 합니다</p>
          </div>
        </section>

        {/* AI 설정 */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#76b900]">AI API 키</h3>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Groq API Key
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="ml-2 normal-case font-normal text-[#76b900] hover:text-[#bff230] text-xs">무료 키 발급 →</a>
            </label>
            <input
              type="password"
              value={local.groqApiKey ?? ''}
              onChange={e => setLocal(l => ({ ...l, groqApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="gsk_..."
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Groq · OpenAI(gpt-oss) 모두 이 키를 사용합니다.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Gemini API Key
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="ml-2 normal-case font-normal text-[#76b900] hover:text-[#bff230] text-xs">무료 키 발급 →</a>
            </label>
            <input
              type="password"
              value={local.geminiApiKey ?? ''}
              onChange={e => setLocal(l => ({ ...l, geminiApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="AIza..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">출력 언어</label>
            <select
              value={local.language}
              onChange={e => setLocal(l => ({ ...l, language: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
            >
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">취소</button>
          <button onClick={handleSave} className="px-4 py-2 bg-transparent border-2 border-[#76b900] rounded-[2px] text-sm font-bold text-[var(--text)] hover:bg-[#1eaedb] hover:border-[#1eaedb] transition-colors">저장</button>
        </div>
      </div>
    </div>
  )
}
