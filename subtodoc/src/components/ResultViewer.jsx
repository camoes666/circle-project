/**
 * ════════════════════════════════════════════════════════════
 *  ResultViewer.jsx  —  AI 생성 문서를 예쁘게 보여주는 컴포넌트
 * ════════════════════════════════════════════════════════════
 *
 * AI가 만들어준 마크다운 텍스트를 예쁘게 꾸며서 보여주는 컴포넌트예요.
 *
 * 마크다운이란?
 * → # 이런 기호들을 이용해서 제목, 목록, 강조 등을 표현하는 텍스트 형식이에요.
 *   # 제목 → 큰 제목
 *   ## 소제목 → 중간 크기 제목
 *   - 항목 → 불릿 목록
 *   **굵게** → 굵은 글자
 *   *기울임* → 기울임 글자
 *
 * 형식별 특별 처리:
 * - 일반 형식 (요약, 블로그 등): parseMarkdown으로 마크다운을 예쁘게 렌더링
 * - 트위터 형식: TweetCards로 각 트윗을 카드 형태로 보여줌 (글자수 표시)
 * - 슬라이드 형식: SlideCards로 각 슬라이드를 카드 형태로 보여줌
 *
 * 특별 기능:
 * - 타임스탬프([01:23])를 클릭하면 YouTube 영상의 해당 시점으로 이동해요
 * - LinkedIn 형식에서 #해시태그를 초록색으로 표시해요
 * - 복사 버튼으로 결과를 클립보드에 복사할 수 있어요
 *
 * props:
 * @param {string}      content  - AI가 생성한 마크다운 텍스트
 * @param {string|null} videoId  - YouTube 영상 ID (타임스탬프 링크에 사용)
 * @param {string}      format   - 현재 선택된 형식 ID (렌더링 방식 결정)
 */

// useState: 복사 완료 상태를 기억하는 도구
import { useState } from 'react'

/**
 * inlineMarkdown — 텍스트 안의 마크다운 기호를 HTML로 변환하는 함수
 *
 * 한 줄 안의 인라인 서식을 처리해요:
 * **굵게** → <strong>굵게</strong>
 * *기울임* → <em>기울임</em>
 * `코드` → <code>코드</code>
 * [01:23] → YouTube 타임스탬프 링크
 * #해시태그 → 초록색 텍스트 (LinkedIn 형식에서만)
 *
 * @param {string}      text    - 변환할 텍스트
 * @param {string|null} videoId - YouTube 영상 ID (타임스탬프 링크용)
 * @param {string}      format  - 현재 형식 (LinkedIn인지 확인)
 * @returns {string} - HTML 문자열
 */
