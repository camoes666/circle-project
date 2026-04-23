const TRANSCRIPT_OPTIONS = [
  { id: 'custom-server', label: '자체 서버', badge: '기본' },
  { id: 'supadata',      label: 'Supadata',  badge: '' },
  { id: 'local',         label: '로컬 서버', badge: '' },
]

const AI_OPTIONS = [
  { id: 'groq',     label: 'Groq',   sub: 'llama-4-scout',   badge: '기본' },
  { id: 'groq-oss', label: 'OpenAI', sub: 'gpt-oss-120b',    badge: 'Groq' },
  { id: 'gemini',   label: 'Gemini', sub: '2.5-flash-lite',  badge: '' },
]

function OptionButton({ label, sub, badge, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] text-xs font-bold transition-all border ${
        selected
          ? 'bg-[#76b900]/10 border-[#76b900] text-[#76b900]'
          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[#76b900]/60 hover:text-[var(--text)]'
      }`}
    >
      <span>{label}</span>
      {sub && <span className={`font-normal ${selected ? 'text-[#76b900]/70' : 'text-[var(--text-muted)]'}`}>{sub}</span>}
      {badge && (
        <span className={`text-[10px] px-1 py-0.5 rounded-[2px] font-bold ${
          selected ? 'bg-[#76b900]/20 text-[#76b900]' : 'bg-[var(--surface-2,var(--border))] text-[var(--text-muted)]'
        }`}>
          {badge}
        </span>
      )}
    </button>
  )
}

export default function ProviderBar({ settings, onChangeTranscript, onChangeAI }) {
  return (
    <div className="space-y-2 pt-1">
      {/* 자막 소스 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] w-8 flex-shrink-0">자막</span>
        <div className="flex gap-1.5 flex-wrap">
          {TRANSCRIPT_OPTIONS.map(opt => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              badge={opt.badge}
              selected={settings.transcriptProvider === opt.id}
              onClick={() => onChangeTranscript(opt.id)}
            />
          ))}
        </div>
      </div>

      {/* AI 모델 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] w-8 flex-shrink-0">AI</span>
        <div className="flex gap-1.5 flex-wrap">
          {AI_OPTIONS.map(opt => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              sub={opt.sub}
              badge={opt.badge}
              selected={settings.provider === opt.id}
              onClick={() => onChangeAI(opt.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
