import { useState } from 'react'

// ── Inline markdown helpers ─────────────────────────────────────────────────

function inlineMarkdown(text, videoId, format) {
  let result = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-100 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-gray-400 italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-blue-300 bg-gray-800 px-1 rounded text-xs">$1</code>')

  // Timestamp links — only when videoId is available
  if (videoId) {
    result = result.replace(/\[(\d{1,2}):(\d{2})\]/g, (_, mm, ss) => {
      const t = parseInt(mm) * 60 + parseInt(ss)
      return `<a href="https://www.youtube.com/watch?v=${videoId}&t=${t}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center font-mono text-xs px-1.5 py-0.5 bg-blue-950/50 text-blue-400 hover:text-blue-300 rounded border border-blue-800/40 hover:border-blue-600/60 transition-colors">[${mm}:${ss}]</a>`
    })
  }

  // LinkedIn hashtag highlight
  if (format === 'linkedin') {
    result = result.replace(/(#[\w가-힣]+)/g,
      '<span class="inline-block text-blue-400 font-medium">$1</span>'
    )
  }

  return result
}

function parseMarkdown(text, videoId, format) {
  const lines = text.split('\n')
  const elements = []
  // listBuffer items: { text, depth }  (depth 0 = top-level, 1 = sub-bullet)
  let listBuffer = []

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1 mb-3 pl-0">
          {listBuffer.map((item, i) => (
            <li key={i}
              className={`flex gap-2 text-sm leading-relaxed ${
                item.depth > 0 ? 'ml-5 text-gray-400' : 'text-gray-300'
              }`}
            >
              <span className={`flex-shrink-0 mt-0.5 ${item.depth > 0 ? 'text-gray-600' : 'text-blue-400 font-bold'}`}>
                {item.depth > 0 ? '◦' : '•'}
              </span>
              <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(item.text, videoId, format) }} />
            </li>
          ))}
        </ul>
      )
      listBuffer = []
    }
  }

  lines.forEach((line, i) => {
    if (/^# /.test(line)) {
      flushList()
      elements.push(
        <h1 key={i} className="text-xl font-bold text-white mt-6 mb-2 leading-snug"
          dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2), videoId, format) }} />
      )
    } else if (/^## /.test(line)) {
      flushList()
      // mindmap: ## gets a subtle left-border accent for visual hierarchy
      const isMindmap = format === 'mindmap'
      elements.push(
        <h2 key={i}
          className={`text-base font-semibold text-gray-100 mt-5 mb-1.5 leading-snug ${
            isMindmap ? 'pl-3 border-l-2 border-blue-500/50' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(3), videoId, format) }} />
      )
    } else if (/^### /.test(line)) {
      flushList()
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-gray-200 mt-4 mb-1 leading-snug"
          dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(4), videoId, format) }} />
      )
    } else if (/^ {2,}[-*] /.test(line)) {
      // indented sub-bullet (2+ spaces then - or *)
      const text = line.replace(/^ +[-*] /, '')
      listBuffer.push({ text, depth: 1 })
    } else if (/^[-*] /.test(line)) {
      listBuffer.push({ text: line.slice(2), depth: 0 })
    } else if (/^\d+\. /.test(line)) {
      listBuffer.push({ text: line.replace(/^\d+\. /, ''), depth: 0 })
    } else if (line.trim() === '---') {
      flushList()
      elements.push(<hr key={i} className="border-gray-700/60 my-4" />)
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={i} className="text-gray-300 text-sm leading-relaxed mb-2"
          dangerouslySetInnerHTML={{ __html: inlineMarkdown(line, videoId, format) }} />
      )
    }
  })
  flushList()
  return elements
}

// ── Twitter thread renderer ─────────────────────────────────────────────────

function parseTweets(content) {
  // Accept "---" with any amount of surrounding whitespace/newlines
  return content
    .split(/\n\s*---\s*\n/)
    .map(t => t.trim())
    .filter(Boolean)
}

function TweetCards({ content }) {
  const tweets = parseTweets(content)
  return (
    <div className="space-y-3">
      {tweets.map((tweet, i) => {
        const charCount = tweet.length
        const isOver = charCount > 280
        const isWarning = !isOver && charCount > 240
        return (
          <div key={i} className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">
                {i + 1} / {tweets.length}
              </span>
              <span className={`text-xs font-mono ${isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-600'}`}>
                {charCount} / 280
              </span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{tweet}</p>
            {/* Character gauge */}
            <div className="h-0.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((charCount / 280) * 100, 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Slide deck renderer ─────────────────────────────────────────────────────

function parseSlides(content) {
  // Accept "---" with any amount of surrounding whitespace/newlines
  return content
    .split(/\n\s*---\s*\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .map((slide, i) => {
      const lines = slide.split('\n')
      const titleLine = lines.find(l => /^#{1,3} /.test(l))
      const title = titleLine ? titleLine.replace(/^#+\s/, '') : `슬라이드 ${i + 1}`
      const bullets = lines
        .filter(l => /^[-*] /.test(l))
        .map(l => l.replace(/^[-*] /, ''))
      const rest = lines
        .filter(l => !(/^#+/.test(l)) && !(/^[-*] /.test(l)) && l.trim())
      return { title, bullets, rest, index: i + 1 }
    })
}

function SlideCards({ content }) {
  const slides = parseSlides(content)
  return (
    <div className="space-y-3">
      {slides.map(slide => (
        <div key={slide.index} className="bg-gray-800/40 border border-gray-700/60 rounded-xl overflow-hidden">
          {/* Slide header */}
          <div className="bg-blue-600/10 border-b border-gray-700/40 px-4 py-2.5 flex items-center gap-2">
            <span className="text-xs text-blue-500 font-mono font-medium">
              {String(slide.index).padStart(2, '0')}
            </span>
            <h3 className="text-sm font-semibold text-gray-100">{slide.title}</h3>
          </div>
          {/* Slide body */}
          <div className="px-4 py-3 space-y-1.5">
            {slide.bullets.map((b, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-blue-400 flex-shrink-0">▸</span>
                <span>{b}</span>
              </div>
            ))}
            {slide.rest.map((line, i) => (
              <p key={`r${i}`} className="text-sm text-gray-400">{line}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ResultViewer({ content, videoId, format }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderContent = () => {
    if (format === 'twitter') return <TweetCards content={content} />
    if (format === 'slides')  return <SlideCards content={content} />
    // mindmap, linkedin, and original 4 formats all use the markdown parser
    return (
      <div className="space-y-0.5">
        {parseMarkdown(content, videoId, format)}
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/80">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          변환 결과
          {videoId && (
            <span className="ml-1 text-blue-500/60 text-xs">[MM:SS] 클릭 시 영상 이동</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            copied
              ? 'bg-green-900/60 text-green-400 border border-green-700/60'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 border border-gray-700/60'
          }`}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              복사됨
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              복사
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}
