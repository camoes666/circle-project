/**
 * ════════════════════════════════════════════════════════════
 *  UrlInput.jsx  —  YouTube URL 입력창 컴포넌트
 * ════════════════════════════════════════════════════════════
 *
 * 사용자가 YouTube URL을 입력하는 입력창이에요.
 *
 * 기능:
 * 1. YouTube 아이콘이 있는 URL 입력창
 * 2. URL이 입력되면 오른쪽에 X 버튼이 나타나요
 *    → X 버튼을 누르면 입력창이 비워져요
 *
 * props (부모 컴포넌트에서 받는 데이터):
 * @param {string}   value    - 현재 입력창에 있는 URL 문자열
 * @param {function} onChange - URL이 바뀔 때 호출되는 함수 (새 URL을 전달)
 */
export default function UrlInput({ value, onChange }) {
  return (
    // 입력창과 라벨을 묶는 컨테이너 — space-y-1.5: 세로 간격 1.5단위
    <div className="space-y-1.5">

      {/* URL 입력창 위에 보이는 라벨(제목) */}
      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
        YouTube URL
      </label>

      {/* 아이콘과 X 버튼을 같은 줄에 배치하기 위한 relative 컨테이너 */}
      <div className="relative">

        {/* 왼쪽에 고정된 YouTube 아이콘 */}
        {/* absolute: 컨테이너 안에서 위치를 고정해요 */}
        {/* left-3.5: 왼쪽에서 3.5단위 위치 */}
        {/* top-1/2 -translate-y-1/2: 세로 가운데 정렬 */}
        {/* pointer-events-none: 클릭해도 아무 반응 없는 장식용 */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--border)] pointer-events-none">
          {/* YouTube 로고 SVG 아이콘 */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
          </svg>
        </div>

        {/* 실제 URL 입력창 */}
        {/* type="url": 브라우저가 URL 형식인지 기본 검증해줘요 */}
        {/* value: 현재 입력된 URL 값 (React가 관리해요) */}
        {/* onChange: 사용자가 타이핑할 때마다 호출돼요 */}
        {/* pl-10: 왼쪽 패딩을 크게 줘서 아이콘과 겹치지 않게 해요 */}
        {/* focus:border-[#76b900]: 클릭하면 테두리가 NVIDIA 초록색으로 바뀌어요 */}
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-[var(--text)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[#76b900] transition-colors"
        />

        {/* URL이 입력되어 있을 때만 보이는 X(지우기) 버튼 */}
        {/* value가 빈 문자열('')이면 falsy → 버튼이 안 보여요 */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}   /* 클릭하면 URL을 빈 문자열로 초기화 */
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="지우기"            /* 스크린 리더(시각장애인용)를 위한 설명 */
          >
            {/* X 모양의 SVG 아이콘 */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>  {/* 왼쪽 위 → 오른쪽 아래 선 */}
              <line x1="6" y1="6" x2="18" y2="18"/>  {/* 왼쪽 아래 → 오른쪽 위 선 */}
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
