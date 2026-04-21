# services/

비즈니스 로직 레이어. UI와 분리되어 있으며, 각 파일은 단일 도메인을 담당한다.

## transcript.js — 자막 추출

YouTube 영상에서 자막 텍스트를 가져오는 통합 진입점.

```js
fetchTranscript(videoId, settings)
// settings.transcriptProvider: 'supadata' | 'local' | 'auto'
// settings.withTimestamps: boolean (v2)
```

| 제공자 | 방식 | 한계 |
|--------|------|------|
| `supadata` | api.supadata.ai 호출 | 무료 10회/일 |
| `local` | 로컬 Python 서버 호출 | 서버 직접 실행 필요 |
| `auto` | YouTube InnerTube API + CORS Worker | 서버 IP에서 차단될 수 있음 |

내보내는 함수:
- `extractVideoId(url)` — URL에서 videoId 파싱
- `fetchTranscript(videoId, settings)` — 자막 텍스트 반환
- `fetchFromSupadata(videoId, apiKey, withTimestamps?)` — Supadata 직접 호출
- `fetchFromLocalServer(videoId, serverUrl)` — 로컬 서버 직접 호출

---

## ai.js — AI 문서 생성

자막 텍스트와 프롬프트를 받아 AI API를 호출하고 결과 텍스트를 반환한다.

```js
generateDocument(transcript, prompt, settings)
// settings.provider: 'groq' | 'gemini'
```

- **Groq**: `meta-llama/llama-4-scout-17b-16e-instruct`, 청크 처리 내장 (80K자 초과 시 분할 요약)
- **Gemini**: `gemini-1.5-flash`

---

## prompts.js — 프롬프트 빌더

문서 형식별 AI 지시문 관리.

```js
FORMATS        // 형식 목록 (id, label, instruction)
buildPrompt(formatId, language?, options?)
// options.includeTimestamps: boolean
// options.customInstruction: string
```

형식: `summary` / `blog` / `minutes` / `notes`

---

## export.js — 내보내기

변환 결과를 다양한 형식으로 내보낸다.

```js
copyToClipboard(text)       // 클립보드 복사
downloadMarkdown(text, filename?)  // .md 파일 다운로드
downloadPdf(text, filename?)       // PDF 저장 (html2pdf.js)
```
