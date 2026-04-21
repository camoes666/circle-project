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

export default function TranscriptPaste({ value, onChange }) {
  const bookmarkletHref = `javascript:${encodeURIComponent(BOOKMARKLET_SRC)}`

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-[var(--text)]">자막 직접 붙여넣기</p>
          <p className="text-xs text-[var(--text-muted)]">YouTube에서 자막을 복사해 아래에 붙여넣으세요</p>
        </div>
        <a
          href={bookmarkletHref}
          onClick={e => e.preventDefault()}
          title="북마크 바에 드래그해서 저장 후 YouTube 페이지에서 클릭"
          className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-transparent border border-[var(--border)] rounded-[2px] text-xs text-[var(--text-secondary)] hover:border-[#76b900] hover:text-[var(--text)] transition-colors cursor-grab active:cursor-grabbing select-none"
          draggable="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          북마클릿 저장
        </a>
      </div>

      <div className="text-xs text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-[2px] px-3.5 py-2.5 space-y-1 leading-relaxed">
        <p><span className="text-[var(--text-secondary)] font-bold">1.</span> YouTube 영상 페이지에서 <span className="text-[var(--text-secondary)]">「⋯」→「자막 열기」</span> 클릭</p>
        <p><span className="text-[var(--text-secondary)] font-bold">2.</span> 위의 북마클릿을 북마크 바에 드래그 저장 후 클릭 (또는 전체선택 복사)</p>
        <p><span className="text-[var(--text-secondary)] font-bold">3.</span> 아래에 붙여넣기</p>
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="여기에 자막을 붙여넣으세요..."
        rows={6}
        className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] focus:outline-none focus:border-[#76b900] text-[var(--text)] placeholder-[var(--text-muted)] text-sm resize-y transition-colors"
      />

      {value && (
        <p className="text-xs text-[var(--text-muted)] text-right">
          {value.length.toLocaleString()}자
        </p>
      )}
    </div>
  )
}
