# SubToDoc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** YouTube URL을 입력하면 자막을 추출해 AI가 원하는 문서 형식으로 변환해주는 클라이언트 사이드 웹 앱을 만든다.

**Architecture:** GitHub Pages(React + Vite)에 배포되는 정적 앱. YouTube 자막은 Cloudflare Worker CORS 프록시를 통해 추출하고, Groq/Gemini API는 브라우저에서 직접 호출한다. 사용자 API 키는 localStorage에만 저장된다.

**Tech Stack:** React 18, Vite, Tailwind CSS, Vitest, React Testing Library, groq-sdk, @google/generative-ai, html2pdf.js, gh-pages

---

## File Map

```
circle-project/
├── subtodoc/                          ← React 앱 루트
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.jsx
│       ├── App.test.jsx
│       ├── test/
│       │   └── setup.js
│       ├── components/
│       │   ├── UrlInput.jsx
│       │   ├── UrlInput.test.jsx
│       │   ├── FormatSelector.jsx
│       │   ├── FormatSelector.test.jsx
│       │   ├── ResultViewer.jsx
│       │   ├── ResultViewer.test.jsx
│       │   ├── ExportButtons.jsx
│       │   ├── ExportButtons.test.jsx
│       │   ├── SettingsModal.jsx
│       │   └── SettingsModal.test.jsx
│       ├── services/
│       │   ├── prompts.js
│       │   ├── prompts.test.js
│       │   ├── export.js
│       │   ├── export.test.js
│       │   ├── ai.js
│       │   ├── ai.test.js
│       │   ├── transcript.js
│       │   └── transcript.test.js
│       └── hooks/
│           ├── useSettings.js
│           └── useSettings.test.js
└── worker/                            ← Cloudflare Worker
    ├── index.js
    ├── package.json
    └── wrangler.toml
```

---

## Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `subtodoc/` (Vite 프로젝트 전체)

- [ ] **Step 1: Vite React 프로젝트 생성**

```bash
cd /c/Users/USER/code/circle-project
npm create vite@latest subtodoc -- --template react
cd subtodoc
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install groq-sdk @google/generative-ai html2pdf.js
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom gh-pages
npx tailwindcss init -p
```

- [ ] **Step 3: vite.config.js 설정**

`subtodoc/vite.config.js`를 다음으로 교체:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/subtodoc/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 4: Tailwind 설정**

`subtodoc/tailwind.config.js`를 다음으로 교체:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: package.json scripts 추가**

`subtodoc/package.json`의 `"scripts"` 섹션을 다음으로 교체:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run",
  "deploy": "npm run build && gh-pages -d dist"
}
```

- [ ] **Step 6: 테스트 setup 파일 생성**

`subtodoc/src/test/setup.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 7: CSS 파일 교체**

`subtodoc/src/index.css` 전체 내용을 다음으로 교체:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: .env.example 생성**

`subtodoc/.env.example`:

```
VITE_WORKER_URL=https://your-worker-name.your-username.workers.dev
```

- [ ] **Step 9: 기존 보일러플레이트 삭제**

```bash
rm subtodoc/src/App.css subtodoc/src/assets/react.svg public/vite.svg 2>/dev/null; true
```

- [ ] **Step 10: 빌드 확인**

```bash
cd subtodoc && npm run test:run
```

Expected: 0 test files found (아직 테스트 없음), 오류 없음

- [ ] **Step 11: 커밋**

```bash
cd ..
git add subtodoc/
git commit -m "feat: scaffold subtodoc React+Vite project"
```

---

## Task 2: useSettings 훅

**Files:**
- Create: `subtodoc/src/hooks/useSettings.js`
- Create: `subtodoc/src/hooks/useSettings.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/hooks/useSettings.test.js`:

