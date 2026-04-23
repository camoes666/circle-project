/**
 * ════════════════════════════════════════════════════════════
 *  App.jsx  —  프로그램의 메인 화면 (가장 중요한 파일!)
 * ════════════════════════════════════════════════════════════
 *
 * 이 파일은 SubToDoc 앱의 심장이에요.
 * 모든 컴포넌트(화면 조각)들을 한 곳에 모아서
 * 전체 화면을 구성하고, 앱의 모든 동작을 관리해요.
 *
 * 앱의 전체 흐름:
 * 1. 사용자가 YouTube URL을 입력하거나 자막을 직접 붙여넣어요
 * 2. 어떤 형식으로 변환할지 선택해요 (요약, 블로그, 트위터 등)
 * 3. "변환하기" 버튼을 클릭해요
 * 4. 자막을 서버에서 가져와요 (자체 서버, Supadata 등)
 * 5. AI에게 자막과 지시문을 보내요
 * 6. AI가 만든 문서를 화면에 보여줘요
 * 7. 파일로 저장하거나 복사할 수 있어요
 *
 * 화면 구조:
 * ┌─────────────────────────────────────┐
 * │  🟩 상단 초록 선 (NVIDIA 스타일)      │
 * │  S SubToDoc        🌙 ⚙️             │  ← 헤더 (고정)
 * ├─────────────────────────────────────┤
 * │  [YouTube URL] [자막 붙여넣기] 탭     │
 * │  URL 입력창 / 영상 미리보기            │
 * │  자막: [자체서버] [Supadata] [로컬]    │  ← ProviderBar
 * │  AI:   [Groq] [OpenAI] [Gemini]      │
 * │  ─────────────────────────────────   │
 * │  문서 형식 선택 (8가지)               │
 * │  [변환하기] 버튼                      │
 * ├─────────────────────────────────────┤
 * │  변환 결과 (ResultViewer)             │
 * │  [.md 다운로드] [PDF 저장] 버튼        │
 * ├─────────────────────────────────────┤
 * │  지난 변환 기록 (HistoryPanel)         │
 * └─────────────────────────────────────┘
 *
 * 설정 창(⚙️): 별도 모달로 떠요
 */

// React 기본 도구들을 가져와요
import { useState, useMemo, useEffect } from 'react'
// useState: 값을 기억하고 바꿀 수 있게 해줘요
// useMemo: 계산 결과를 기억해두고 불필요한 재계산을 막아요
// useEffect: 값이 바뀔 때 특정 동작을 실행해요

// ── 컴포넌트들 (화면 조각들) ──
import UrlInput from './components/UrlInput'               // YouTube URL 입력창
import FormatSelector from './components/FormatSelector'   // 문서 형식 선택
import ResultViewer from './components/ResultViewer'       // 결과 표시
import ExportButtons from './components/ExportButtons'     // 파일 저장 버튼
import SettingsModal from './components/SettingsModal'     // 설정 창
import TranscriptPaste from './components/TranscriptPaste' // 자막 직접 입력
import VideoPreview from './components/VideoPreview'       // 영상 미리보기
import HistoryPanel from './components/HistoryPanel'       // 변환 기록
import ProviderBar from './components/ProviderBar'         // 자막소스&AI 선택

// ── 훅들 (데이터 관리 도구들) ──
import { useSettings } from './hooks/useSettings'   // 앱 설정 관리
import { useHistory } from './hooks/useHistory'     // 변환 기록 관리

// ── 서비스들 (실제 작업을 하는 함수들) ──
import { extractVideoId, fetchTranscript } from './services/transcript' // 자막 가져오기
import { buildPrompt } from './services/prompts'                         // AI 지시문 만들기
import { generateDocument } from './services/ai'                         // AI 문서 생성

/**
 * App — 메인 앱 컴포넌트
 *
 * React 앱에서 가장 높은 위치의 컴포넌트예요.
 * 모든 상태(state)와 로직이 여기에 있고,
 * 필요한 데이터를 하위 컴포넌트들에게 내려줘요.
 */
