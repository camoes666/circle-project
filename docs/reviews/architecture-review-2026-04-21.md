# Architecture Review — 2026-04-21 (v2 설계 기준)

## 컨텍스트

- **서비스**: YouTube URL → 자막 추출 → AI 문서 변환, 단일 화면 웹앱 [확인됨]
- **주 사용자**: 소수 지인 [확인됨]
- **변화**: v2 4개 신기능 추가 예정 — 영상 임베드, 타임스탬프, 직접 지시하기, 히스토리
- **이전 리뷰**: 2026-04-16 — 현재 구조 유지 권장 (단, handleConvert 분기 성장 모니터링 주의)

> 이번 라운드는 v2 기능이 추가되었을 때 아키텍처가 버티는지, 그리고 어떤 준비가 필요한지 진단한다.

---

## 요약

- **진단 대상**: v2 이후 예상 구조 (14개 → 17개 소스 파일)
- **주요 증상**: `videoId`가 여러 곳에서 필요해지며 파생 없이 분산될 위험
- **권장 패턴**: 단일 변경 — `videoId`를 파생 상태(`useMemo`)로 끌어올리기
- **플랜 스킬 호출 필요**: No (변경 범위 1개, 방향 명확)

---

## Phase 1 — 상태 지도 (v2 이후 예상)

| 값의 정체성 | v1 쓰기 지점 | v2 읽기 지점 추가 | 중복 위험 |
|---|---|---|---|
| **videoId** | `handleConvert` 지역 변수 | VideoPreview, ResultViewer(타임스탬프 링크), useHistory 저장 | ⚠️ **분산 위험** |
| 입력 URL | App.jsx `setUrl` | UrlInput, handleConvert, useHistory | ❌ 단일 |
| 선택 형식 | App.jsx `setFormat` | FormatSelector, handleConvert, useHistory | ❌ 단일 |
| 타임스탬프 ON/OFF | 신규 `setIncludeTimestamps` | FormatSelector, handleConvert, useHistory | ❌ 단일 |
| 커스텀 지시 | 신규 `setCustomInstruction` | FormatSelector, handleConvert, useHistory | ❌ 단일 |
| 변환 결과 | App.jsx `setResult` | ResultViewer(+ videoId), ExportButtons, useHistory | ❌ 단일 |
| 히스토리 목록 | `useHistory.addEntry` | HistoryPanel | ❌ 단일 |
| 설정 | `useSettings` | SettingsModal, handleConvert | ❌ 단일 |

→ **문제는 `videoId` 하나.** 나머지 상태는 단일 출처 원칙 유지.

---

## Phase 2 — 이벤트 지도 (v2 이후 예상)

| 이벤트 | 핸들러 | 일관성 |
|---|---|---|
| 변환 버튼 클릭 | `App.jsx handleConvert` (1곳) | ✅ |
| URL 입력 | → `setUrl` | ✅ |
| 탭 전환 | 인라인 onClick | ✅ |
| 형식 선택 | → `setFormat` | ✅ |
| 타임스탬프 토글 | → `setIncludeTimestamps` | ✅ |
| 직접 지시 입력 | → `setCustomInstruction` | ✅ |
| 히스토리 복원 | `handleRestore` (1곳) | ✅ |
| 히스토리 삭제 | `removeEntry` | ✅ |
| 설정 저장 | `updateSettings` | ✅ |

→ 이벤트 분산 없음. `handleConvert`가 분기 2개(URL/붙여넣기)에서 v2 이후에도 2개 유지 — 입력 모드 추가 없으므로 안전.

---

## Phase 3 — 의존 방향 지도 (v2 이후 예상)

