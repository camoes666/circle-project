# SubToDoc 기술 설계 문서

**날짜:** 2026-04-14
**상태:** 승인됨
**기반 문서:** `docs/product/2026-04-14-subtodoc-기획서.md`, `docs/product/2026-04-14-subtodoc-lean-canvas.md`

---

## 1. 개요

YouTube URL을 입력하면 자막을 추출하고 AI가 원하는 문서 형식으로 변환해주는 클라이언트 사이드 웹 앱. 사용자가 직접 AI API 키를 입력해 사용하며, 구독·서버 없이 동작한다.

---

## 2. 아키텍처

```
[GitHub Pages]                    [Cloudflare Worker]
React + Vite + Tailwind           CORS 프록시 (무료 티어)
       │                                  │
       ├─ URL 입력                         │
       ├─ Cloudflare Worker 호출 ──────────┘
       │   → YouTube 자막 텍스트 반환
       ├─ Groq API 직접 호출 (기본)
       │   or Gemini Flash API 직접 호출
       │   → AI 문서 생성
       ├─ 결과 표시 + 내보내기
       └─ API 키 + 설정 → localStorage
```

**핵심 원칙:**
- 사용자 API 키는 localStorage에만 존재하며 외부 서버로 전송되지 않는다.
- Cloudflare Worker는 YouTube 자막 텍스트만 중계하며 API 키는 통과하지 않는다.
- 빌드 산출물은 정적 파일이며 GitHub Pages에 배포된다.

---

## 3. 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | React + Vite |
| 스타일링 | Tailwind CSS |
| AI API (기본) | Groq — `llama-3.3-70b-versatile` (OpenAI 호환 SDK) |
| AI API (옵션) | Gemini Flash (`@google/generative-ai`) |
| 자막 추출 | Cloudflare Worker → YouTube 내부 timedtext API |
| 저장 | localStorage |
| 배포 | GitHub Pages |
| PDF 내보내기 | `html2pdf.js` 또는 `jspdf` |

---

## 4. UI 플로우

싱글 페이지 위자드 방식. 단계별로 순서대로 진행된다.

```
┌─────────────────────────────────────┐
│  Header (로고 + 설정 아이콘)          │
├─────────────────────────────────────┤
│  Step 1: YouTube URL 입력            │
│  Step 2: 문서 형식 선택               │
│          [요약] [블로그] [회의록] [노트] │
│  Step 3: [변환하기] 버튼              │
├─────────────────────────────────────┤
│  결과 영역 (생성 후 표시)              │
│  [클립보드 복사] [.md 다운로드] [PDF]  │
└─────────────────────────────────────┘

Settings 모달 (설정 아이콘 클릭):
  - AI Provider: Groq (기본) / Gemini Flash
  - API Key 입력 (localStorage 저장)
  - 출력 언어 선택 (한국어 기본)
```

---

## 5. 컴포넌트 구조

```
src/
├── components/
│   ├── UrlInput.jsx          # YouTube URL 입력 필드
│   ├── FormatSelector.jsx    # 문서 형식 선택 (요약/블로그/회의록/노트)
│   ├── ResultViewer.jsx      # 생성된 문서 표시
│   ├── ExportButtons.jsx     # 복사 / .md / .pdf 내보내기
│   └── SettingsModal.jsx     # AI 선택, API 키, 출력 언어
├── services/
│   ├── transcript.js         # YouTube 자막 추출 (Cloudflare Worker 호출)
│   ├── ai.js                 # AI API 추상화 레이어 (Groq/Gemini 교체 가능)
│   ├── prompts.js            # 형식 + 언어 조합 프롬프트 빌더
│   └── export.js             # .md / .pdf 내보내기 함수
├── hooks/
│   └── useSettings.js        # localStorage 설정 읽기/쓰기
└── App.jsx
```

### 확장 예정 (MVP 이후)

```
src/
├── services/
│   └── history.js            # 변환 히스토리 CRUD (localStorage)
└── hooks/
    └── useHistory.js         # 히스토리 상태 관리
```

---

## 6. 핵심 서비스 설계

### `services/ai.js` — AI 추상화 레이어

Groq과 Gemini를 동일한 인터페이스로 호출한다. 새 AI 프로바이더 추가 시 이 파일만 수정하면 된다.

```js
// 인터페이스
export async function generateDocument(transcript, prompt, settings) {
  if (settings.provider === 'groq') return callGroq(transcript, prompt, settings.apiKey)
  if (settings.provider === 'gemini') return callGemini(transcript, prompt, settings.apiKey)
}
```

### `services/prompts.js` — 프롬프트 빌더

형식과 출력 언어를 받아 프롬프트를 조합한다. 새 형식 추가 시 이 파일에 항목만 추가하면 UI에 자동 반영된다.

```js
export const FORMATS = ['요약', '블로그', '회의록', '노트']

export function buildPrompt(format, language) {
  return `다음 YouTube 영상 자막을 ${language}로 ${format} 형식으로 정리해줘.\n\n`
}
```

### `services/transcript.js` — 자막 추출

Cloudflare Worker를 통해 YouTube 자막을 가져온다.

```js
export async function fetchTranscript(videoId) {
  const res = await fetch(`https://<worker>.workers.dev/transcript?v=${videoId}`)
  return res.text()
}
```

### `services/export.js` — 내보내기

```js
export function copyToClipboard(text) { ... }
export function downloadMarkdown(text, filename) { ... }
export function downloadPdf(text, filename) { ... }
```

---

## 7. Cloudflare Worker 설계

YouTube의 내부 timedtext API를 CORS 없이 호출하는 얇은 프록시.

```
GET https://<worker>.workers.dev/transcript?v={videoId}
→ YouTube timedtext API 호출
→ 자막 텍스트 반환
```

Worker 코드는 별도 저장소 또는 `worker/` 디렉토리에 관리한다.

---

## 8. MVP 범위

| 기능 | MVP 포함 |
|------|----------|
| YouTube URL 입력 → 자막 추출 | ✅ |
| 문서 형식 선택 (요약/블로그/회의록/노트) | ✅ |
| Groq API 연동 (기본) | ✅ |
| Gemini Flash API 연동 (옵션) | ✅ |
| API 키 localStorage 저장 | ✅ |
| 클립보드 복사 | ✅ |
| .md 파일 다운로드 | ✅ |
| PDF 다운로드 | ✅ |
| 출력 언어 선택 (한국어 기본) | ✅ |
| 변환 히스토리 | ❌ (MVP 이후) |
| 커스텀 프롬프트 | ❌ (MVP 이후) |
| 모바일 최적화 | ❌ (MVP 이후) |
| 서버 / DB / 회원가입 | ❌ 영구 제외 |

---

## 9. 배포 구조

| 항목 | 방법 |
|------|------|
| 프론트엔드 | GitHub Pages (Vite 빌드 → `gh-pages` 브랜치) |
| Cloudflare Worker | Cloudflare 대시보드 또는 Wrangler CLI 배포 |
| 환경변수 | 없음 (API 키는 사용자 브라우저 localStorage) |
