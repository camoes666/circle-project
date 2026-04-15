import { useState } from 'react'
import { copyToClipboard, downloadMarkdown, downloadPdf } from '../services/export'

export default function ExportButtons({ content }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={handleCopy}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
      >
        {copied ? '복사됨!' : '클립보드 복사'}
      </button>
      <button
        onClick={() => downloadMarkdown(content)}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
      >
        .md 다운로드
      </button>
      <button
        onClick={() => downloadPdf(content)}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
      >
        PDF
      </button>
    </div>
  )
}
