/**
 * ════════════════════════════════════════════════════════════
 *  TranscriptPaste.jsx  —  자막 직접 붙여넣기 탭 컴포넌트
 * ════════════════════════════════════════════════════════════
 *
 * 자막을 자동으로 가져오지 못할 때, 사용자가 직접 자막을 복사해서
 * 붙여넣기 할 수 있는 입력 공간이에요.
 *
 * 기능:
 * 1. 자막을 붙여넣을 수 있는 큰 텍스트 입력창
 * 2. 사용 방법 안내 (3단계 가이드)
 * 3. 북마클릿(Bookmarklet) 버튼
 *    → YouTube 페이지에서 자막을 자동으로 복사해주는 특별한 브라우저 도구예요
 *    → 이 버튼을 북마크 바에 드래그해서 저장하면 돼요
 * 4. 입력된 글자 수 표시
 *
 * 북마클릿이란?
 * → 브라우저 북마크(즐겨찾기)에 저장할 수 있는 작은 JavaScript 프로그램이에요.
 *   저장한 다음 YouTube 페이지에서 클릭하면
 *   자막 텍스트를 자동으로 클립보드에 복사해줘요!
 *
 * props (부모 컴포넌트에서 받는 데이터):
 * @param {string}   value    - 현재 입력창에 있는 자막 텍스트
 * @param {function} onChange - 텍스트가 바뀔 때 호출되는 함수
 */

/**
 * BOOKMARKLET_SRC — 북마클릿의 실제 JavaScript 코드예요
 *
 * 이 코드는 YouTube 페이지에서 실행되어:
 * 1. 자막 패널이 열려있는지 확인해요
 * 2. 자막 패널이 닫혀있으면 "자막 열기" 버튼을 찾아서 클릭해요
 * 3. 자막 텍스트를 모두 수집해요
 * 4. 클립보드에 복사해요
 * 5. 완료 알림을 보여줘요
 *
 * (function(){...})() 형태 → 즉시실행함수(IIFE)예요.
 * 다른 코드와 충돌하지 않도록 독립된 공간에서 실행해요.
 */
const BOOKMARKLET_SRC = `(function(){
  var panel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
  if (!panel || panel.getAttribute('visibility') === 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN') {
    var btns = Array.from(document.querySelectorAll('button, yt-button-shape button'));
    var transcriptBtn = btns.find(function(b){ return /transcript|자막|字幕/i.test(b.textContent); });
    if (!transcriptBtn) { alert('동영상 아래 "..." → "자막 열기"를 먼저 클릭하세요.'); return; }
    transcriptBtn.click();
    setTimeout(extract, 1200);
  } else { extract(); }
  function extract(){
    var segs = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text, yt-formatted-string.segment-text');
    if (!segs.length) { alert('자막 패널이 열려 있지 않습니다. "..." → "자막 열기"를 클릭한 후 다시 시도해주세요.'); return; }
    var text = Array.from(segs).map(function(s){ return s.textContent.trim(); }).filter(Boolean).join(' ');
    navigator.clipboard.writeText(text).then(function(){
      alert('자막이 클립보드에 복사되었습니다!');
    }, function(){
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      alert('자막이 클립보드에 복사되었습니다!');
    });
  }
})()`

/**
 * TranscriptPaste — 자막 직접 붙여넣기 컴포넌트
 *
 * @param {string}   value    - 현재 입력된 자막 텍스트
 * @param {function} onChange - 텍스트 변경 시 호출되는 함수
 */
export default function TranscriptPaste({ value, onChange }) {
  /**
   * bookmarkletHref — 북마클릿 링크 주소
   *
   * "javascript:" 스킴으로 시작하는 특별한 URL이에요.
   * 이걸 북마크로 저장하면 클릭 시 JavaScript 코드가 실행돼요.
   * encodeURIComponent: URL에 쓸 수 없는 특수문자를 변환해줘요.
   * 예: 공백 → %20, 따옴표 → %22
   */
  const bookmarkletHref = `javascript:${encodeURIComponent(BOOKMARKLET_SRC)}`

  return (
    // 전체를 감싸는 컨테이너 — 세로로 3단위 간격
    <div className="space-y-3">

      {/* ── 제목과 북마클릿 버튼 줄 ── */}
      <div className="flex items-start justify-between gap-3">

        {/* 왼쪽: 제목과 설명 */}
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-[var(--text)]">자막 직접 붙여넣기</p>
          <p className="text-xs text-[var(--text-muted)]">YouTube에서 자막을 복사해 아래에 붙여넣으세요</p>
        </div>

        {/* 오른쪽: 북마클릿 버튼 */}
        {/* draggable="true": 마우스로 드래그할 수 있어요 */}
        {/* onClick에서 e.preventDefault(): 클릭 시 실제 이동하지 않게 막아요 */}
        {/*  (드래그해서 북마크 바에 저장하는 게 목적이라서) */}
        {/* cursor-grab: 마우스가 손 모양으로 바뀌어서 "드래그 가능"을 알려줘요 */}
        <a
          href={bookmarkletHref}
          onClick={e => e.preventDefault()}  /* 클릭해도 페이지가 이동하지 않아요 */
          title="북마크 바에 드래그해서 저장 후 YouTube 페이지에서 클릭"
          className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-transparent border border-[var(--border)] rounded-[2px] text-xs text-[var(--text-secondary)] hover:border-[#76b900] hover:text-[var(--text)] transition-colors cursor-grab active:cursor-grabbing select-none"
          draggable="true"   /* 드래그 가능하게 설정 */
        >
          {/* 북마크 아이콘 */}
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          북마클릿 저장
        </a>
      </div>

      {/* ── 사용 방법 안내 박스 ── */}
      {/* bg-[var(--surface)]: 약간 밝은 배경으로 안내박스임을 구분해요 */}
      <div className="text-xs text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-[2px] px-3.5 py-2.5 space-y-1 leading-relaxed">
        <p>
          {/* 굵은 번호 */}
          <span className="text-[var(--text-secondary)] font-bold">1.</span>
          {' '}YouTube 영상 페이지에서{' '}
          <span className="text-[var(--text-secondary)]">「⋯」→「자막 열기」</span> 클릭
        </p>
        <p>
          <span className="text-[var(--text-secondary)] font-bold">2.</span>
          {' '}위의 북마클릿을 북마크 바에 드래그 저장 후 클릭 (또는 전체선택 복사)
        </p>
        <p>
          <span className="text-[var(--text-secondary)] font-bold">3.</span>
          {' '}아래에 붙여넣기
        </p>
      </div>

      {/* ── 자막 입력 텍스트 영역 ── */}
      {/* textarea: 여러 줄을 입력할 수 있는 큰 입력창이에요 */}
      {/* rows={6}: 기본적으로 6줄 높이로 보여요 */}
      {/* resize-y: 사용자가 아래로 드래그해서 높이를 늘릴 수 있어요 */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="여기에 자막을 붙여넣으세요..."
        rows={6}
        className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] focus:outline-none focus:border-[#76b900] text-[var(--text)] placeholder-[var(--text-muted)] text-sm resize-y transition-colors"
      />

      {/* ── 글자 수 표시 ── */}
      {/* value가 있을 때만 표시해요 (빈 입력창에는 안 보여요) */}
      {value && (
        <p className="text-xs text-[var(--text-muted)] text-right">
          {/* toLocaleString(): 숫자를 읽기 쉽게 3자리마다 콤마를 넣어줘요 */}
          {/* 예: 12345 → "12,345" */}
          {value.length.toLocaleString()}자
        </p>
      )}
    </div>
  )
}