```js
import { renderHook, act } from '@testing-library/react'
import { useSettings } from './useSettings'

beforeEach(() => {
  localStorage.clear()
})

test('localStorage가 비어있으면 기본값을 반환한다', () => {
  const { result } = renderHook(() => useSettings())
  expect(result.current.settings).toEqual({
    provider: 'groq',
    groqApiKey: '',
    geminiApiKey: '',
    language: '한국어',
  })
})

test('localStorage에 저장된 값을 불러온다', () => {
  localStorage.setItem('subtodoc_settings', JSON.stringify({ provider: 'gemini', groqApiKey: '', geminiApiKey: 'abc', language: '영어' }))
  const { result } = renderHook(() => useSettings())
  expect(result.current.settings.provider).toBe('gemini')
  expect(result.current.settings.geminiApiKey).toBe('abc')
})

test('updateSettings가 localStorage에 저장한다', () => {
  const { result } = renderHook(() => useSettings())
  act(() => {
    result.current.updateSettings({ groqApiKey: 'test-key' })
  })
  const stored = JSON.parse(localStorage.getItem('subtodoc_settings'))
  expect(stored.groqApiKey).toBe('test-key')
})

test('updateSettings가 기존 값을 유지한다', () => {
  const { result } = renderHook(() => useSettings())
  act(() => {
    result.current.updateSettings({ groqApiKey: 'key1' })
  })
  act(() => {
    result.current.updateSettings({ language: '일본어' })
  })
  expect(result.current.settings.groqApiKey).toBe('key1')
  expect(result.current.settings.language).toBe('일본어')
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/hooks/useSettings.test.js
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`subtodoc/src/hooks/useSettings.js`:

```js
import { useState } from 'react'

const STORAGE_KEY = 'subtodoc_settings'

const DEFAULTS = {
  provider: 'groq',
  groqApiKey: '',
  geminiApiKey: '',
  language: '한국어',
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS }
    } catch {
      return { ...DEFAULTS }
    }
  })

  const updateSettings = (updates) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { settings, updateSettings }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/hooks/useSettings.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
cd ..
git add subtodoc/src/hooks/
git commit -m "feat: add useSettings hook with localStorage persistence"
```

---

## Task 3: prompts 서비스

**Files:**
- Create: `subtodoc/src/services/prompts.js`
- Create: `subtodoc/src/services/prompts.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/services/prompts.test.js`:

```js
import { FORMATS, buildPrompt } from './prompts'

test('FORMATS는 4개 항목을 가진다', () => {
  expect(FORMATS).toHaveLength(4)
})

test('FORMATS 각 항목은 id와 label을 가진다', () => {
  FORMATS.forEach(f => {
    expect(f).toHaveProperty('id')
    expect(f).toHaveProperty('label')
    expect(f).toHaveProperty('instruction')
  })
})

test('FORMATS id 목록은 summary, blog, minutes, notes이다', () => {
  const ids = FORMATS.map(f => f.id)
  expect(ids).toEqual(['summary', 'blog', 'minutes', 'notes'])
})

test('buildPrompt은 언어와 형식 지시를 포함한다', () => {
  const prompt = buildPrompt('summary', '한국어')
  expect(prompt).toContain('한국어')
  expect(prompt).toContain('요약')
})

test('buildPrompt 기본 언어는 한국어이다', () => {
  const prompt = buildPrompt('blog')
  expect(prompt).toContain('한국어')
})

