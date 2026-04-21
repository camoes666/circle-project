# SubToDoc Multi-Provider Plan

> **목표**: AI 모델을 3개로 확장 — Groq llama-4-scout (기본) / Groq gpt-oss-120b / Gemini Flash  
> **핵심 발견**: `openai/gpt-oss-120b`는 Groq API에서 실행되는 모델 → OpenAI SDK 불필요, groq-sdk 하나로 처리  
> **원칙**: ai.js에 GROQ_MODELS 맵 추가, provider를 'groq'|'groq-oss'|'gemini'로 구분, API 키는 Groq 2개 모델이 공유

---

## 현재 상태

| Provider | ai.js | useSettings | SettingsModal UI |
|---|---|---|---|
| Groq (기본) | ✅ callGroq | ✅ groqApiKey | ✅ 버튼 |
| Gemini Flash | ✅ callGemini | ✅ geminiApiKey | ✅ 버튼 |
| **OpenAI** | ❌ 없음 | ❌ 없음 | ❌ 없음 |

---

## 변경 파일 지도

```
subtodoc/
├── package.json               ← openai 패키지 추가
└── src/
    ├── services/
    │   └── ai.js              ← callOpenAI 함수 추가
    ├── hooks/
    │   └── useSettings.js     ← openaiApiKey 기본값 추가
    └── components/
        └── SettingsModal.jsx  ← OpenAI 버튼 + API 키 입력
```

---

## Task 1: openai 패키지 설치

```bash
cd subtodoc && npm install openai
```

---

## Task 2: ai.js — callOpenAI 추가

**파일**: `subtodoc/src/services/ai.js`

```js
import OpenAI from 'openai'

const OPENAI_MODEL = 'gpt-oss-120b'

async function callOpenAI(transcript, prompt, apiKey) {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt + transcript }],
  })
  return completion.choices[0].message.content
}
```

`generateDocument`에 분기 추가:
```js
if (settings.provider === 'openai') {
  if (!settings.openaiApiKey) throw new Error('OpenAI API 키를 설정해주세요.')
  return callOpenAI(transcript, prompt, settings.openaiApiKey)
}
```

- [ ] callOpenAI 함수 작성
- [ ] generateDocument 분기 추가

---

## Task 3: useSettings.js — openaiApiKey 기본값 추가

**파일**: `subtodoc/src/hooks/useSettings.js`

```js
const DEFAULTS = {
  provider: 'groq',       // 기본값 유지
  groqApiKey: '',
  geminiApiKey: '',
  openaiApiKey: '',       // 신규
  language: '한국어',
  transcriptProvider: 'supadata',
  supadadataApiKey: '',
  localServerUrl: 'http://localhost:8000',
}
```

- [ ] openaiApiKey 기본값 추가

---

## Task 4: SettingsModal.jsx — 3개 버튼 + OpenAI API 키 입력

**파일**: `subtodoc/src/components/SettingsModal.jsx`

현재 2개 버튼 → 3개 버튼으로 교체:

```jsx
const AI_PROVIDERS = [
  { id: 'groq',   label: 'Groq',   badge: '기본', desc: 'llama-4-scout · 무료' },
  { id: 'openai', label: 'OpenAI', badge: '',     desc: 'gpt-oss-120b' },
  { id: 'gemini', label: 'Gemini', badge: '',     desc: 'gemini-1.5-flash' },
]
```

API 키 입력 필드도 3개 provider에 맞춰 동적으로 표시:
```jsx
const keyField = {
  groq:   { key: 'groqApiKey',   placeholder: 'gsk_...',    link: 'https://console.groq.com' },
  openai: { key: 'openaiApiKey', placeholder: 'sk-...',     link: 'https://platform.openai.com/api-keys' },
  gemini: { key: 'geminiApiKey', placeholder: 'AIza...',    link: 'https://aistudio.google.com/app/apikey' },
}
```

- [ ] AI_PROVIDERS 배열 정의
- [ ] 버튼 3개로 교체
- [ ] API 키 필드를 provider에 따라 동적 표시 (placeholder + 발급 링크)
- [ ] 커밋

---

## Task 5: 수동 검증

| 시나리오 | 확인 |
|---|---|
| 설정 화면에 Groq / OpenAI / Gemini 3개 버튼 표시 | ☐ |
| Groq 선택 → Groq API 키 입력창 표시 | ☐ |
| OpenAI 선택 → OpenAI API 키 입력창 표시 | ☐ |
| Gemini 선택 → Gemini API 키 입력창 표시 | ☐ |
| 기본값이 Groq임 확인 | ☐ |
| OpenAI로 실제 변환 동작 확인 | ☐ |

---

## 의존 관계

```
Task 1 (npm install openai)
  └── Task 2 (ai.js callOpenAI)
      └── Task 3 (useSettings openaiApiKey)  ← 병렬 가능
      └── Task 4 (SettingsModal UI)          ← 병렬 가능
Task 5 (검증+배포) ← 전체 완료 후
```

---

## 설계 노트

- `openai` 패키지는 `dangerouslyAllowBrowser: true` 옵션 필요 (브라우저 환경)
- 긴 자막 청크 처리는 Groq와 동일한 패턴 적용 가능 (CHUNK_SIZE 공유)
- 모델명 `gpt-oss-120b` — OpenAI API에서 지원하지 않을 경우 `gpt-4o-mini` 등으로 폴백 가능
- 빌드 번들 크기: openai 패키지 추가로 ~50-100 kB 증가 예상
