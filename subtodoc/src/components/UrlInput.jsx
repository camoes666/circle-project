export default function UrlInput({ value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
        YouTube URL
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--border)] pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
          </svg>
        </div>
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-[var(--text)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[#76b900] transition-colors"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="지우기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
