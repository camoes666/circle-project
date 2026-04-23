/**
 * ════════════════════════════════════════════════════════════
 *  ProviderBar.jsx  —  자막 소스 & AI 모델 선택 바
 * ════════════════════════════════════════════════════════════
 *
 * 이 컴포넌트는 메인 화면 안에서 바로
 * 자막을 어디서 가져올지, 어떤 AI를 쓸지 선택할 수 있게 해주는 선택 버튼들이에요.
 *
 * 설정 창(Settings Modal)을 열지 않고도 빠르게 바꿀 수 있어요.
 * 마치 TV 리모컨처럼 한 번에 바꿀 수 있는 것들을 모아놨어요.
 *
 * 화면 구조:
 * ┌─────────────────────────────────────────┐
 * │ 자막  [자체 서버 기본]  [Supadata]  [로컬 서버] │
 * │ AI    [Groq llama-4-scout 기본] [OpenAI] [Gemini] │
 * └─────────────────────────────────────────┘
 *
 * props (부모 컴포넌트에서 받는 데이터):
 * @param {object}   settings           - 현재 앱 설정 (선택된 자막 소스, AI 등)
 * @param {function} onChangeTranscript - 자막 소스를 바꿀 때 호출되는 함수
 * @param {function} onChangeAI         - AI 모델을 바꿀 때 호출되는 함수
 */

/**
 * TRANSCRIPT_OPTIONS — 자막 소스 선택 옵션 목록
 *
 * 세 가지 방법으로 자막을 가져올 수 있어요:
 * - custom-server: 개발자가 만든 서버 (가장 안정적, 기본값)
 * - supadata: supadata.ai API (무료 하루 10회)
 * - local: 내 컴퓨터의 Python 서버
 */
const TRANSCRIPT_OPTIONS = [
  { id: 'custom-server', label: '자체 서버', badge: '기본' }, // badge: 라벨 옆에 붙는 작은 태그
  { id: 'supadata',      label: 'Supadata',  badge: '' },
  { id: 'local',         label: '로컬 서버', badge: '' },
]

/**
 * AI_OPTIONS — AI 모델 선택 옵션 목록
 *
 * 세 가지 AI 중 하나를 선택할 수 있어요:
 * - groq: Groq 서비스의 Meta Llama 4 Scout 모델 (빠르고 한국어 잘 해요)
 * - groq-oss: Groq 서비스의 OpenAI gpt-oss 모델 (같은 Groq API 키 사용)
 * - gemini: 구글의 Gemini 2.5 Flash Lite 모델 (Google AI Studio 키 필요)
 *
 * sub: 버튼 안에 작게 보이는 모델 이름이에요
 * badge: 라벨 옆에 붙는 작은 태그예요 (예: "기본", "Groq")
 */
const AI_OPTIONS = [
  { id: 'groq',     label: 'Groq',   sub: 'llama-4-scout',   badge: '기본' },
  { id: 'groq-oss', label: 'OpenAI', sub: 'gpt-oss-120b',    badge: 'Groq' },
  { id: 'gemini',   label: 'Gemini', sub: '2.5-flash-lite',  badge: '' },
]

/**
 * OptionButton — 각각의 선택 버튼 컴포넌트
 *
 * 선택되면(selected=true) NVIDIA 초록색으로, 안 선택되면 회색으로 보여요.
 * 클릭하면 onClick 함수가 실행돼서 선택이 바뀌어요.
 *
 * @param {string}   label    - 버튼에 표시되는 이름 (예: 'Groq', '자체 서버')
 * @param {string}   sub      - 이름 옆에 작게 표시되는 부제목 (예: 'llama-4-scout')
 * @param {string}   badge    - 오른쪽에 표시되는 배지 (예: '기본', 'Groq')
 * @param {boolean}  selected - 이 버튼이 현재 선택되어 있는지 여부
 * @param {function} onClick  - 버튼을 클릭했을 때 실행되는 함수
 */
function OptionButton({ label, sub, badge, selected, onClick }) {
  return (
    <button
      type="button"   /* form 안에서 submit이 일어나지 않도록 type을 명시해요 */
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] text-xs font-bold transition-all border ${
        selected
          // 선택된 상태: 초록색 배경(투명), 초록 테두리, 초록 글자
          ? 'bg-[#76b900]/10 border-[#76b900] text-[#76b900]'
          // 선택 안 된 상태: 회색 테두리, 흐린 글자, 마우스 올리면 테두리가 초록색으로
          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[#76b900]/60 hover:text-[var(--text)]'
      }`}
    >
      {/* 버튼 메인 라벨 (예: 'Groq', '자체 서버') */}
      <span>{label}</span>

      {/* sub가 있을 때만 표시 (예: 'llama-4-scout') */}
      {sub && (
        <span className={`font-normal ${selected ? 'text-[#76b900]/70' : 'text-[var(--text-muted)]'}`}>
          {sub}
        </span>
      )}

      {/* badge가 있을 때만 표시 (예: '기본', 'Groq') */}
      {badge && (
        <span className={`text-[10px] px-1 py-0.5 rounded-[2px] font-bold ${
          selected
            ? 'bg-[#76b900]/20 text-[#76b900]'   // 선택됐을 때: 초록 배경
            : 'bg-[var(--surface-2,var(--border))] text-[var(--text-muted)]' // 안 선택됐을 때: 회색
        }`}>
          {badge}
        </span>
      )}
    </button>
  )
}

/**
 * ProviderBar — 자막 소스 & AI 모델을 선택하는 바 컴포넌트
 *
 * 두 줄로 구성돼요:
 * 1줄: "자막" 라벨 + 자막 소스 선택 버튼 3개
 * 2줄: "AI" 라벨 + AI 모델 선택 버튼 3개
 *
 * @param {object}   settings           - 현재 설정 (어떤 것이 선택됐는지 확인에 사용)
 * @param {function} onChangeTranscript - 자막 소스 변경 시 호출 (선택한 id를 전달)
 * @param {function} onChangeAI         - AI 모델 변경 시 호출 (선택한 id를 전달)
 */
export default function ProviderBar({ settings, onChangeTranscript, onChangeAI }) {
  return (
    // 두 줄(자막, AI)을 세로로 배치하는 컨테이너
    <div className="space-y-2 pt-1">

      {/* ── 자막 소스 선택 줄 ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* "자막" 라벨 — w-8으로 너비를 고정해서 두 줄이 정렬되게 해요 */}
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] w-8 flex-shrink-0">자막</span>

        {/* 자막 소스 선택 버튼들 */}
        <div className="flex gap-1.5 flex-wrap">
          {TRANSCRIPT_OPTIONS.map(opt => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              badge={opt.badge}
              // 현재 선택된 자막 소스와 이 버튼의 id가 같으면 selected=true
              selected={settings.transcriptProvider === opt.id}
              // 클릭하면 이 버튼의 id(opt.id)를 부모에게 전달해요
              onClick={() => onChangeTranscript(opt.id)}
            />
          ))}
        </div>
      </div>

      {/* ── AI 모델 선택 줄 ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* "AI" 라벨 */}
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] w-8 flex-shrink-0">AI</span>

        {/* AI 모델 선택 버튼들 */}
        <div className="flex gap-1.5 flex-wrap">
          {AI_OPTIONS.map(opt => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              sub={opt.sub}
              badge={opt.badge}
              // 현재 선택된 AI와 이 버튼의 id가 같으면 selected=true
              selected={settings.provider === opt.id}
              // 클릭하면 이 버튼의 id(opt.id)를 부모에게 전달해요
              onClick={() => onChangeAI(opt.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
