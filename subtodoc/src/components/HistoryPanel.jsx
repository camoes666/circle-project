import { useState } from 'react'
import { FORMATS } from '../services/prompts'

export default function HistoryPanel({ history, onRestore, onRemove, onClear }) {
  const [open, setOpen] = useState(false)

  if (history.length === 0) return null

  return (
    <div className="border border-[var(--border)] rounded-[2px] overflow-hidden animate-fade-in">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
      >
        <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          지난 변환 {history.length}개
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-[var(--border)]/40">
          {history.map(entry => {
            const fmt = FORMATS.find(f => f.id === entry.format)
            const date = new Date(entry.createdAt).toLocaleDateString('ko-KR', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })
            const urlPreview = entry.url
              ? entry.url.replace('https://www.youtube.com/watch?v=', 'youtu.be/').slice(0, 40)
              : '자막 직접 입력'

            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)] transition-colors group">
                {entry.videoId && (
                  <img
                    src={`https://img.youtube.com/vi/${entry.videoId}/default.jpg`}
                    alt=""
                    className="w-14 h-10 object-cover rounded-[2px] flex-shrink-0 bg-[var(--surface)]"
                    loading="lazy"
                  />
                )}
                <button onClick={() => onRestore(entry)} className="flex-1 text-left min-w-0 space-y-0.5">
                  <p className="text-xs text-[var(--text)] truncate">{urlPreview}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {fmt?.label ?? entry.format} · {date}
                    {entry.includeTimestamps && ' · 타임스탬프'}
                    {entry.customInstruction ? ` · "${entry.customInstruction.slice(0, 15)}${entry.customInstruction.length > 15 ? '…' : ''}"` : ''}
                  </p>
                </button>
                <button
                  onClick={() => onRemove(entry.id)}
                  aria-label="삭제"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-[2px] text-[var(--text-muted)] hover:text-[#e52020] transition-all flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )
          })}
          {history.length >= 3 && (
            <button onClick={onClear} className="w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[#e52020] transition-colors">
              전체 삭제
            </button>
          )}
        </div>
      )}
    </div>
  )
}
