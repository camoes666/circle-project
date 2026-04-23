/**
 * ════════════════════════════════════════════════════════════
 *  ExportButtons.jsx  —  문서 내보내기(저장) 버튼 컴포넌트
 * ════════════════════════════════════════════════════════════
 *
 * AI가 만들어준 문서를 파일로 저장할 수 있는 버튼 두 개를 보여줘요.
 *
 * 버튼 종류:
 * 1. .md 다운로드 — 마크다운 파일로 저장 (Notion, GitHub 등에서 사용 가능)
 * 2. PDF 저장 — PDF 파일로 저장 (출력하거나 공유할 때 편리)
 *
 * 실제 저장 기능은 export.js 서비스 파일에서 처리해요.
 * 이 컴포넌트는 버튼 화면만 담당하고,
 * 버튼을 클릭하면 export.js의 함수를 호출해요.
 *
 * props (부모 컴포넌트에서 받는 데이터):
 * @param {string} content - 저장할 문서 텍스트 (AI가 생성한 내용)
 */

// export.js에서 파일 저장 함수들을 가져와요
import { downloadMarkdown, downloadPdf } from '../services/export'

/**
 * ExportButtons — 내보내기 버튼 컴포넌트
 *
 * @param {string} content - AI가 만든 문서 텍스트
 */
export default function ExportButtons({ content }) {
  return (
    // 두 버튼을 가로로 나란히 배치하는 컨테이너
    // flex: 가로 배치, gap-2: 버튼 사이 간격 2단위
    <div className="flex gap-2">

      {/* ── 마크다운(.md) 다운로드 버튼 ── */}
      <button
        // 클릭하면 downloadMarkdown 함수를 호출해서 .md 파일을 저장해요
        onClick={() => downloadMarkdown(content)}
        // flex-1: 두 버튼이 균등하게 너비를 나눠가져요
        // bg-transparent: 배경 없음 (투명)
        // border: 테두리만 있는 버튼
        // hover:border-[#76b900]: 마우스 올리면 테두리가 초록색으로 바뀌어요
        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-transparent border border-[var(--border)] rounded-[2px] text-sm font-bold text-[var(--text-secondary)] hover:border-[#76b900] hover:text-[var(--text)] transition-colors"
      >
        {/* 다운로드 화살표 아이콘 (아래 방향) */}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* 위에서 아래로 향하는 화살표 */}
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        .md 다운로드
      </button>

      {/* ── PDF 저장 버튼 ── */}
      <button
        // 클릭하면 downloadPdf 함수를 호출해서 PDF 파일을 저장해요
        onClick={() => downloadPdf(content)}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-transparent border border-[var(--border)] rounded-[2px] text-sm font-bold text-[var(--text-secondary)] hover:border-[#76b900] hover:text-[var(--text)] transition-colors"
      >
        {/* 문서 아이콘 */}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* 문서 모양 (오른쪽 위 모서리가 접힌 종이) */}
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          {/* 문서 안의 선들 */}
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        PDF 저장
      </button>
    </div>
  )
}