export default function App() {
  // ── 설정 & 기록 관리 ──
  // useSettings: API 키, 언어, 자막 소스 등의 설정을 관리해요
  const { settings, updateSettings } = useSettings()
  // useHistory: 이전 변환 기록을 관리해요
  const { history, addEntry, removeEntry, clearHistory } = useHistory()

  // ── 테마(다크/라이트 모드) ──
  // localStorage에서 이전에 선택한 테마를 불러와요 (없으면 'dark')
  const [theme, setTheme] = useState(() => localStorage.getItem('subtodoc_theme') || 'dark')

  // theme이 바뀔 때마다 실행되는 효과
  useEffect(() => {
    // HTML 최상위 요소에 data-theme 속성을 설정해요
    // → index.css의 [data-theme="dark"] 또는 [data-theme="light"] 스타일이 적용돼요
    document.documentElement.setAttribute('data-theme', theme)
    // 선택한 테마를 localStorage에 저장해서 다음에 열어도 기억해요
    localStorage.setItem('subtodoc_theme', theme)
  }, [theme])

  /**
   * toggleTheme — 다크/라이트 모드를 전환하는 함수
   * 현재 테마가 'dark'면 'light'로, 'light'면 'dark'로 바꿔요
   */
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // ── 주요 UI 상태들 ──
  const [url, setUrl] = useState('')            // YouTube URL 입력값
  const [format, setFormat] = useState('summary') // 선택된 문서 형식 (기본: 요약)
  const [result, setResult] = useState('')      // AI가 생성한 결과 텍스트
  const [loading, setLoading] = useState(false)           // 변환 중인지 여부 (로딩 스피너 제어)
  const [loadingStatus, setLoadingStatus] = useState('변환 중...') // 로딩 중 표시할 상태 메시지
  const [error, setError] = useState('')        // 오류 메시지
  const [showSettings, setShowSettings] = useState(false) // 설정 창 표시 여부
  const [activeTab, setActiveTab] = useState('url')       // 현재 탭 ('url' 또는 'paste')
  const [manualTranscript, setManualTranscript] = useState('') // 직접 입력한 자막

  // ── v2에서 추가된 옵션들 ──
  const [includeTimestamps, setIncludeTimestamps] = useState(false) // 타임스탬프 포함 여부
  const [customInstruction, setCustomInstruction] = useState('')    // 사용자 직접 지시사항
  const [showCustomInstruction, setShowCustomInstruction] = useState(false) // 지시사항 입력창 표시 여부

  /**
   * videoId — URL에서 추출한 YouTube 영상 ID
   *
   * useMemo: url이 바뀔 때만 다시 계산해요.
   * url이 안 바뀌면 이전에 계산한 결과를 재사용해서 성능을 절약해요.
   * → 마치 수학 시험에서 같은 계산을 두 번 하지 않는 것처럼요.
   */
  const videoId = useMemo(() => extractVideoId(url), [url])

  /**
   * handleConvert — "변환하기" 버튼을 눌렀을 때 실행되는 핵심 함수
   *
   * 전체 변환 과정을 담당해요:
   * 1. 이전 결과/오류를 초기화해요
   * 2. 자막을 가져와요 (URL 탭: 서버에서, 붙여넣기 탭: 직접 입력)
   * 3. AI 지시문을 만들어요
   * 4. AI에게 보내서 문서를 받아요
   * 5. 결과를 화면에 표시하고 기록에 저장해요
   *
   * async/await: 인터넷 통신같은 시간이 걸리는 작업을 기다려요.
   * try/catch: 오류가 생겨도 프로그램이 멈추지 않게 잡아줘요.
   */
  const handleConvert = async () => {
    // 이전 오류 메시지와 결과를 지워요
    setError('')
    setResult('')
    // 로딩 상태로 전환 → 변환하기 버튼이 스피너로 바뀌어요
    setLoading(true)
    setLoadingStatus('자막 가져오는 중...')

    try {
      let transcript // 가져온 자막 텍스트를 담을 변수

      if (activeTab === 'paste') {
        // ── 자막 직접 붙여넣기 탭 ──
        // 입력한 자막이 없으면 아무것도 하지 않아요
        if (!manualTranscript.trim()) { setLoading(false); return }
        transcript = manualTranscript.trim()

      } else {
        // ── YouTube URL 탭 ──
        // videoId가 없으면 (잘못된 URL이면) 오류를 표시하고 종료해요
        if (!videoId) {
          setError('유효한 YouTube URL을 입력해주세요.')
          setLoading(false)
          return
        }

        try {
          // fetchTranscript: 선택된 자막 소스에서 자막을 가져와요
          // settings: API 키, 자막 소스 선택 등의 설정 전달
          // url: 자체 서버가 YouTube URL 전체를 필요로 해서 전달
          // withTimestamps: 타임스탬프 포함 여부 전달
          transcript = await fetchTranscript(videoId, {
            ...settings,
            url,
            withTimestamps: includeTimestamps,
          })
        } catch (e) {
          // 자막 가져오기 실패 시 오류 표시
          setError(e.message)

          // ⚠️ 중요: 오류 종류에 따라 탭 전환 여부를 결정해요
          // 자막이 실제로 "없을 때"만 붙여넣기 탭으로 이동해요.
          // 네트워크 오류, CORS 오류 같은 서버 문제는 탭을 바꾸지 않아요.
          // (서버 오류인데 탭을 바꾸면 사용자가 혼란스러울 수 있어요)
          const isNoCaption =
            e.message.includes('자막이 없') ||      // "이 영상에는 자막이 없습니다"
            e.message.includes('자막이 비활성') ||  // "자막이 비활성화되었거나..."
            e.message.includes('자막을 찾')          // "자막을 찾을 수 없습니다"
          if (isNoCaption) setActiveTab('paste')

          setLoading(false)
          return
        }
      }

      // ── 전문 형식: AI 없이 자막 원문을 바로 표시해요 ──
      // AI 호출이 필요 없어서 buildPrompt와 generateDocument를 건너뛰어요.
      if (format === 'raw') {
        setResult(transcript)
        addEntry({
          url:               activeTab === 'url' ? url : '',
          videoId:           activeTab === 'url' ? (videoId ?? null) : null,
          format,
          result:            transcript,
          customInstruction: '',
          includeTimestamps,
        })
        return  // finally에서 setLoading(false)가 실행돼요
      }

      // AI 지시문을 만들어요
      // buildPrompt: 선택한 형식, 언어, 타임스탬프 옵션, 사용자 지시사항을 합쳐요
      setLoadingStatus('AI 처리 중...')
      const prompt = buildPrompt(format, settings.language, {
        includeTimestamps,
        // showCustomInstruction이 켜져있을 때만 지시사항을 포함해요
        customInstruction: showCustomInstruction ? customInstruction : '',
      })

      // AI에게 자막 + 지시문을 보내서 문서를 받아요
      // setLoadingStatus: AI 처리 중 청크 진행상황 등을 버튼에 표시해줘요
      const doc = await generateDocument(transcript, prompt, settings, setLoadingStatus)

      // 결과를 화면에 표시해요
      setResult(doc)

      // 변환 기록에 저장해요 (나중에 HistoryPanel에서 볼 수 있어요)
      addEntry({
        url: activeTab === 'url' ? url : '',           // URL 탭이면 URL 저장, 아니면 빈 문자열
        videoId: activeTab === 'url' ? (videoId ?? null) : null, // URL 탭이면 videoId 저장
        format,
        result: doc,
        customInstruction: showCustomInstruction ? customInstruction : '',
        includeTimestamps,
      })

    } catch (e) {
      // AI 호출이나 다른 부분에서 오류 발생 시 표시해요
      setError(e.message)
    } finally {
      // try/catch가 어떻게 끝나든 항상 실행돼요
      // 로딩 상태를 해제해서 버튼을 다시 누를 수 있게 해요
      setLoading(false)
    }
  }

  /**
   * handleRestore — 이전 기록을 복원하는 함수
   *
   * HistoryPanel에서 기록을 클릭하면 호출돼요.
   * 그 기록의 설정과 결과를 현재 화면에 다시 불러와요.
   *
   * @param {object} entry - 복원할 기록 객체
   */
  const handleRestore = (entry) => {
    if (entry.url) {
      // URL이 있으면 URL 탭으로 전환하고 URL을 채워요
      setActiveTab('url')
      setUrl(entry.url)
    }
    setFormat(entry.format)                  // 형식 복원
    setResult(entry.result)                  // 결과 텍스트 복원
    setCustomInstruction(entry.customInstruction || '') // 지시사항 복원
    setShowCustomInstruction(!!entry.customInstruction) // 지시사항 있으면 입력창 표시
    setIncludeTimestamps(entry.includeTimestamps || false) // 타임스탬프 옵션 복원

    // 화면 상단으로 부드럽게 스크롤해요
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /**
   * canConvert — "변환하기" 버튼을 활성화할지 결정하는 변수
   *
   * 조건:
   * - 로딩 중이 아니고 (loading이 false)
   * - 붙여넣기 탭이면 자막이 입력되어 있거나
   * - URL 탭이면 URL이 입력되어 있어야 해요
   *
   * canConvert가 false면 버튼이 비활성화(회색)돼요.
   */
  const canConvert =
    !loading &&
    (activeTab === 'paste'
      ? manualTranscript.trim().length > 0  // 자막 직접 입력 탭: 자막이 있어야 해요
      : url.trim().length > 0)              // URL 탭: URL이 있어야 해요

  return (
    // 전체 페이지 컨테이너
    // min-h-screen: 최소 화면 전체 높이
    // fontFamily: 모든 글자에 Arial 계열 폰트 사용 (NVIDIA 스타일)
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>

      {/* ── NVIDIA 초록색 상단 선 ── */}
      {/* 화면 최상단에 고정된 얇은 초록 선이에요 (NVIDIA 브랜드 느낌) */}
      <div className="fixed inset-x-0 top-0 h-0.5 bg-[#76b900] z-50" />

      {/* ════════ 헤더 (상단 네비게이션) ════════ */}
      {/* sticky top-0: 스크롤해도 상단에 고정돼요 */}
      {/* z-40: 초록 선(z-50)보다는 아래지만 다른 요소보다 위에 있어요 */}
      <header className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* 왼쪽: 로고 + 앱 이름 */}
          <div className="flex items-center gap-2.5">
            {/* 초록색 S 로고 박스 */}
            <span className="w-7 h-7 rounded-[2px] bg-[#76b900] flex items-center justify-center text-black font-bold text-sm select-none">
              S
            </span>
            {/* 앱 이름 */}
            <span className="font-bold text-[var(--text)] tracking-tight">SubToDoc</span>
            {/* 부제목 (작은 화면에선 숨겨요: hidden sm:inline) */}
            <span className="hidden sm:inline text-xs text-[var(--text-muted)] ml-1 uppercase tracking-wider">YouTube → 문서</span>
          </div>

          {/* 오른쪽: 테마 전환 버튼 + 설정 버튼 */}
          <div className="flex items-center gap-1">

            {/* 테마 전환 버튼 (☀️/🌙) */}
            <button
              onClick={toggleTheme}
              aria-label="테마 전환"
              className="w-8 h-8 flex items-center justify-center rounded-[2px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-colors"
            >
              {theme === 'dark' ? (
                /* 다크 모드일 때: 밝은 모드로 전환하는 태양 아이콘 ☀️ */
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                /* 라이트 모드일 때: 다크 모드로 전환하는 달 아이콘 🌙 */
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              )}
            </button>

            {/* 설정 버튼 (⚙️ 톱니바퀴) */}
            <button
              onClick={() => setShowSettings(true)}
              aria-label="설정 열기"
              className="w-8 h-8 flex items-center justify-center rounded-[2px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-colors"
            >
              {/* 톱니바퀴 SVG 아이콘 */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ════════ 메인 내용 영역 ════════ */}
      {/* max-w-4xl: 최대 너비 제한 (너무 넓어지지 않게) */}
      {/* mx-auto: 가운데 정렬 */}
      {/* space-y-4: 각 섹션 사이 세로 간격 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* ── 입력 카드 (가장 큰 카드) ── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2px] overflow-hidden animate-fade-in" style={{ boxShadow: 'rgba(0,0,0,0.15) 0px 0px 5px 0px' }}>

          {/* ── 탭 버튼들 (YouTube URL | 자막 붙여넣기) ── */}
          <div className="flex border-b border-[var(--border)]">
            {[
              {
                id: 'url',
                label: 'YouTube URL',
                icon: (
                  // YouTube 로고 아이콘
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
                  </svg>
                ),
              },
              {
                id: 'paste',
                label: '자막 붙여넣기',
                icon: (
                  // 클립보드 아이콘
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="4" rx="1"/>
                    <path d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2"/>
                    <path d="M9 12h6M9 16h4"/>
                  </svg>
                ),
              },
            ].map(tab => (
              <button
                key={tab.id}
                // 탭 클릭 시 activeTab을 바꾸고 오류 메시지를 지워요
                onClick={() => { setActiveTab(tab.id); setError('') }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                  activeTab === tab.id
                    // 현재 선택된 탭: 초록색 + 아래에 초록 선
                    ? 'text-[#76b900] border-b-2 border-[#76b900] bg-[#76b900]/5'
                    // 선택 안 된 탭: 회색
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] border-b-2 border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── 탭 내용 영역 ── */}
          <div className="p-5 space-y-5">

            {/* 현재 탭에 따라 다른 내용을 보여줘요 */}
            {activeTab === 'url' ? (
              // URL 탭: URL 입력창 + 영상 미리보기
              <div className="space-y-3">
                <UrlInput value={url} onChange={setUrl} />
                {/* videoId가 있을 때만 미리보기가 나타나요 */}
                <VideoPreview videoId={videoId} />
              </div>
            ) : (
              // 자막 붙여넣기 탭: 자막 직접 입력창
              <TranscriptPaste value={manualTranscript} onChange={setManualTranscript} />
            )}

            {/* ── 자막 소스 & AI 모델 선택 바 ── */}
            {/* settings: 현재 선택된 것을 표시하기 위해 전달 */}
            {/* onChangeTranscript: 자막 소스 버튼 클릭 시 설정 업데이트 */}
            {/* onChangeAI: AI 모델 버튼 클릭 시 설정 업데이트 */}
            <ProviderBar
              settings={settings}
              onChangeTranscript={(id) => updateSettings({ transcriptProvider: id })}
              onChangeAI={(id) => updateSettings({ provider: id })}
            />

            {/* 구분선 */}
            <div className="border-t border-[var(--border)]" />

            {/* ── 문서 형식 선택 ── */}
            <FormatSelector
              selected={format}
              onChange={setFormat}
              includeTimestamps={includeTimestamps}
              onTimestampsChange={setIncludeTimestamps}
              showCustomInstruction={showCustomInstruction}
              onShowCustomInstructionToggle={(show) => {
                setShowCustomInstruction(show)
                // 직접 지시하기를 끄면 입력된 내용도 지워요
                if (!show) setCustomInstruction('')
              }}
              customInstruction={customInstruction}
              onCustomInstructionChange={setCustomInstruction}
            />

            {/* ── 오류 메시지 박스 ── */}
            {/* error가 있을 때만 보여요 */}
            {error && (
              // animate-slide-up: 위에서 아래로 부드럽게 나타나는 애니메이션
              <div className="flex gap-3 p-3.5 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[2px] animate-slide-up">
                {/* 경고 아이콘 */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#e52020] flex-shrink-0 mt-0.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div className="space-y-1 text-sm">
                  {/* 오류 메시지 */}
                  <p className="text-[var(--text)] font-bold">{error}</p>
                  {/* URL 탭에서 오류가 났을 때만 붙여넣기 안내를 보여줘요 */}
                  {activeTab === 'url' && (
                    <p className="text-[var(--text-muted)]">
                      자막 자동 가져오기 실패 —{' '}
                      <button
                        type="button"
                        // 클릭하면 붙여넣기 탭으로 전환하고 오류를 지워요
                        onClick={() => { setActiveTab('paste'); setError('') }}
                        className="text-[#76b900] hover:text-[#bff230] underline underline-offset-2 transition-colors"
                      >
                        직접 붙여넣기
                      </button>
                      로 시도해보세요.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── 변환하기 버튼 ── */}
            <button
              onClick={handleConvert}
              disabled={!canConvert}  /* canConvert가 false면 버튼이 비활성화돼요 */
              className={`w-full h-12 rounded-[2px] font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
                canConvert
                  // 활성화 상태: 초록 테두리, 클릭하면 파란색으로 변해요
                  ? 'bg-transparent border-2 border-[#76b900] text-[var(--text)] hover:bg-[#1eaedb] hover:border-[#1eaedb] hover:text-white'
                  // 비활성화 상태: 회색, 클릭 불가
                  : 'bg-transparent border-2 border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
              }`}
            >
              {loading ? (
                // 변환 중일 때: 회전하는 로딩 스피너 + "변환 중..."
                <>
                  <svg className="animate-spin-slow w-4 h-4 text-[#76b900]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {/* loadingStatus: 현재 처리 단계를 실시간으로 표시해요 */}
                  {/* 예: "자막 가져오는 중...", "청크 2/3 요약 중...", "최종 문서 생성 중..." */}
                  <span className="truncate max-w-[200px]">{loadingStatus}</span>
                </>
              ) : (
                // 대기 중일 때: 빛나는 아이콘 + "변환하기"
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M18.36 18.36l.7.7M3 12h1M20 12h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7"/>
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                  변환하기
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── 변환 결과 영역 ── */}
        {/* result가 있을 때만 나타나요 */}
        {result && (
          // animate-slide-up: 결과가 생기면 위에서 부드럽게 내려와요
          <div className="animate-slide-up space-y-3">
            {/* 결과 뷰어: 마크다운 → 예쁜 화면 */}
            <ResultViewer
              content={result}
              videoId={activeTab === 'url' ? videoId : null}  // URL 탭이면 videoId 전달
              format={format}
            />
            {/* 파일 저장 버튼들 */}
            <ExportButtons content={result} />
          </div>
        )}

        {/* ── 이전 변환 기록 패널 ── */}
        {/* history가 비어있으면 HistoryPanel 내부에서 자동으로 숨겨요 */}
        <HistoryPanel
          history={history}
          onRestore={handleRestore}
          onRemove={removeEntry}
          onClear={clearHistory}
        />
      </main>

      {/* ── 설정 창 (모달) ── */}
      {/* showSettings가 true일 때만 보여요 */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={updateSettings}           // 저장 시 설정 업데이트
          onClose={() => setShowSettings(false)} // 닫기 버튼 시 모달 숨김
        />
      )}
    </div>
  )
}
