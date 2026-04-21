import { FORMATS } from '../services/prompts'

const FORMAT_META = {
  summary: { emoji: '📋', desc: '핵심 내용을 간결하게' },
  blog:    { emoji: '✍️', desc: '블로그 포스트 형식으로' },
  minutes: { emoji: '🗒️', desc: '논의·결정·액션아이템' },
  notes:   { emoji: '📚', desc: '핵심 개념 학습 노트' },
}

export default function FormatSelector({
  selected,
  onChange,
  includeTimestamps,
  onTimestampsChange,
  showCustomInstruction,
  onShowCustomInstructionToggle,
  customInstruction,
  onCustomInstructionChange,
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-400">문서 형식</label>

      {/* 2×2 format grid */}
      <div className="grid grid-cols-2 gap-2">
        {FORMATS.map(f => {
          const meta = FORMAT_META[f.id] || { emoji: '📄', desc: '' }
          const isSelected = selected === f.id
          return (
            <button
              key={f.id}
              onClick={() => onChange(f.id)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-blue-600/20 border border-blue-500/60 text-blue-300'
                  : 'bg-gray-800/60 border border-gray-700/60 text-gray-400 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              <span className="text-lg leading-none flex-shrink-0">{meta.emoji}</span>
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className={`text-sm font-medium leading-none ${isSelected ? 'text-blue-200' : 'text-gray-300'}`}>
                  {f.label}
                </span>
                <span className="text-xs text-gray-500 leading-tight truncate">{meta.desc}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Timestamp toggle */}
      {onTimestampsChange && (
        <label className="flex items-center gap-3 cursor-pointer group select-none">
          <button
            type="button"
            role="switch"
            aria-checked={includeTimestamps}
            onClick={() => onTimestampsChange(!includeTimestamps)}
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 focus:outline-none ${
              includeTimestamps ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              includeTimestamps ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
          <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-tight">
            타임스탬프 포함
            <span className="ml-1.5 text-xs text-gray-600">[MM:SS] 클릭 시 해당 구간으로</span>
          </span>
        </label>
      )}

      {/* Custom instruction toggle + input */}
      {onShowCustomInstructionToggle && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              const next = !showCustomInstruction
              onShowCustomInstructionToggle(next)
              if (!next) onCustomInstructionChange('')
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${showCustomInstruction ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            직접 지시하기
          </button>

          {showCustomInstruction && (
            <input
              type="text"
              value={customInstruction}
              onChange={e => onCustomInstructionChange(e.target.value)}
              placeholder="예: 초보자 친화적으로 · 유머러스하게 · 스타트업 투자자용으로"
              className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors animate-slide-up"
              autoFocus
            />
          )}
        </div>
      )}
    </div>
  )
}
