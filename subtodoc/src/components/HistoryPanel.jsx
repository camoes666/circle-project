/**
 * ════════════════════════════════════════════════════════════
 *  HistoryPanel.jsx  —  이전 변환 기록 패널 컴포넌트
 * ════════════════════════════════════════════════════════════
 *
 * 이전에 변환했던 기록들을 보여주는 접이식 패널이에요.
 * 마치 인터넷 방문 기록처럼 이전에 했던 작업을 다시 볼 수 있어요.
 *
 * 기능:
 * 1. 클릭하면 목록이 펼쳐지고 다시 클릭하면 접혀요
 * 2. 각 기록에는 영상 썸네일, URL, 형식, 날짜가 보여요
 * 3. 기록을 클릭하면 그 결과가 다시 화면에 나타나요 (복원)
 * 4. 마우스를 올리면 X 버튼이 나타나서 개별 기록을 삭제할 수 있어요
 * 5. 3개 이상이면 "전체 삭제" 버튼이 보여요
 *
 * props (부모 컴포넌트에서 받는 데이터):
 * @param {Array}    history    - 이전 변환 기록 목록 (각 기록은 객체)
 * @param {function} onRestore - 기록을 클릭했을 때 결과를 복원하는 함수
 * @param {function} onRemove  - 개별 기록을 삭제하는 함수
 * @param {function} onClear   - 모든 기록을 삭제하는 함수
 */

// useState: 패널이 열려있는지(open) 상태를 기억하는 도구
import { useState } from 'react'

// FORMATS: 형식 이름(요약, 블로그 등)을 찾기 위해 가져와요
import { FORMATS } from '../services/prompts'

/**
 * HistoryPanel — 이전 변환 기록 패널
 */
export default function HistoryPanel({ history, onRestore, onRemove, onClear }) {
  // open: 패널이 열려있는지(true) 접혀있는지(false) 상태
  const [open, setOpen] = useState(false)

  // 기록이 하나도 없으면 패널 자체를 보여주지 않아요
  // null을 반환하면 React가 아무것도 그리지 않아요
  if (history.length === 0) return null

  return (
    // 패널 전체를 감싸는 박스
    // animate-fade-in: 처음 기록이 생길 때 부드럽게 나타나는 애니메이션
    <div className="border border-[var(--border)] rounded-[2px] overflow-hidden animate-fade-in">

      {/* ── 패널 헤더 (클릭하면 열고 닫아요) ── */}
      <button
        // 클릭하면 현재 상태를 반전시켜요 (true↔false)
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
      >
        {/* 왼쪽: 시계 아이콘 + "지난 변환 N개" 텍스트 */}
        <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
          {/* 시계 아이콘 */}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          지난 변환 {history.length}개
        </span>

        {/* 오른쪽: 화살표 아이콘 (열리면 위를 향하게 180도 회전) */}
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* ── 기록 목록 (open이 true일 때만 보여요) ── */}
      {open && (
        // divide-y: 기록들 사이에 구분선을 그어줘요
        <div className="divide-y divide-[var(--border)]/40">

          {/* 각 기록을 하나씩 그려요 */}
          {history.map(entry => {
            // 형식 ID로 형식 이름을 찾아요 (예: 'summary' → '요약')
            const fmt = FORMATS.find(f => f.id === entry.format)

            // 날짜를 한국어 형식으로 변환해요
            // 예: "2024. 3. 15. 오전 10:30"
            const date = new Date(entry.createdAt).toLocaleDateString('ko-KR', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })

            // URL을 짧게 표시해요 (너무 길면 잘라내요)
            const urlPreview = entry.url
              // https://www.youtube.com/watch?v=XXX → youtu.be/XXX 로 줄여요
              ? entry.url.replace('https://www.youtube.com/watch?v=', 'youtu.be/').slice(0, 40)
              : '자막 직접 입력'  // URL이 없으면 (자막 직접 입력 탭으로 변환한 경우)

            return (
              // 각 기록 행 — group: 마우스 올리면 X 버튼이 보이게 하는 그룹
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)] transition-colors group">

                {/* 영상 썸네일 이미지 (videoId가 있을 때만 보여요) */}
                {entry.videoId && (
                  <img
                    // YouTube가 제공하는 썸네일 URL 형식이에요
                    src={`https://img.youtube.com/vi/${entry.videoId}/default.jpg`}
                    alt=""
                    className="w-14 h-10 object-cover rounded-[2px] flex-shrink-0 bg-[var(--surface)]"
                    loading="lazy"  /* 화면에 보일 때만 로드 (성능 최적화) */
                  />
                )}

                {/* 기록 클릭 버튼 — 클릭하면 이 기록의 결과를 복원해요 */}
                <button onClick={() => onRestore(entry)} className="flex-1 text-left min-w-0 space-y-0.5">
                  {/* URL 또는 "자막 직접 입력" 표시 */}
                  {/* truncate: 너무 길면 "..."으로 잘라요 */}
                  <p className="text-xs text-[var(--text)] truncate">{urlPreview}</p>

                  {/* 형식 이름 + 날짜 + 타임스탬프 여부 + 지시사항 미리보기 */}
                  <p className="text-xs text-[var(--text-muted)]">
                    {fmt?.label ?? entry.format} · {date}
                    {entry.includeTimestamps && ' · 타임스탬프'}
                    {/* 지시사항이 있으면 15글자까지만 보여줘요 */}
                    {entry.customInstruction
                      ? ` · "${entry.customInstruction.slice(0, 15)}${entry.customInstruction.length > 15 ? '…' : ''}"`
                      : ''}
                  </p>
                </button>

                {/* 삭제 버튼 (X) — 마우스를 올렸을 때만 보여요 */}
                {/* opacity-0: 평소엔 투명 (안 보임) */}
                {/* group-hover:opacity-100: 부모(group)에 마우스 올리면 보임 */}
                <button
                  // 이 기록의 id로 삭제 요청
                  onClick={() => onRemove(entry.id)}
                  aria-label="삭제"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-[2px] text-[var(--text-muted)] hover:text-[#e52020] transition-all flex-shrink-0"
                >
                  {/* X 아이콘 */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )
          })}

          {/* "전체 삭제" 버튼 — 기록이 3개 이상일 때만 보여요 */}
          {history.length >= 3 && (
            <button
              onClick={onClear}
              className="w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[#e52020] transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
      )}
    </div>
  )
}