test('buildPrompt 결과는 자막을 붙일 수 있는 문자열이다', () => {
  const prompt = buildPrompt('notes', '영어')
  expect(typeof prompt).toBe('string')
  expect(prompt.length).toBeGreaterThan(10)
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/services/prompts.test.js
```

Expected: FAIL

- [ ] **Step 3: 구현**

`subtodoc/src/services/prompts.js`:

```js
export const FORMATS = [
  {
    id: 'summary',
    label: '요약',
    instruction: '핵심 내용을 불릿 포인트로 간결하게 요약해줘.',
  },
  {
    id: 'blog',
    label: '블로그',
    instruction: '블로그 포스트 형식으로 작성해줘. 제목, 도입부, 본문, 결론 구조로.',
  },
  {
    id: 'minutes',
    label: '회의록',
    instruction: '회의록 형식으로 작성해줘. 논의된 주제, 결정사항, 액션아이템 중심으로.',
  },
  {
    id: 'notes',
    label: '노트',
    instruction: '학습 노트 형식으로 작성해줘. 핵심 개념, 중요 포인트, 추가 학습 필요 항목 포함.',
  },
]

export function buildPrompt(formatId, language = '한국어') {
  const format = FORMATS.find(f => f.id === formatId)
  return `다음 YouTube 영상 자막을 ${language}로 변환해줘.\n${format.instruction}\n\n자막:\n`
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/services/prompts.test.js
```

Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
cd ..
git add subtodoc/src/services/prompts.js subtodoc/src/services/prompts.test.js
git commit -m "feat: add prompts service with 4 document formats"
```

---

## Task 4: export 서비스

**Files:**
- Create: `subtodoc/src/services/export.js`
- Create: `subtodoc/src/services/export.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/services/export.test.js`:

```js
import { copyToClipboard, downloadMarkdown } from './export'

beforeEach(() => {
  // navigator.clipboard mock
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  })

  // URL mock
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()

  // document.createElement mock for anchor
  const originalCreateElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'a') {
      return { href: '', download: '', click: vi.fn(), style: {} }
    }
    return originalCreateElement(tag)
  })
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('copyToClipboard가 navigator.clipboard.writeText를 호출한다', async () => {
  await copyToClipboard('hello')
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello')
})

test('downloadMarkdown이 Blob을 생성하고 클릭을 트리거한다', () => {
  downloadMarkdown('# Title\nContent')
  expect(URL.createObjectURL).toHaveBeenCalled()
  const anchor = document.createElement.mock.results.find(r => r.value?.download !== undefined)?.value
  expect(anchor).toBeDefined()
})

test('downloadMarkdown이 .md 확장자를 사용한다', () => {
  downloadMarkdown('text', 'my-doc.md')
  const anchor = document.createElement.mock.results.find(r => r.value?.download !== undefined)?.value
  expect(anchor?.download).toBe('my-doc.md')
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/services/export.test.js
```

Expected: FAIL

- [ ] **Step 3: 구현**

`subtodoc/src/services/export.js`:

```js
export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
}

export function downloadMarkdown(text, filename = 'subtodoc-output.md') {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadPdf(text, filename = 'subtodoc-output.pdf') {
  const { default: html2pdf } = await import('html2pdf.js')
  const element = document.createElement('div')
  element.style.padding = '20px'
  element.style.fontFamily = 'sans-serif'
  element.innerHTML = text.replace(/\n/g, '<br>')
  html2pdf().set({ filename }).from(element).save()
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/services/export.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
cd ..
git add subtodoc/src/services/export.js subtodoc/src/services/export.test.js
git commit -m "feat: add export service (clipboard, markdown, pdf)"
```

---

## Task 5: ai 서비스

**Files:**
- Create: `subtodoc/src/services/ai.js`
- Create: `subtodoc/src/services/ai.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/services/ai.test.js`:

```js
import { generateDocument } from './ai'

// groq-sdk mock
vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Groq 결과물' } }],
        }),
      },
    },
  })),
}))

// @google/generative-ai mock
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => 'Gemini 결과물' },
      }),
    }),
  })),
}))

const groqSettings = { provider: 'groq', groqApiKey: 'gsk_test', geminiApiKey: '' }
const geminiSettings = { provider: 'gemini', groqApiKey: '', geminiApiKey: 'AIzatest' }

test('provider가 groq이면 Groq API를 호출한다', async () => {
  const result = await generateDocument('자막 텍스트', '프롬프트', groqSettings)
  expect(result).toBe('Groq 결과물')
})

test('provider가 gemini이면 Gemini API를 호출한다', async () => {
  const result = await generateDocument('자막 텍스트', '프롬프트', geminiSettings)
  expect(result).toBe('Gemini 결과물')
})

test('API 키가 비어있으면 에러를 던진다', async () => {
  await expect(
    generateDocument('자막', '프롬프트', { provider: 'groq', groqApiKey: '', geminiApiKey: '' })
  ).rejects.toThrow('API 키를 설정해주세요.')
})

test('알 수 없는 provider이면 에러를 던진다', async () => {
  await expect(
    generateDocument('자막', '프롬프트', { provider: 'openai', groqApiKey: 'key', geminiApiKey: '' })
  ).rejects.toThrow('지원하지 않는 provider')
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/services/ai.test.js
```

Expected: FAIL

- [ ] **Step 3: 구현**

`subtodoc/src/services/ai.js`:

```js
import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function callGroq(transcript, prompt, apiKey) {
  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true })
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt + transcript }],
  })
  return completion.choices[0].message.content
}

async function callGemini(transcript, prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt + transcript)
  return result.response.text()
}

export async function generateDocument(transcript, prompt, settings) {
  const apiKey = settings.provider === 'groq' ? settings.groqApiKey : settings.geminiApiKey
  if (!apiKey) throw new Error('API 키를 설정해주세요.')
  if (settings.provider === 'groq') return callGroq(transcript, prompt, apiKey)
  if (settings.provider === 'gemini') return callGemini(transcript, prompt, apiKey)
  throw new Error(`지원하지 않는 provider: ${settings.provider}`)
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/services/ai.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
cd ..
git add subtodoc/src/services/ai.js subtodoc/src/services/ai.test.js
git commit -m "feat: add ai service with Groq and Gemini support"
```

---

## Task 6: transcript 서비스

**Files:**
- Create: `subtodoc/src/services/transcript.js`
- Create: `subtodoc/src/services/transcript.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/services/transcript.test.js`:

```js
import { extractVideoId, fetchTranscript } from './transcript'

// fetch mock
global.fetch = vi.fn()

afterEach(() => {
  vi.clearAllMocks()
})

describe('extractVideoId', () => {
  test('?v= 형식 URL을 파싱한다', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  test('youtu.be 단축 URL을 파싱한다', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  test('embed URL을 파싱한다', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  test('유효하지 않은 URL은 null을 반환한다', () => {
    expect(extractVideoId('https://example.com')).toBeNull()
    expect(extractVideoId('')).toBeNull()
  })
})

describe('fetchTranscript', () => {
  test('Worker URL에 videoId를 붙여 호출한다', async () => {
    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('자막 텍스트') })
    const result = await fetchTranscript('dQw4w9WgXcQ')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('dQw4w9WgXcQ'))
    expect(result).toBe('자막 텍스트')
  })

  test('응답이 ok가 아니면 에러를 던진다', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(fetchTranscript('badid')).rejects.toThrow('자막을 가져오지 못했습니다')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/services/transcript.test.js
```

Expected: FAIL

- [ ] **Step 3: 구현**

`subtodoc/src/services/transcript.js`:

```js
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'

export function extractVideoId(url) {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function fetchTranscript(videoId) {
  const res = await fetch(`${WORKER_URL}/transcript?v=${videoId}`)
  if (!res.ok) throw new Error(`자막을 가져오지 못했습니다. (${res.status})`)
  return res.text()
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/services/transcript.test.js
```

Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
cd ..
git add subtodoc/src/services/transcript.js subtodoc/src/services/transcript.test.js
git commit -m "feat: add transcript service with YouTube URL parser"
```

---

## Task 7: UrlInput 컴포넌트

**Files:**
- Create: `subtodoc/src/components/UrlInput.jsx`
- Create: `subtodoc/src/components/UrlInput.test.jsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/components/UrlInput.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlInput from './UrlInput'

test('입력 필드를 렌더링한다', () => {
  render(<UrlInput value="" onChange={() => {}} />)
  expect(screen.getByPlaceholderText(/youtube\.com/i)).toBeInTheDocument()
})

test('value prop을 표시한다', () => {
  render(<UrlInput value="https://youtube.com/watch?v=abc" onChange={() => {}} />)
  expect(screen.getByDisplayValue('https://youtube.com/watch?v=abc')).toBeInTheDocument()
})

test('입력 시 onChange를 호출한다', async () => {
  const onChange = vi.fn()
  render(<UrlInput value="" onChange={onChange} />)
  await userEvent.type(screen.getByRole('textbox'), 'https://youtube.com')
  expect(onChange).toHaveBeenCalled()
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/components/UrlInput.test.jsx
```

Expected: FAIL

- [ ] **Step 3: 구현**

`subtodoc/src/components/UrlInput.jsx`:

```jsx
export default function UrlInput({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">
        YouTube URL
      </label>
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-gray-100 placeholder-gray-600"
      />
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/components/UrlInput.test.jsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
cd ..
git add subtodoc/src/components/UrlInput.jsx subtodoc/src/components/UrlInput.test.jsx
git commit -m "feat: add UrlInput component"
```

---

## Task 8: FormatSelector 컴포넌트

**Files:**
- Create: `subtodoc/src/components/FormatSelector.jsx`
- Create: `subtodoc/src/components/FormatSelector.test.jsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/components/FormatSelector.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormatSelector from './FormatSelector'

test('4개의 형식 버튼을 렌더링한다', () => {
  render(<FormatSelector selected="summary" onChange={() => {}} />)
  expect(screen.getByText('요약')).toBeInTheDocument()
  expect(screen.getByText('블로그')).toBeInTheDocument()
  expect(screen.getByText('회의록')).toBeInTheDocument()
  expect(screen.getByText('노트')).toBeInTheDocument()
})

test('선택된 형식 버튼이 강조된다', () => {
  render(<FormatSelector selected="blog" onChange={() => {}} />)
  expect(screen.getByText('블로그').className).toContain('bg-blue-600')
  expect(screen.getByText('요약').className).not.toContain('bg-blue-600')
})

test('버튼 클릭 시 onChange를 id와 함께 호출한다', async () => {
  const onChange = vi.fn()
  render(<FormatSelector selected="summary" onChange={onChange} />)
  await userEvent.click(screen.getByText('회의록'))
  expect(onChange).toHaveBeenCalledWith('minutes')
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/components/FormatSelector.test.jsx
```

Expected: FAIL

- [ ] **Step 3: 구현**

`subtodoc/src/components/FormatSelector.jsx`:

```jsx
import { FORMATS } from '../services/prompts'

export default function FormatSelector({ selected, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        문서 형식
      </label>
      <div className="flex gap-2 flex-wrap">
        {FORMATS.map(f => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/components/FormatSelector.test.jsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
cd ..
git add subtodoc/src/components/FormatSelector.jsx subtodoc/src/components/FormatSelector.test.jsx
git commit -m "feat: add FormatSelector component"
```

---

## Task 9: ResultViewer + ExportButtons 컴포넌트

**Files:**
- Create: `subtodoc/src/components/ResultViewer.jsx`
- Create: `subtodoc/src/components/ResultViewer.test.jsx`
- Create: `subtodoc/src/components/ExportButtons.jsx`
- Create: `subtodoc/src/components/ExportButtons.test.jsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/components/ResultViewer.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import ResultViewer from './ResultViewer'

test('전달받은 content를 표시한다', () => {
  render(<ResultViewer content="# 제목\n내용입니다." />)
  expect(screen.getByText('# 제목\n내용입니다.')).toBeInTheDocument()
})
```

`subtodoc/src/components/ExportButtons.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportButtons from './ExportButtons'

vi.mock('../services/export', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
  downloadMarkdown: vi.fn(),
  downloadPdf: vi.fn(),
}))

import { copyToClipboard, downloadMarkdown, downloadPdf } from '../services/export'

test('3개의 버튼을 렌더링한다', () => {
  render(<ExportButtons content="텍스트" />)
  expect(screen.getByText('클립보드 복사')).toBeInTheDocument()
  expect(screen.getByText('.md 다운로드')).toBeInTheDocument()
  expect(screen.getByText('PDF')).toBeInTheDocument()
})

test('복사 버튼 클릭 시 copyToClipboard를 호출한다', async () => {
  render(<ExportButtons content="내용" />)
  await userEvent.click(screen.getByText('클립보드 복사'))
  expect(copyToClipboard).toHaveBeenCalledWith('내용')
})

test('복사 후 "복사됨!" 피드백을 표시한다', async () => {
  render(<ExportButtons content="내용" />)
  await userEvent.click(screen.getByText('클립보드 복사'))
  expect(screen.getByText('복사됨!')).toBeInTheDocument()
})

test('.md 버튼 클릭 시 downloadMarkdown을 호출한다', async () => {
  render(<ExportButtons content="내용" />)
  await userEvent.click(screen.getByText('.md 다운로드'))
  expect(downloadMarkdown).toHaveBeenCalledWith('내용')
})

test('PDF 버튼 클릭 시 downloadPdf를 호출한다', async () => {
  render(<ExportButtons content="내용" />)
  await userEvent.click(screen.getByText('PDF'))
  expect(downloadPdf).toHaveBeenCalledWith('내용')
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/components/ResultViewer.test.jsx src/components/ExportButtons.test.jsx
```

Expected: FAIL

- [ ] **Step 3: ResultViewer 구현**

`subtodoc/src/components/ResultViewer.jsx`:

```jsx
export default function ResultViewer({ content }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <pre className="whitespace-pre-wrap text-sm text-gray-200 font-sans leading-relaxed">
        {content}
      </pre>
    </div>
  )
}
```

- [ ] **Step 4: ExportButtons 구현**

`subtodoc/src/components/ExportButtons.jsx`:

```jsx
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
```

- [ ] **Step 5: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/components/ResultViewer.test.jsx src/components/ExportButtons.test.jsx
```

Expected: PASS (6 tests)

- [ ] **Step 6: 커밋**

```bash
cd ..
git add subtodoc/src/components/ResultViewer.jsx subtodoc/src/components/ResultViewer.test.jsx subtodoc/src/components/ExportButtons.jsx subtodoc/src/components/ExportButtons.test.jsx
git commit -m "feat: add ResultViewer and ExportButtons components"
```

---

## Task 10: SettingsModal 컴포넌트

**Files:**
- Create: `subtodoc/src/components/SettingsModal.jsx`
- Create: `subtodoc/src/components/SettingsModal.test.jsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/components/SettingsModal.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsModal from './SettingsModal'

const defaultSettings = {
  provider: 'groq',
  groqApiKey: '',
  geminiApiKey: '',
  language: '한국어',
}

test('모달을 렌더링한다', () => {
  render(<SettingsModal settings={defaultSettings} onSave={() => {}} onClose={() => {}} />)
  expect(screen.getByText('설정')).toBeInTheDocument()
})

test('Groq가 기본으로 선택된다', () => {
  render(<SettingsModal settings={defaultSettings} onSave={() => {}} onClose={() => {}} />)
  expect(screen.getByText('Groq (기본)').className).toContain('bg-blue-600')
})

test('Gemini 버튼 클릭 시 provider가 전환된다', async () => {
  render(<SettingsModal settings={defaultSettings} onSave={() => {}} onClose={() => {}} />)
  await userEvent.click(screen.getByText('Gemini Flash'))
  expect(screen.getByText('Gemini Flash').className).toContain('bg-blue-600')
})

test('저장 버튼 클릭 시 onSave와 onClose를 호출한다', async () => {
  const onSave = vi.fn()
  const onClose = vi.fn()
  render(<SettingsModal settings={defaultSettings} onSave={onSave} onClose={onClose} />)
  await userEvent.click(screen.getByText('저장'))
  expect(onSave).toHaveBeenCalled()
  expect(onClose).toHaveBeenCalled()
})

test('취소 버튼 클릭 시 onClose를 호출한다', async () => {
  const onClose = vi.fn()
  render(<SettingsModal settings={defaultSettings} onSave={() => {}} onClose={onClose} />)
  await userEvent.click(screen.getByText('취소'))
  expect(onClose).toHaveBeenCalled()
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/components/SettingsModal.test.jsx
```

Expected: FAIL

- [ ] **Step 3: 구현**

`subtodoc/src/components/SettingsModal.jsx`:

```jsx
import { useState } from 'react'

const LANGUAGES = ['한국어', '영어', '일본어', '중국어']

export default function SettingsModal({ settings, onSave, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  const handleSave = () => {
    onSave(local)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">설정</h2>

        <div>
          <label className="block text-sm text-gray-400 mb-1">AI Provider</label>
          <div className="flex gap-2">
            {['groq', 'gemini'].map(p => (
              <button
                key={p}
                onClick={() => setLocal(l => ({ ...l, provider: p }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  local.provider === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {p === 'groq' ? 'Groq (기본)' : 'Gemini Flash'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {local.provider === 'groq' ? 'Groq' : 'Gemini'} API Key
          </label>
          <input
            type="password"
            value={local.provider === 'groq' ? local.groqApiKey : local.geminiApiKey}
            onChange={e => {
              const key = local.provider === 'groq' ? 'groqApiKey' : 'geminiApiKey'
              setLocal(l => ({ ...l, [key]: e.target.value }))
            }}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-100"
            placeholder="API 키를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">출력 언어</label>
          <select
            value={local.language}
            onChange={e => setLocal(l => ({ ...l, language: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-100"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/components/SettingsModal.test.jsx
```

Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
cd ..
git add subtodoc/src/components/SettingsModal.jsx subtodoc/src/components/SettingsModal.test.jsx
git commit -m "feat: add SettingsModal component"
```

---

## Task 11: App.jsx 통합

**Files:**
- Create: `subtodoc/src/App.jsx`
- Create: `subtodoc/src/App.test.jsx`
- Create: `subtodoc/src/main.jsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`subtodoc/src/App.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./services/transcript', () => ({
  extractVideoId: vi.fn(url => url.includes('v=') ? 'test-id' : null),
  fetchTranscript: vi.fn().mockResolvedValue('자막 텍스트'),
}))

vi.mock('./services/ai', () => ({
  generateDocument: vi.fn().mockResolvedValue('생성된 문서 내용'),
}))

test('기본 UI를 렌더링한다', () => {
  render(<App />)
  expect(screen.getByText('SubToDoc')).toBeInTheDocument()
  expect(screen.getByText('변환하기')).toBeInTheDocument()
})

test('설정 아이콘 클릭 시 SettingsModal을 열고 닫는다', async () => {
  render(<App />)
  await userEvent.click(screen.getByRole('button', { name: /설정/i }))
  expect(screen.getByText('설정')).toBeInTheDocument()
  await userEvent.click(screen.getByText('취소'))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('유효하지 않은 URL 입력 시 에러를 표시한다', async () => {
  render(<App />)
  await userEvent.type(screen.getByRole('textbox'), 'https://example.com')
  await userEvent.click(screen.getByText('변환하기'))
  expect(screen.getByText('유효한 YouTube URL을 입력해주세요.')).toBeInTheDocument()
})

test('성공적인 변환 후 결과를 표시한다', async () => {
  render(<App />)
  await userEvent.type(screen.getByRole('textbox'), 'https://youtube.com/watch?v=abc')
  await userEvent.click(screen.getByText('변환하기'))
  await waitFor(() => {
    expect(screen.getByText('생성된 문서 내용')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd subtodoc && npm run test:run -- src/App.test.jsx
```

Expected: FAIL

- [ ] **Step 3: App.jsx 구현**

`subtodoc/src/App.jsx`:

```jsx
import { useState } from 'react'
import UrlInput from './components/UrlInput'
import FormatSelector from './components/FormatSelector'
import ResultViewer from './components/ResultViewer'
import ExportButtons from './components/ExportButtons'
import SettingsModal from './components/SettingsModal'
import { useSettings } from './hooks/useSettings'
import { extractVideoId, fetchTranscript } from './services/transcript'
import { buildPrompt } from './services/prompts'
import { generateDocument } from './services/ai'

export default function App() {
  const { settings, updateSettings } = useSettings()
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('summary')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const handleConvert = async () => {
    setError('')
    setResult('')
    const videoId = extractVideoId(url)
    if (!videoId) {
      setError('유효한 YouTube URL을 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const transcript = await fetchTranscript(videoId)
      const prompt = buildPrompt(format, settings.language)
      const doc = await generateDocument(transcript, prompt, settings)
      setResult(doc)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-tight">SubToDoc</h1>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="설정"
          className="text-gray-400 hover:text-gray-100 transition-colors text-xl"
        >
          ⚙️
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <UrlInput value={url} onChange={setUrl} />
        <FormatSelector selected={format} onChange={setFormat} />

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          onClick={handleConvert}
          disabled={loading || !url}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {loading ? '변환 중...' : '변환하기'}
        </button>

        {result && (
          <>
            <ResultViewer content={result} />
            <ExportButtons content={result} />
          </>
        )}
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: main.jsx 생성**

`subtodoc/src/main.jsx`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: index.html 생성**

`subtodoc/index.html`:

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SubToDoc — YouTube 영상을 문서로</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 테스트 실행 — 통과 확인**

```bash
npm run test:run -- src/App.test.jsx
```

Expected: PASS (4 tests)

- [ ] **Step 7: 전체 테스트 실행**

```bash
npm run test:run
```

Expected: 모든 테스트 PASS (총 34+ tests)

- [ ] **Step 8: 커밋**

```bash
cd ..
git add subtodoc/src/App.jsx subtodoc/src/App.test.jsx subtodoc/src/main.jsx subtodoc/index.html
git commit -m "feat: integrate all components into App.jsx"
```

---

## Task 12: Cloudflare Worker

**Files:**
- Create: `worker/index.js`
- Create: `worker/package.json`
- Create: `worker/wrangler.toml`

- [ ] **Step 1: worker 디렉토리 생성**

```bash
mkdir -p /c/Users/USER/code/circle-project/worker
```

- [ ] **Step 2: wrangler.toml 생성**

`worker/wrangler.toml`:

```toml
name = "subtodoc-transcript"
main = "index.js"
compatibility_date = "2024-01-01"
```

- [ ] **Step 3: package.json 생성**

`worker/package.json`:

```json
{
  "name": "subtodoc-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

- [ ] **Step 4: Worker 구현**

`worker/index.js`:

```js
export default {
  async fetch(request) {
    const url = new URL(request.url)

    // CORS preflight 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      })
    }

    const videoId = url.searchParams.get('v')
    if (!videoId) {
      return new Response('Missing video ID', {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    // YouTube 페이지에서 captionTracks 추출
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    })
    const html = await pageRes.text()

    const match = html.match(/"captionTracks":(\[.*?\])/)
    if (!match) {
      return new Response('No captions found', {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const captionTracks = JSON.parse(match[1])
    const track = captionTracks.find(t => t.languageCode === 'en') || captionTracks[0]

    if (!track) {
      return new Response('No caption track available', {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 자막 XML 가져오기
    const transcriptRes = await fetch(track.baseUrl)
    const xml = await transcriptRes.text()

    // XML에서 텍스트 추출
    const text = xml
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()

    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  },
}
```

- [ ] **Step 5: Worker 로컬 테스트**

```bash
cd worker && npm install && npm run dev
```

다른 터미널에서:
```bash
curl "http://localhost:8787/transcript?v=dQw4w9WgXcQ"
```

Expected: 자막 텍스트 출력

- [ ] **Step 6: Worker 배포**

```bash
npm run deploy
```

배포 후 출력된 Worker URL을 복사해 `subtodoc/.env` 파일에 저장:

```
VITE_WORKER_URL=https://subtodoc-transcript.<your-username>.workers.dev
```

- [ ] **Step 7: 커밋**

```bash
cd ..
git add worker/
git commit -m "feat: add Cloudflare Worker for YouTube transcript proxy"
```

---

## Task 13: GitHub Pages 배포

**Files:**
- Modify: `subtodoc/vite.config.js` (base 이미 설정됨)

- [ ] **Step 1: 프로덕션 빌드 확인**

```bash
cd subtodoc && npm run build
```

Expected: `subtodoc/dist/` 생성, 오류 없음

- [ ] **Step 2: .env 파일로 Worker URL 빌드에 포함 확인**

`subtodoc/.env` (gitignore에서 제외되지 않도록 주의 — API 키 없음):

```
VITE_WORKER_URL=https://subtodoc-transcript.<your-username>.workers.dev
```

- [ ] **Step 3: gh-pages 배포**

```bash
npm run deploy
```

Expected: GitHub Pages에 배포 완료, URL 출력

- [ ] **Step 4: 배포된 앱 브라우저 확인**

`https://<your-username>.github.io/subtodoc/` 접속 후:
1. 설정 아이콘 클릭 → Groq API 키 입력 → 저장
2. YouTube URL 입력
3. 문서 형식 선택
4. 변환하기 클릭
5. 결과 확인 + .md 다운로드 확인

- [ ] **Step 5: 커밋**

```bash
cd ..
git add subtodoc/.env.example
git commit -m "docs: add deployment instructions and env example"
```
