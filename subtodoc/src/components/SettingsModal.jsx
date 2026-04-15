import { useState } from 'react'

const LANGUAGES = ['한국어', '영어', '일본어', '중국어']

export default function SettingsModal({ settings, onSave, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  const handleSave = () => {
    onSave(local)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">설정</h2>

        <div>
          <label className="block text-sm text-gray-400 mb-1">AI Provider</label>
          <div className="flex gap-2">
            {['groq', 'gemini'].map(p => (
              <button
                key={p}
                onClick={() => setLocal(l => ({ ...l, provider: p }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  local.provider === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {p === 'groq' ? 'Groq (기본)' : 'Gemini Flash'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {local.provider === 'groq' ? 'Groq' : 'Gemini'} API Key
          </label>
          <input
            type="password"
            value={local.provider === 'groq' ? local.groqApiKey : local.geminiApiKey}
            onChange={e => {
              const key = local.provider === 'groq' ? 'groqApiKey' : 'geminiApiKey'
              setLocal(l => ({ ...l, [key]: e.target.value }))
            }}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-100"
            placeholder="API 키를 입력하세요"
          />
        </div>

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
