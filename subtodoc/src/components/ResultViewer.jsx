import { useState } from 'react'

function inlineMarkdown(text, videoId, format) {
  let result = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--text)] font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[var(--text-secondary)] italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-[#76b900] bg-[var(--surface)] px-1 rounded-[2px] text-xs">$1</code>')

  if (videoId) {
    result = result.replace(/\[(\d{1,2}):(\d{2})\]/g, (_, mm, ss) => {
      const t = parseInt(mm) * 60 + parseInt(ss)
      return `<a href="https://www.youtube.com/watch?v=${videoId}&t=${t}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center font-mono text-xs px-1.5 py-0.5 bg-[var(--surface)] text-[#76b900] hover:text-white rounded-[2px] border border-[#76b900]/40 hover:border-[#76b900] hover:bg-[#76b900] transition-colors">[${mm}:${ss}]</a>`
    })
  }

  if (format === 'linkedin') {
    result = result.replace(/(#[\w가-힣]+)/g, '<span class="text-[#76b900] font-bold">$1</span>')
  }

  return result
}

function parseMarkdown(text, videoId, format) {
  const lines = text.split('\n')
  const elements = []
  let listBuffer = []

  const flushList = () => {
    if (listBuffer.length === 0) return
    elements.push(
      <ul key={`ul-${elements.length}`} className="space-y-1 mb-3 pl-0">
        {listBuffer.map((item, i) => (
          <li key={i} className={`flex gap-2 text-sm leading-relaxed ${item.depth > 0 ? 'ml-5 text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
            <span className={`flex-shrink-0 mt-0.5 ${item.depth > 0 ? 'text-[var(--border)]' : 'text-[#76b900] font-bold'}`}>
              {item.depth > 0 ? '◦' : '▸'}
            </span>
            <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(item.text, videoId, format) }} />
          </li>
        ))}
      </ul>
    )
    listBuffer = []
  }

  lines.forEach((line, i) => {
    if (/^# /.test(line)) {
      flushList()
      elements.push(<h1 key={i} className="text-xl font-bold text-[var(--text)] mt-6 mb-2 leading-tight"
        dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2), videoId, format) }} />)
    } else if (/^## /.test(line)) {
      flushList()
      elements.push(<h2 key={i}
        className={`text-base font-bold text-[var(--text)] mt-5 mb-1.5 leading-tight ${format === 'mindmap' ? 'pl-3 border-l-2 border-[#76b900]' : ''}`}
        dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(3), videoId, format) }} />)
    } else if (/^### /.test(line)) {
      flushList()
      elements.push(<h3 key={i} className="text-sm font-bold text-[var(--text-secondary)] mt-4 mb-1 leading-tight"
        dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(4), videoId, format) }} />)
    } else if (/^ {2,}[-*] /.test(line)) {
      listBuffer.push({ text: line.replace(/^ +[-*] /, ''), depth: 1 })
    } else if (/^[-*] /.test(line)) {
      listBuffer.push({ text: line.slice(2), depth: 0 })
    } else if (/^\d+\. /.test(line)) {
      listBuffer.push({ text: line.replace(/^\d+\. /, ''), depth: 0 })
    } else if (line.trim() === '---') {
      flushList()
      elements.push(<hr key={i} className="border-[var(--border)] my-4" />)
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      elements.push(<p key={i} className="text-[var(--text-secondary)] text-sm leading-relaxed mb-2"
        dangerouslySetInnerHTML={{ __html: inlineMarkdown(line, videoId, format) }} />)
    }
  })
  flushList()
  return elements
}

function parseTweets(content) {
  return content.split(/\n\s*---\s*\n/).map(t => t.trim()).filter(Boolean)
}

function TweetCards({ content }) {
  const tweets = parseTweets(content)
  return (
    <div className="space-y-3">
      {tweets.map((tweet, i) => {
        const len = tweet.length
        const isOver = len > 280
        const isWarn = !isOver && len > 240
        return (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-[2px] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{i + 1} / {tweets.length}</span>
              <span className={`text-xs font-mono font-bold ${isOver ? 'text-[#e52020]' : isWarn ? 'text-[#ef9100]' : 'text-[var(--text-muted)]'}`}>{len} / 280</span>
            </div>
            <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">{tweet}</p>
            <div className="h-0.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min((len / 280) * 100, 100)}%`, backgroundColor: isOver ? '#e52020' : isWarn ? '#ef9100' : '#76b900' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function parseSlides(content) {
  return content.split(/\n\s*---\s*\n/).map(s => s.trim()).filter(Boolean)
    .map((slide, i) => {
      const lines = slide.split('\n')
      const titleLine = lines.find(l => /^#{1,3} /.test(l))
      const title = titleLine ? titleLine.replace(/^#+\s/, '') : `슬라이드 ${i + 1}`
      const bullets = lines.filter(l => /^[-*] /.test(l)).map(l => l.replace(/^[-*] /, ''))
      const rest = lines.filter(l => !(/^#+/.test(l)) && !(/^[-*] /.test(l)) && l.trim())
      return { title, bullets, rest, index: i + 1 }
    })
}

function SlideCards({ content }) {
  const slides = parseSlides(content)
  return (
    <div className="space-y-3">
      {slides.map(slide => (
        <div key={slide.index} className="bg-[var(--surface)] border border-[var(--border)] rounded-[2px] overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 py-2.5 flex items-center gap-3 border-l-2 border-l-[#76b900]">
            <span className="text-xs font-bold font-mono text-[#76b900]">{String(slide.index).padStart(2, '0')}</span>
            <h3 className="text-sm font-bold text-[var(--text)]">{slide.title}</h3>
          </div>
          <div className="px-4 py-3 space-y-1.5">
            {slide.bullets.map((b, i) => (
              <div key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                <span className="text-[#76b900] flex-shrink-0">▸</span>
                <span>{b}</span>
              </div>
            ))}
            {slide.rest.map((line, i) => (
              <p key={`r${i}`} className="text-sm text-[var(--text-muted)]">{line}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ResultViewer({ content, videoId, format }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(content) } catch {
      const ta = document.createElement('textarea')
      ta.value = content; document.body.appendChild(ta); ta.select()
      document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderContent = () => {
    if (format === 'twitter') return <TweetCards content={content} />
    if (format === 'slides')  return <SlideCards content={content} />
    return <div className="space-y-0.5">{parseMarkdown(content, videoId, format)}</div>
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2px] overflow-hidden" style={{ boxShadow: 'rgba(0,0,0,0.15) 0px 0px 5px 0px' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          변환 결과
          {videoId && <span className="ml-1 text-[#76b900]/70 text-xs normal-case font-normal tracking-normal">[MM:SS] 클릭 시 영상 이동</span>}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-bold transition-all ${
            copied
              ? 'bg-[#76b900]/15 text-[#76b900] border border-[#76b900]/60'
              : 'bg-transparent text-[var(--text-secondary)] border border-[var(--border)] hover:border-[#76b900] hover:text-[var(--text)]'
          }`}
        >
          {copied ? (
            <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>복사됨</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>복사</>
          )}
        </button>
      </div>
      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}
