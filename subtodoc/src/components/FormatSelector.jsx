/**
 * ════════════════════════════════════════════════════════════
 *  FormatSelector.jsx  —  문서 형식 선택 컴포넌트
 * ════════════════════════════════════════════════════════════
 *
 * 사용자가 어떤 형식의 문서를 만들지 선택하는 버튼 모음이에요.
 *
 * 선택할 수 있는 형식들:
 * 📋 문서 그룹: 요약, 블로그, 회의록, 노트
 * 🗺️ 소셜 & 시각화 그룹: 마인드맵, 슬라이드, 트위터, LinkedIn
 *
 * 추가 옵션:
 * - 타임스탬프 포함 토글: 시간 표시([01:23])를 포함할지 선택
 * - 직접 지시하기: AI에게 특별한 추가 요청을 입력할 수 있어요
 *   예: "초보자 친화적으로", "유머러스하게", "스타트업 투자자용으로"
 *
 * props (부모 컴포넌트에서 받는 데이터):
 * @param {string}   selected                   - 현재 선택된 형식 ID (예: 'summary')
 * @param {function} onChange                   - 형식이 바뀔 때 호출되는 함수
 * @param {boolean}  includeTimestamps          - 타임스탬프 포함 여부
 * @param {function} onTimestampsChange         - 타임스탬프 옵션 변경 시 호출
 * @param {boolean}  showCustomInstruction      - 직접 지시 입력창을 보여줄지 여부
 * @param {function} onShowCustomInstructionToggle - 직접 지시 토글 시 호출
 * @param {string}   customInstruction          - 사용자가 입력한 지시사항
 * @param {function} onCustomInstructionChange  - 지시사항 변경 시 호출
 */

// prompts.js에서 형식 목록(FORMATS)을 가져와요
import { FORMATS } from '../services/prompts'

/**
 * FORMAT_META — 각 형식의 이모지와 설명을 담은 객체예요
 *
 * prompts.js의 FORMATS는 AI 지시문 정보를 가지고 있고,
 * FORMAT_META는 화면에 표시할 이모지와 한 줄 설명을 가지고 있어요.
 * 두 개를 합쳐서 완전한 버튼을 만들어요.
 */
const FORMAT_META = {
  raw:      { emoji: '📄', desc: 'AI 없이 자막 원문 표시' },  // 전문: AI 호출 없이 바로 표시
  summary:  { emoji: '📋', desc: '핵심 내용을 간결하게' },
  blog:     { emoji: '✍️', desc: '블로그 포스트 형식으로' },
  minutes:  { emoji: '🗒️', desc: '논의·결정·액션아이템' },
  notes:    { emoji: '📚', desc: '핵심 개념 학습 노트' },
  mindmap:  { emoji: '🗺️', desc: '계층 구조 트리로 시각화' },
  slides:   { emoji: '📊', desc: 'PPT용 슬라이드 구성' },
  twitter:  { emoji: '✦',  desc: '280자 트윗 카드 시리즈' },
  linkedin: { emoji: '💼', desc: '훅·본문·해시태그 구조' },
}

/**
 * FORMAT_GROUPS — 형식들을 두 그룹으로 묶은 배열이에요
 *
 * 화면에서 그룹 제목("문서", "소셜 & 시각화")을 보여주고
 * 각 그룹에 속하는 버튼들을 표시해요.
 */
const FORMAT_GROUPS = [
  // '전문(raw)'을 맨 앞에 배치해요 — AI 없이 자막 원문을 바로 볼 수 있어요
  { label: '문서',          ids: ['raw', 'summary', 'blog', 'minutes', 'notes'] },
  { label: '소셜 & 시각화',  ids: ['mindmap', 'slides', 'twitter', 'linkedin'] },
]

/**
 * FormatSelector — 문서 형식 선택 컴포넌트
 */
