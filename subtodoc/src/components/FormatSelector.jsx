import { FORMATS } from '../services/prompts'

const FORMAT_META = {
  summary:  { emoji: '📋', desc: '핵심 내용을 간결하게' },
  blog:     { emoji: '✍️', desc: '블로그 포스트 형식으로' },
  minutes:  { emoji: '🗒️', desc: '논의·결정·액션아이템' },
  notes:    { emoji: '📚', desc: '핵심 개념 학습 노트' },
  mindmap:  { emoji: '🗺️', desc: '계층 구조 트리로 시각화' },
  slides:   { emoji: '📊', desc: 'PPT용 슬라이드 구성' },
  twitter:  { emoji: '✦',  desc: '280자 트윗 카드 시리즈' },
  linkedin: { emoji: '💼', desc: '훅·본문·해시태그 구조' },
}

const FORMAT_GROUPS = [
  { label: '문서',          ids: ['summary', 'blog', 'minutes', 'notes'] },
  { label: '소셜 & 시각화',  ids: ['mindmap', 'slides', 'twitter', 'linkedin'] },
]

export default function FormatSelector({
  selected, onChange,
  includeTimestamps, onTimestampsChange,
  showCustomInstruction, onShowCustomInstructionToggle,
  customInstruction, onCustomInstructionChange,
}) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">문서 형식</label>

      <div className="space-y-3">
        {FORMAT_GROUPS.map(group => (
          <div key={group.label} className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#76b900]">{group.label}</p>
            {/* 4-column grid on wider screens */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.ids.map(id => {
                const f = FORMATS.find(fmt => fmt.id === id)
                const meta = FORMAT_META[id] || { emoji: '📄', desc: '' }
                const isSelected = selected === id
                return (
                  <button
                    key={id}
                    onClick={() => onChange(id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-[2px] text-left transition-all ${
                      isSelected
                        ? 'bg-[#76b900]/10 border-2 border-[#76b900]'
                        : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[#76b900]/60 hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="text-base leading-none flex-shrink-0">{meta.emoji}</span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className={`text-sm font-bold leading-none ${isSelected ? 'text-[#76b900]' : 'text-[var(--text)]'}`}>
                        {f?.label ?? id}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] leading-tight truncate hidden sm:block">{meta.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
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
              includeTimestamps ? 'bg-[#76b900]' : 'bg-[var(--border)] hover:bg-[var(--text-muted)]'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              includeTimestamps ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
          <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors leading-tight">
            타임스탬프 포함
            <span className="ml-1.5 text-xs text-[var(--text-muted)]">[MM:SS] 클릭 시 해당 구간으로</span>
          </span>
        </label>
      )}

      {/* Custom instruction */}
      {onShowCustomInstructionToggle && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              const next = !showCustomInstruction
              onShowCustomInstructionToggle(next)
              if (!next) onCustomInstructionChange('')
            }}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[#76b900] transition-colors"
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
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#76b900] transition-colors animate-slide-up"
              autoFocus
            />
          )}
        </div>
      )}
    </div>
  )
}
