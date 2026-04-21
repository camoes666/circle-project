# Architecture Review — 2026-04-21 (v3 설계 기준)

## 컨텍스트

- **서비스**: YouTube URL → 자막 추출 → AI 문서 변환, 단일 화면 웹앱
- **현재 버전**: v2 완료 (8개 소스 파일 + 3개 훅/서비스 추가)
- **v3 변화**: 출력 형식 4개 추가 (마인드맵, 슬라이드, 트위터, LinkedIn)
- **이전 리뷰**: 2026-04-21 v2 — `videoId` useMemo 파생으로 해결

---

## 요약

- **진단 대상**: v3 기능 추가 후 예상 구조
- **주요 증상**: ResultViewer에 format-aware 렌더링 로직 누적 가능성
- **권장 패턴**: 현재 구조 유지. `format` prop 추가 + 내부 분기로 충분.
- **플랜 스킬 호출 필요**: No

---

## Phase 1 — 상태 지도 (v3 이후)

| 값의 정체성 | 쓰기 지점 | 읽기 지점 | 중복 여부 |
|---|---|---|---|
| 선택 형식 | `App.jsx setFormat` | FormatSelector(prop), handleConvert, ResultViewer(prop), useHistory | ❌ 단일 |
| 나머지 상태 | v2와 동일 | v2와 동일 | ❌ 단일 |

→ v3 추가로 새로운 상태 중복 없음. `format`이 ResultViewer까지 흐르는 경로가 추가되는 것뿐.

---

## Phase 2 — 이벤트 지도 (v3 이후)

변화 없음. 형식 선택은 기존 `FormatSelector → setFormat` 경로 그대로.  
4개 새 형식은 기존 핸들러에 완전히 흡수됨.

---

## Phase 3 — 의존 방향 지도 (v3 이후)

```
App.jsx
├── → FormatSelector  (selected, onChange, + 기존 v2 props)
│       ↑ FORMAT_GROUPS 상수 추가 (내부 변경, 외부 인터페이스 불변)
├── → ResultViewer    (content, videoId, format)  ← format 추가
│       ↑ TweetCards, SlideCards 내부 컴포넌트 추가
└── → (나머지 동일)
```

→ 단방향 유지. 순환 없음. 내부 관통 없음.

---

## 핵심 발견 — ResultViewer 렌더링 분기 성장

### 현재 (v2)
ResultViewer는 `content`와 `videoId`만 받아 단일 마크다운 파서로 렌더링.

### v3 이후 예상
`format` prop을 받아 `twitter` / `slides` / 나머지로 분기:

```
format === 'twitter'  → TweetCards
format === 'slides'   → SlideCards
그 외                 → 기존 parseMarkdown
```

### Anti-YAGNI 필터 통과 여부

| 조건 | 결과 |
|---|---|
| 앱이 한 화면 규모 | ✅ 여전히 단일 화면 |
| 분기가 ≤ 3개 | ✅ twitter / slides / default — 딱 3개 |
| 각 분기가 독립적 (공유 상태 없음) | ✅ 내용만 다름 |
| 새 형식 추가 시 파일 수정 ≤ 3개 | ✅ prompts + FormatSelector + ResultViewer |

→ **현재 구조로 충분. 레지스트리 패턴은 과대설계.**

---

## 선택된 패턴

**패턴: 없음 (단순 prop 추가 + 내부 분기)**

`format` prop 1개 추가와 ResultViewer 내부 분기 2개(twitter/slides)로 모든 요구사항이 해결됨.  
외부 아키텍처 변화 없음.

---

## 방향 제안

- **패턴**: 해당 없음
- **적용 범위**: 4개 파일 수정 (prompts.js, FormatSelector.jsx, ResultViewer.jsx, App.jsx)
- **개괄 접근**: FORMATS 배열 확장 → FormatSelector에 그룹 섹션 추가 → ResultViewer에 format prop + 분기 렌더러 추가 → App.jsx에서 format 전달. 각 단계가 독립적이고 롤백 가능.
- **주의점**: 트위터/슬라이드의 `---` 구분자는 프롬프트와 파서 사이의 "계약". 프롬프트가 `---`를 생략하면 파서가 단일 블록으로 렌더링됨. 이 계약을 `prompts.js` 주석으로 명시해야 함.
- **Golden Master 필요**: No

---

## 대기 리스트

- **렌더러 레지스트리 패턴**: 형식이 10개 이상으로 늘면 `{ [formatId]: RendererComponent }` 객체로 분리 고려. 현재는 3개 분기로 관리 가능.
- **LinkedIn 해시태그 클릭**: `#해시태그` 클릭 시 해당 해시태그 Twitter/LinkedIn 검색 링크 — 현재 범위 외. 요청 시 추가.
- **슬라이드 이미지 export**: 슬라이드 카드를 PNG/PPTX로 내보내기 — 의존성 추가 필요. 현재 범위 외.

---

## 다음 단계

`docs/superpowers/plans/2026-04-21-subtodoc-v3-plan.md` Task 1부터 순서대로 실행.