export default function FormatSelector({
  selected, onChange,
  includeTimestamps, onTimestampsChange,
  showCustomInstruction, onShowCustomInstructionToggle,
  customInstruction, onCustomInstructionChange,
}) {
  return (
    // 전체를 감싸는 컨테이너 — 세로로 3단위 간격
    <div className="space-y-3">

      {/* 섹션 제목: "문서 형식" */}
      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">문서 형식</label>

      {/* ── 형식 버튼 그룹들 ── */}
      <div className="space-y-3">
        {/* FORMAT_GROUPS를 순서대로 그려요 ("문서" 그룹, "소셜 & 시각화" 그룹) */}
        {FORMAT_GROUPS.map(group => (
          <div key={group.label} className="space-y-1.5">

            {/* 그룹 이름 라벨 (초록색으로 표시) */}
            <p className="text-xs font-bold uppercase tracking-wider text-[#76b900]">{group.label}</p>

            {/* 형식 버튼들을 2열(모바일)~4열(PC) 격자로 배치 */}
            {/* grid-cols-2: 2열, sm:grid-cols-4: 화면이 크면 4열 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.ids.map(id => {
                // FORMATS 배열에서 이 id의 형식 정보를 찾아요
                const f = FORMATS.find(fmt => fmt.id === id)
                // FORMAT_META에서 이모지와 설명을 가져와요 (없으면 기본값)
                const meta = FORMAT_META[id] || { emoji: '📄', desc: '' }
                // 이 버튼이 현재 선택된 형식인지 확인해요
                const isSelected = selected === id

                return (
                  <button
                    key={id}
                    onClick={() => onChange(id)}  /* 클릭하면 이 형식 ID를 부모에게 전달 */
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-[2px] text-left transition-all ${
                      isSelected
                        // 선택된 상태: 초록 배경, 초록 테두리 (두꺼운 border-2)
                        ? 'bg-[#76b900]/10 border-2 border-[#76b900]'
                        // 선택 안 된 상태: 회색 배경, 회색 테두리, 마우스 올리면 초록 테두리
                        : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[#76b900]/60 hover:text-[var(--text)]'
                    }`}
                  >
                    {/* 이모지 아이콘 */}
                    <span className="text-base leading-none flex-shrink-0">{meta.emoji}</span>

                    {/* 형식 이름과 설명 */}
                    <span className="flex flex-col gap-0.5 min-w-0">
                      {/* 형식 이름 (선택됐으면 초록색, 아니면 기본 색) */}
                      <span className={`text-sm font-bold leading-none ${isSelected ? 'text-[#76b900]' : 'text-[var(--text)]'}`}>
                        {f?.label ?? id}  {/* FORMATS에서 찾은 label, 없으면 id를 보여요 */}
                      </span>
                      {/* 설명 텍스트 (화면이 작으면 hidden으로 숨겨요) */}
                      <span className="text-xs text-[var(--text-muted)] leading-tight truncate hidden sm:block">{meta.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── 타임스탬프 포함 토글 ── */}
      {/* onTimestampsChange가 있을 때만 표시해요 */}
      {onTimestampsChange && (
        // label 안에 버튼을 넣어서 클릭 영역을 넓혀요 (텍스트 클릭해도 토글 됨)
        <label className="flex items-center gap-3 cursor-pointer group select-none">

          {/* 토글 스위치 버튼 */}
          {/* role="switch": 스크린 리더에게 이게 스위치임을 알려줘요 */}
          {/* aria-checked: 현재 켜짐/꺼짐 상태를 알려줘요 */}
          <button
            type="button"
            role="switch"
            aria-checked={includeTimestamps}
            onClick={() => onTimestampsChange(!includeTimestamps)}
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 focus:outline-none ${
              includeTimestamps
                ? 'bg-[#76b900]'   // 켜짐: 초록색 배경
                : 'bg-[var(--border)] hover:bg-[var(--text-muted)]'  // 꺼짐: 회색
            }`}
          >
            {/* 동그란 손잡이 — includeTimestamps에 따라 왼쪽/오른쪽으로 이동해요 */}
            {/* translate-x-4: 오른쪽으로 이동 (켜짐), translate-x-0: 제자리 (꺼짐) */}
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              includeTimestamps ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>

          {/* 라벨 텍스트 */}
          <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors leading-tight">
            타임스탬프 포함
            {/* 작은 힌트 텍스트 */}
            <span className="ml-1.5 text-xs text-[var(--text-muted)]">[MM:SS] 클릭 시 해당 구간으로</span>
          </span>
        </label>
      )}

      {/* ── 직접 지시하기 토글 & 입력창 ── */}
      {/* onShowCustomInstructionToggle이 있을 때만 표시해요 */}
      {onShowCustomInstructionToggle && (
        <div className="space-y-2">

          {/* "직접 지시하기" 토글 버튼 */}
          <button
            type="button"
            onClick={() => {
              // 현재 상태 반전 (열려있으면 닫고, 닫혀있으면 열어요)
              const next = !showCustomInstruction
              onShowCustomInstructionToggle(next)
              // 닫을 때는 입력 내용도 지워요
              if (!next) onCustomInstructionChange('')
            }}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[#76b900] transition-colors"
          >
            {/* 화살표 아이콘 — 열리면 90도 회전해서 아래를 가리켜요 */}
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

          {/* 지시사항 입력창 — showCustomInstruction이 true일 때만 보여요 */}
          {showCustomInstruction && (
            <input
              type="text"
              value={customInstruction}
              onChange={e => onCustomInstructionChange(e.target.value)}
              placeholder="예: 초보자 친화적으로 · 유머러스하게 · 스타트업 투자자용으로"
              // animate-slide-up: 입력창이 위에서 아래로 부드럽게 나타나요
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#76b900] transition-colors animate-slide-up"
              autoFocus  /* 입력창이 나타나면 자동으로 포커스(커서)가 이동해요 */
            />
          )}
        </div>
      )}
    </div>
  )
}
