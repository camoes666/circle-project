# Architecture Review — 2026-04-16

## 컨텍스트 (자동 추론 + 사용자 확인)

- **서비스**: YouTube URL → 자막 추출 → AI 문서 변환, 단일 화면 웹앱 [추론]
- **코드베이스 규모**: ~25 파일 (테스트 포함), React 18 + Vite + Tailwind CSS [추론]
- **주요 도메인(추정)**: Transcript, AI, Settings, Format [추론]
- **주 사용자**: 소수 지인 [확인됨]
- **다음 기능 계획**: 없음 [확인됨]

> ℹ️ 이 컨텍스트는 이번 진단 한 번에만 사용됩니다. 규모가 커지거나 팀이 생기면 `service-design` 스킬로 원칙 문서를 만드세요.

---

## 요약

- **진단 대상**: 14개 소스 파일 (테스트 제외)
- **주요 증상**: 없음 (하기 참조)
- **권장 패턴**: 현재 구조 유지
- **플랜 스킬 호출 필요 여부**: No

---

## Phase 1 — 상태 지도 (State Map)

| 값의 정체성 | 쓰기 지점 | 읽기 지점 | 중복 여부 |
|---|---|---|---|
| 입력 URL | `App.jsx` `setUrl` | `UrlInput`(prop), `handleConvert` | ❌ 단일 |
| 선택 형식 | `App.jsx` `setFormat` | `FormatSelector`(prop), `handleConvert` | ❌ 단일 |
| 변환 결과 | `App.jsx` `setResult` | `ResultViewer`(prop), `ExportButtons`(prop) | ❌ 단일 |
| 로딩 상태 | `App.jsx` `setLoading` | 변환 버튼 disabled/spinner | ❌ 단일 |
| 에러 | `App.jsx` `setError` | 에러 카드 | ❌ 단일 |
| 활성 탭 | `App.jsx` `setActiveTab` | 탭 UI, `handleConvert` | ❌ 단일 |
| 수동 자막 | `App.jsx` `setManualTranscript` | `TranscriptPaste`(prop), `handleConvert` | ❌ 단일 |
| 설정 | `useSettings` (localStorage + React state) | `SettingsModal`(지역 복사), `handleConvert` | ⚠️ 지역 복사는 Cancel/Save 패턴으로 의도적 |

→ **상태 중복 없음.** 모든 값이 단일 출처에서 관리.

---

## Phase 2 — 이벤트 지도 (Event Map)

| 이벤트 | 핸들러 위치 | 해석 일관성 |
|---|---|---|
| 변환 버튼 클릭 | `App.jsx` `handleConvert` (1곳) | ✅ 단일 |
| URL 입력 변경 | `UrlInput` → `App.jsx` `setUrl` | ✅ |
| 탭 전환 | `App.jsx` 인라인 `onClick` | ✅ |
| 형식 선택 | `FormatSelector` → `App.jsx` `setFormat` | ✅ |
| 설정 저장 | `SettingsModal.handleSave` → `useSettings.updateSettings` | ✅ |
| 자막 입력 | `TranscriptPaste` → `App.jsx` `setManualTranscript` | ✅ |

→ **이벤트 분산 없음.** 각 이벤트는 단일 핸들러로 일관되게 처리.

---

## Phase 3 — 의존 방향 지도

```
App.jsx
├── → UrlInput           (value, onChange)
├── → FormatSelector     (selected, onChange)
├── → ResultViewer       (content)
├── → ExportButtons      (content)
├── → TranscriptPaste    (value, onChange)
├── → SettingsModal      (settings, onSave, onClose)
├── → useSettings        (hook)
├── → transcript.js      (extractVideoId, fetchTranscript)
├── → prompts.js         (buildPrompt)
└── → ai.js              (generateDocument)
```

→ **완전 단방향. 순환 없음. 내부 관통 없음.**  
→ 자식 컴포넌트가 부모 내부를 직접 접근하는 경우 없음.

---

## 과대설계 필터 (Anti-YAGNI) 통과 여부

| 조건 | 결과 |
|---|---|
| 앱이 한 화면/한 플로우 규모 | ✅ 해당 — intent-review로 충분 |
| 중복 상태 ≤ 2곳, 동기화 버그 이력 없음 | ✅ 해당 |
| 이벤트 핸들러가 독립적으로 분산 없음 | ✅ 해당 |
| 다음 기능 추가 계획 없음 | ✅ 해당 |
| 테스트 커버리지 존재(관찰 도구 있음) | ✅ 해당 — `*.test.js` 파일 존재 |

→ **5개 조건 모두 해당. 패턴 도입 권장 안 함.**

---

## 선택된 패턴 및 근거

**패턴: 없음 (현재 구조 유지)**

진단 결과 세 가지 지도(상태/이벤트/의존) 모두에서 문제 증상이 발견되지 않았습니다. 상태는 `App.jsx`에 집중되어 있지만 단일 소스 원칙이 지켜지고 있고, 이벤트는 각각 단일 핸들러로 수렴하며, 의존 방향은 완전히 단방향입니다.

패턴을 도입하는 것이 도리어 과대설계입니다.

---

## 방향 제안

**패턴**: 없음 (현상 유지 권장)

**단, 미래에 주의할 성장 지점 1건:**

`App.jsx`의 `handleConvert`는 현재 URL 모드와 붙여넣기 모드 두 분기를 하나의 함수(약 35줄)로 처리합니다. 지금 이 크기는 전혀 문제없습니다. 그러나 세 번째 입력 모드(예: 파일 업로드, Shorts 지원 등)가 생길 경우 분기가 누적되어 함수의 의도와 구현이 어긋나기 시작합니다. 그때 `useConvert` 훅 추출을 고려하면 충분하며, **지금 하면 과대설계**입니다.

**Golden Master 필요**: No

---

## 대기 리스트 (이번 라운드 적용 안 함)

- `handleConvert` 분기 성장 모니터링 → 세 번째 입력 모드가 생길 때 재평가
- `SettingsModal`의 지역 복사 패턴이 필드가 늘어날 때 drift 발생 가능 → 필드 10개 초과 시 재평가

---

## 다음 단계 — 플랜 작성

현재 구조 유지가 권장되므로 **플랜 스킬 호출은 필요하지 않습니다.**

코드 품질 관점에서 추가적인 점검이 필요하다면 `intent-review`로 함수 단위 이름/구현 일치 여부를 확인하는 것이 다음 적절한 단계입니다.
