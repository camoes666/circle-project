# hooks/

React 커스텀 훅 모음. 상태 관리와 사이드이펙트를 컴포넌트에서 분리한다.

## useSettings

AI 제공자, API 키, 언어, 자막 소스 설정을 localStorage에 영속화한다.

```js
const { settings, updateSettings } = useSettings()
```

**기본값**:
```js
{
  provider: 'groq',
  groqApiKey: '',
  geminiApiKey: '',
  language: '한국어',
  transcriptProvider: 'supadata',
  supadadataApiKey: '',
  localServerUrl: 'http://localhost:8000',
}
```

`updateSettings(partial)` 호출 시 기존 값과 병합 후 localStorage 저장.

---

## useHistory _(v2 예정)_

변환 히스토리를 localStorage에 최대 20개 저장·관리한다.

```js
const { history, addEntry, removeEntry, clearHistory } = useHistory()
```

저장 항목 구조:
```js
{
  id: number,          // Date.now()
  createdAt: string,   // ISO 8601
  url: string,
  videoId: string | null,
  format: string,
  result: string,
  customInstruction: string,
  includeTimestamps: boolean,
}
```
