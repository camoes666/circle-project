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
      alert('자막이 클립보드에 복사되었습니다! SubToDoc 앱으로 돌아가서 붙여넣어 주세요.');
    }, function(){
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      alert('자막이 클립보드에 복사되었습니다! SubToDoc 앱으로 돌아가서 붙여넣어 주세요.');
    });
  }
})()`

export default function TranscriptPaste({ value, onChange }) {
  const bookmarkletHref = `javascript:${encodeURIComponent(BOOKMARKLET_SRC)}`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          자막 직접 붙여넣기
        </label>
        <a
          href={bookmarkletHref}
          onClick={e => e.preventDefault()}
          onDragStart={() => {}}
          title="이 링크를 북마크 바에 드래그하세요"
          className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 px-2 py-1 rounded transition-colors cursor-grab active:cursor-grabbing select-none"
          draggable="true"
        >
          📋 자막 추출 북마클릿 (드래그해서 저장)
        </a>
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="YouTube 자막을 여기에 붙여넣으세요..."
        rows={6}
        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-gray-100 placeholder-gray-600 text-sm resize-y"
      />

      <details className="text-xs text-gray-400">
        <summary className="cursor-pointer hover:text-gray-300 select-none">
          자막 가져오는 방법 보기
        </summary>
        <ol className="mt-2 space-y-1 pl-4 list-decimal leading-relaxed">
          <li>YouTube에서 해당 영상을 엽니다.</li>
          <li>동영상 아래 <strong className="text-gray-300">「⋯」</strong> 버튼 → <strong className="text-gray-300">「자막 열기」</strong> 클릭</li>
          <li>자막 패널이 열리면 위의 <strong className="text-gray-300">「자막 추출 북마클릿」</strong>을 북마크 바에 드래그해 저장 후 클릭하세요.</li>
          <li>또는 자막 패널에서 언어 선택 후 <strong className="text-gray-300">전체 선택(Ctrl+A)</strong> → <strong className="text-gray-300">복사(Ctrl+C)</strong></li>
          <li>이 텍스트 박스에 <strong className="text-gray-300">붙여넣기(Ctrl+V)</strong></li>
        </ol>
      </details>
    </div>
  )
}