function inlineMarkdown(text, videoId, format) {
  let result = text
    // HTML 특수문자를 안전하게 처리해요 (XSS 공격 방지)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // **굵게** → <strong>굵게</strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--text)] font-bold">$1</strong>')
    // *기울임* → <em>기울임</em>
    .replace(/\*(.+?)\*/g, '<em class="text-[var(--text-secondary)] italic">$1</em>')
    // `코드` → <code>코드</code> (초록색 배경)
    .replace(/`(.+?)`/g, '<code class="text-[#76b900] bg-[var(--surface)] px-1 rounded-[2px] text-xs">$1</code>')

  // videoId가 있으면 [MM:SS] 형태의 타임스탬프를 클릭 가능한 링크로 바꿔요
  if (videoId) {
    result = result.replace(/\[(\d{1,2}):(\d{2})\]/g, (_, mm, ss) => {
      // 분:초 → 초로 변환해요 (예: [01:23] → 83초)
      const t = parseInt(mm) * 60 + parseInt(ss)
      // YouTube URL에 &t=83 을 붙이면 해당 시점부터 재생돼요
      return `<a href="https://www.youtube.com/watch?v=${videoId}&t=${t}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center font-mono text-xs px-1.5 py-0.5 bg-[var(--surface)] text-[#76b900] hover:text-white rounded-[2px] border border-[#76b900]/40 hover:border-[#76b900] hover:bg-[#76b900] transition-colors">[${mm}:${ss}]</a>`
    })
  }

  // LinkedIn 형식에서는 #해시태그를 초록색으로 표시해요
  if (format === 'linkedin') {
    // #한글 또는 #영문으로 시작하는 단어를 찾아서 초록색으로 칠해요
    result = result.replace(/(#[\w가-힣]+)/g, '<span class="text-[#76b900] font-bold">$1</span>')
  }

  return result
}

/**
 * parseMarkdown — 마크다운 텍스트를 React 요소 배열로 변환하는 함수
 *
 * 텍스트를 줄별로 읽어서 마크다운 기호에 따라 다른 HTML 요소를 만들어요:
 * # 제목 → <h1>
 * ## 소제목 → <h2>
 * ### 소소제목 → <h3>
 * - 항목 또는 * 항목 → <ul><li>
 * 1. 항목 → <ul><li> (번호 목록도 불릿으로 처리)
 * --- → <hr> (수평선)
 * 빈 줄 → 단락 구분
 * 일반 텍스트 → <p>
 *
 * @param {string}      text    - 마크다운 텍스트
 * @param {string|null} videoId - YouTube 영상 ID
 * @param {string}      format  - 현재 형식
 * @returns {Array} - React JSX 요소 배열
 */
function parseMarkdown(text, videoId, format) {
  const lines = text.split('\n')   // 텍스트를 줄 단위로 나눠요
  const elements = []               // 만들어진 React 요소들을 담을 배열
  let listBuffer = []               // 연속된 목록 항목들을 임시로 모아두는 버퍼

  /**
   * flushList — 버퍼에 쌓인 목록 항목들을 <ul> 요소로 만드는 함수
   *
   * 목록 항목들이 여러 줄 있을 때 한 번에 <ul>로 감싸서 추가해요.
   * 비어있으면 아무것도 안 해요.
   */
  const flushList = () => {
    if (listBuffer.length === 0) return
    elements.push(
      <ul key={`ul-${elements.length}`} className="space-y-1 mb-3 pl-0">
        {listBuffer.map((item, i) => (
          <li key={i} className={`flex gap-2 text-sm leading-relaxed ${item.depth > 0 ? 'ml-5 text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
            {/* depth가 0이면 ▸ (초록 굵은 화살표), 1이면 ◦ (회색 원) */}
            <span className={`flex-shrink-0 mt-0.5 ${item.depth > 0 ? 'text-[var(--border)]' : 'text-[#76b900] font-bold'}`}>
              {item.depth > 0 ? '◦' : '▸'}
            </span>
            {/* dangerouslySetInnerHTML: HTML 문자열을 직접 렌더링해요 */}
            {/* inlineMarkdown으로 처리한 결과가 HTML이기 때문에 이걸 써요 */}
            <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(item.text, videoId, format) }} />
          </li>
        ))}
      </ul>
    )
    listBuffer = []  // 버퍼를 비워요
  }

  // 각 줄을 순서대로 처리해요
  lines.forEach((line, i) => {
    if (/^# /.test(line)) {
      // # 로 시작 → 가장 큰 제목 <h1>
      flushList()  // 이전 목록 처리 먼저
      elements.push(<h1 key={i} className="text-xl font-bold text-[var(--text)] mt-6 mb-2 leading-tight"
        dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2), videoId, format) }} />)
        // line.slice(2): "# " 두 글자를 잘라내고 제목 텍스트만 써요

    } else if (/^## /.test(line)) {
      // ## 로 시작 → 중간 크기 제목 <h2>
      flushList()
      elements.push(<h2 key={i}
        // 마인드맵 형식에서는 왼쪽에 초록 선을 추가해서 계층 구조를 보여줘요
        className={`text-base font-bold text-[var(--text)] mt-5 mb-1.5 leading-tight ${format === 'mindmap' ? 'pl-3 border-l-2 border-[#76b900]' : ''}`}
        dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(3), videoId, format) }} />)

    } else if (/^### /.test(line)) {
      // ### 로 시작 → 작은 제목 <h3>
      flushList()
      elements.push(<h3 key={i} className="text-sm font-bold text-[var(--text-secondary)] mt-4 mb-1 leading-tight"
        dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(4), videoId, format) }} />)

    } else if (/^ {2,}[-*] /.test(line)) {
      // 들여쓰기(2칸 이상)된 - 또는 * 로 시작 → 2단계 목록 항목 (depth: 1)
      listBuffer.push({ text: line.replace(/^ +[-*] /, ''), depth: 1 })

    } else if (/^[-*] /.test(line)) {
      // - 또는 * 로 시작 → 1단계 목록 항목 (depth: 0)
      listBuffer.push({ text: line.slice(2), depth: 0 })

    } else if (/^\d+\. /.test(line)) {
      // "1. " "2. " 같은 번호 목록 → 불릿 목록으로 처리해요
      listBuffer.push({ text: line.replace(/^\d+\. /, ''), depth: 0 })

    } else if (line.trim() === '---') {
      // "---" → 수평선 <hr>
      flushList()
      elements.push(<hr key={i} className="border-[var(--border)] my-4" />)

    } else if (line.trim() === '') {
      // 빈 줄 → 목록 버퍼를 비워요 (단락 구분)
      flushList()

    } else {
      // 일반 텍스트 → 단락 <p>
      flushList()
      elements.push(<p key={i} className="text-[var(--text-secondary)] text-sm leading-relaxed mb-2"
        dangerouslySetInnerHTML={{ __html: inlineMarkdown(line, videoId, format) }} />)
    }
  })

  // 마지막에 남은 목록 항목들도 처리해요
  flushList()
  return elements
}

/**
 * parseTweets — "---" 구분자로 트윗들을 배열로 나누는 함수
 *
 * AI가 만든 트위터 형식 텍스트:
 * "첫 번째 트윗\n\n---\n\n두 번째 트윗\n\n---\n\n세 번째 트윗"
 *
 * → ["첫 번째 트윗", "두 번째 트윗", "세 번째 트윗"]
 *
 * @param {string} content - 트위터 형식 텍스트
 * @returns {string[]} - 각 트윗 텍스트 배열
 */
function parseTweets(content) {
  return content.split(/\n\s*---\s*\n/).map(t => t.trim()).filter(Boolean)
}

/**
 * TweetCards — 트윗들을 카드 형태로 보여주는 컴포넌트
 *
 * 각 트윗마다 카드를 만들어서:
 * - 트윗 번호 (N / 전체개수)
 * - 글자수 카운터 (280자 이내여야 해요)
 * - 진행 막대 (글자수에 따라 초록→주황→빨간색으로 변해요)
 *
 * @param {string} content - 트위터 형식 텍스트
 */
function TweetCards({ content }) {
  const tweets = parseTweets(content)

  return (
    <div className="space-y-3">
      {tweets.map((tweet, i) => {
        const len = tweet.length           // 이 트윗의 글자수
        const isOver = len > 280           // 280자 초과 여부
        const isWarn = !isOver && len > 240 // 240~280자: 경고 상태

        return (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-[2px] p-4 space-y-2">

            {/* 카드 상단: 번호 + 글자수 */}
            <div className="flex items-center justify-between">
              {/* 트윗 번호 (예: "1 / 5") */}
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{i + 1} / {tweets.length}</span>

              {/* 글자수 카운터 (초과: 빨강, 경고: 주황, 정상: 회색) */}
              <span className={`text-xs font-mono font-bold ${isOver ? 'text-[#e52020]' : isWarn ? 'text-[#ef9100]' : 'text-[var(--text-muted)]'}`}>
                {len} / 280
              </span>
            </div>

            {/* 트윗 본문 */}
            {/* whitespace-pre-wrap: 줄바꿈을 그대로 유지해요 */}
            <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">{tweet}</p>

            {/* 글자수 진행 막대 */}
            <div className="h-0.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{
                  // 글자수에 비례해서 너비를 계산해요 (최대 100%)
                  width: `${Math.min((len / 280) * 100, 100)}%`,
                  // 상태에 따라 색깔이 달라져요
                  backgroundColor: isOver ? '#e52020' : isWarn ? '#ef9100' : '#76b900'
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * parseSlides — "---" 구분자로 슬라이드들을 분석하는 함수
 *
 * 슬라이드 형식 텍스트를 파싱해서 각 슬라이드의
 * 제목(title), 불릿(bullets), 기타 텍스트(rest)를 추출해요.
 *
 * @param {string} content - 슬라이드 형식 텍스트
 * @returns {Array} - { title, bullets, rest, index } 객체 배열
 */
function parseSlides(content) {
  return content.split(/\n\s*---\s*\n/).map(s => s.trim()).filter(Boolean)
    .map((slide, i) => {
      const lines = slide.split('\n')

      // 제목 줄 찾기 (# 또는 ## 로 시작하는 줄)
      const titleLine = lines.find(l => /^#{1,3} /.test(l))
      const title = titleLine ? titleLine.replace(/^#+\s/, '') : `슬라이드 ${i + 1}`

      // 불릿 항목들 추출 (- 또는 * 로 시작하는 줄)
      const bullets = lines.filter(l => /^[-*] /.test(l)).map(l => l.replace(/^[-*] /, ''))

      // 제목도 불릿도 아닌 일반 텍스트 줄들
      const rest = lines.filter(l => !(/^#+/.test(l)) && !(/^[-*] /.test(l)) && l.trim())

      return { title, bullets, rest, index: i + 1 }
    })
}

/**
 * SlideCards — 슬라이드들을 카드 형태로 보여주는 컴포넌트
 *
 * 각 슬라이드마다 카드를 만들어서:
 * - 슬라이드 번호 (01, 02, ...)
 * - 슬라이드 제목
 * - 불릿 포인트 목록
 * - 기타 텍스트
 *
 * @param {string} content - 슬라이드 형식 텍스트
 */
function SlideCards({ content }) {
  const slides = parseSlides(content)

  return (
    <div className="space-y-3">
      {slides.map(slide => (
        <div key={slide.index} className="bg-[var(--surface)] border border-[var(--border)] rounded-[2px] overflow-hidden">

          {/* 카드 헤더: 슬라이드 번호 + 제목 */}
          {/* border-l-2 border-l-[#76b900]: 왼쪽에 초록 세로 선 */}
          <div className="border-b border-[var(--border)] px-4 py-2.5 flex items-center gap-3 border-l-2 border-l-[#76b900]">
            {/* 슬라이드 번호 (두 자리로 표시: 01, 02, ...) */}
            <span className="text-xs font-bold font-mono text-[#76b900]">{String(slide.index).padStart(2, '0')}</span>
            <h3 className="text-sm font-bold text-[var(--text)]">{slide.title}</h3>
          </div>

          {/* 카드 본문: 불릿 항목들과 기타 텍스트 */}
          <div className="px-4 py-3 space-y-1.5">
            {/* 불릿 항목들 */}
            {slide.bullets.map((b, i) => (
              <div key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                <span className="text-[#76b900] flex-shrink-0">▸</span>
                <span>{b}</span>
              </div>
            ))}
            {/* 기타 텍스트 */}
            {slide.rest.map((line, i) => (
              <p key={`r${i}`} className="text-sm text-[var(--text-muted)]">{line}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * ResultViewer — 메인 결과 뷰어 컴포넌트
 *
 * @param {string}      content  - AI가 생성한 마크다운 텍스트
 * @param {string|null} videoId  - YouTube 영상 ID
 * @param {string}      format   - 현재 선택된 형식 ID
 */
export default function ResultViewer({ content, videoId, format }) {
  // copied: 복사 버튼을 눌렀을 때 "복사됨!" 상태를 2초간 표시하기 위한 상태
  const [copied, setCopied] = useState(false)

  /**
   * handleCopy — 텍스트를 클립보드에 복사하는 함수
   *
   * 현대 브라우저: navigator.clipboard.writeText 사용
   * 구형 브라우저: textarea를 만들어서 execCommand('copy') 사용
   * (두 방법 모두 지원해서 어떤 환경에서도 동작해요)
   */
  const handleCopy = async () => {
    try {
      // 최신 클립보드 API 시도
      await navigator.clipboard.writeText(content)
    } catch {
      // 실패하면 구형 방법으로 복사해요
      const ta = document.createElement('textarea')
      ta.value = content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }

    // 복사 완료 표시 (2초 후 원래대로)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /**
   * renderContent — 형식에 따라 다른 렌더러를 선택하는 함수
   *
   * twitter → TweetCards 컴포넌트
   * slides  → SlideCards 컴포넌트
   * 나머지  → parseMarkdown 함수
   */
  const renderContent = () => {
    if (format === 'twitter') return <TweetCards content={content} />
    if (format === 'slides')  return <SlideCards content={content} />
    // 기본: 마크다운 파서로 처리
    return <div className="space-y-0.5">{parseMarkdown(content, videoId, format)}</div>
  }

  return (
    // 전체 결과 박스
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2px] overflow-hidden" style={{ boxShadow: 'rgba(0,0,0,0.15) 0px 0px 5px 0px' }}>

      {/* ── 상단 헤더: 제목 + 복사 버튼 ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">

        {/* 왼쪽: 문서 아이콘 + "변환 결과" 텍스트 */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          변환 결과
          {/* videoId가 있으면 타임스탬프 클릭 안내를 보여줘요 */}
          {videoId && <span className="ml-1 text-[#76b900]/70 text-xs normal-case font-normal tracking-normal">[MM:SS] 클릭 시 영상 이동</span>}
        </div>

        {/* 오른쪽: 복사 버튼 */}
        {/* 복사됐으면 초록색 "복사됨" 표시, 아니면 기본 "복사" 버튼 */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-bold transition-all ${
            copied
              ? 'bg-[#76b900]/15 text-[#76b900] border border-[#76b900]/60'  // 복사 완료 상태
              : 'bg-transparent text-[var(--text-secondary)] border border-[var(--border)] hover:border-[#76b900] hover:text-[var(--text)]'  // 기본 상태
          }`}
        >
          {copied ? (
            // 복사 완료: 체크마크 아이콘 + "복사됨"
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              복사됨
            </>
          ) : (
            // 기본: 복사 아이콘 + "복사"
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              복사
            </>
          )}
        </button>
      </div>

      {/* ── 실제 내용 영역 ── */}
      {/* max-h-[60vh]: 최대 높이를 화면 높이의 60%로 제한해요 */}
      {/* overflow-y-auto: 내용이 많으면 스크롤할 수 있어요 */}
      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}