```
App.jsx
├── → VideoPreview         (videoId)               ← 신규
├── → UrlInput             (value, onChange)
├── → FormatSelector       (selected, onChange,
│                           includeTimestamps, onTimestampsChange,
│                           customInstruction, onCustomInstructionChange)  ← props 증가
├── → ResultViewer         (content, videoId)       ← videoId 추가
├── → ExportButtons        (content)
├── → TranscriptPaste      (value, onChange)
├── → SettingsModal        (settings, onSave, onClose)
├── → HistoryPanel         (history, onRestore, onRemove, onClear)  ← 신규
├── → useSettings          (hook)
├── → useHistory           (hook)                   ← 신규
├── → transcript.js        (extractVideoId, fetchTranscript)
├── → prompts.js           (buildPrompt)
└── → ai.js                (generateDocument)
```

→ 여전히 단방향. 순환 없음.  
→ FormatSelector props가 4 → 8개로 늘어남 — 아직 허용 범위이나 모니터링 필요.

---

## 핵심 발견 — videoId 분산 위험

### 현재 (v1)
```js
// handleConvert 내부 지역 변수 — 함수 밖으로 나가지 않음
const videoId = extractVideoId(url)
```

### v2에서 필요한 곳
1. **VideoPreview** — URL 입력 즉시 필요 (handleConvert 호출 전)
2. **ResultViewer** — 결과 표시 시 타임스탬프 링크에 필요
3. **useHistory.addEntry** — 히스토리 저장 시 필요

만약 지역 변수 그대로 두면:
- VideoPreview는 `url`을 받아서 내부에서 `extractVideoId` 재호출 → **동일 로직 2곳 실행**
- ResultViewer는 별도 state로 저장해야 함 → **상태 중복**
- 히스토리 저장 시 handleConvert 내부에서만 접근 가능 → **의존 누적**

---

## 선택된 패턴 및 근거

**패턴: Single Source of Truth (국소 적용)**  
범위: `videoId` 하나.

`url`에서 `videoId`는 순수하게 파생되는 값이다 (`extractVideoId(url)`는 순수 함수). React에서 파생 값의 정석은 `useMemo`:

```js
const videoId = useMemo(() => extractVideoId(url), [url])
```

이렇게 하면:
- VideoPreview, ResultViewer, handleConvert, useHistory — 모두 같은 `videoId`를 읽음
- `extractVideoId` 호출이 1곳으로 통일
- `url`이 바뀔 때만 재계산 (불필요한 재렌더링 없음)

**다른 패턴은 필요 없다.** FormatSelector props 증가는 현재 수준에서 허용 범위 내다.

---

## 방향 제안

- **패턴**: 국소 SSOT — `videoId` useMemo 파생
- **적용 범위**: `App.jsx` 단 1곳 변경 (2줄)
- **개괄 접근**: `handleConvert` 내부의 `const videoId = extractVideoId(url)` 제거, 컴포넌트 최상단에 `useMemo` 버전으로 대체. 이후 VideoPreview, ResultViewer, useHistory는 이 값을 prop으로 받아 사용.
- **주의점**: `useMemo`의 videoId는 URL 탭에서만 의미 있음. 붙여넣기 탭에서는 null. ResultViewer에서 videoId가 null이면 타임스탬프 링크를 렌더링하지 않는다는 조건 처리 필요.
- **Golden Master 필요**: No (변경 범위가 2줄, 기존 테스트가 검증 역할)

---

## 대기 리스트

- **FormatSelector props 과부하**: 현재 8개로 늘어남. 10개 초과 시 `useConvertOptions` 훅으로 묶는 것 고려 (v3 이후)
- **handleConvert 길이**: v2에서 히스토리 저장 로직 추가로 ~60줄 예상. 80줄 넘으면 `useConvert` 훅 분리 고려
- **히스토리 20개 한도**: 장기 사용자는 데이터 손실 가능. IndexedDB 마이그레이션은 Won't 범위 유지

---

## 다음 단계 — 플랜 작성

방향 제안은 명확하고 단순합니다 (`useMemo` 2줄 변경). 플랜 스킬 없이 바로 `docs/superpowers/plans/2026-04-21-subtodoc-v2-plan.md`의 **Task 1**부터 실행하면 됩니다.

Task 1 완료 후 Task 2~7을 순서대로 진행하세요.
