import { useState } from 'react'

function parseMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let listBuffer = []

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 mb-3 pl-0">
          {listBuffer.map((item, i) => (
            <li key={i} className="flex gap-2 text-gray-300 text-sm leading-relaxed">
              <span className="text-blue-400 font-bold flex-shrink-0 mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }} />
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
      elements.push(<h1 key={i} className="text-xl font-bold text-white mt-6 mb-2 leading-snug" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2)) }} />)
    } else if (/^## /.test(line)) {
      flushList()
      elements.push(<h2 key={i} className="text-base font-semibold text-gray-100 mt-5 mb-1.5 leading-snug" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(3)) }} />)
    } else if (/^### /.test(line)) {
      flushList()
      elements.push(<h3 key={i} className="text-sm font-semibold text-gray-200 mt-4 mb-1 leading-snug" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(4)) }} />)
    } else if (/^[-*] /.test(line)) {
      listBuffer.push(line.slice(2))
    } else if (/^\d+\. /.test(line)) {
      listBuffer.push(line.replace(/^\d+\. /, ''))
    } else if (line.trim() === '' || line.trim() === '---') {
      flushList()
      if (line.trim() === '---') {
        elements.push(<hr key={i} className="border-gray-700/60 my-4" />)
      }
    } else {
      flushList()
      elements.push(
        <p key={i} className="text-gray-300 text-sm leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />
      )
    }
  })
  flushList()
  return elements
}

function inlineMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-100 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-gray-400 italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-blue-300 bg-gray-800 px-1 rounded text-xs">$1</code>')
}

export default function ResultViewer({ content }) {
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

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/80 bg-gray-900/80">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          변환 결과
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
        <div className="space-y-0.5">
          {parseMarkdown(content)}
        </div>
      </div>
    </div>
  )
}
