import { FORMATS } from '../services/prompts'

const FORMAT_META = {
  summary: { emoji: '📋', desc: '핵심 내용을 간결하게' },
  blog:    { emoji: '✍️', desc: '블로그 포스트 형식으로' },
  minutes: { emoji: '🗒️', desc: '논의·결정·액션아이템' },
  notes:   { emoji: '📚', desc: '핵심 개념 학습 노트' },
}

export default function FormatSelector({ selected, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-400">문서 형식</label>
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
    </div>
  )
}
