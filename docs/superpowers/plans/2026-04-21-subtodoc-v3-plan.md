# SubToDoc v3 Implementation Plan

> **목표**: 마인드맵·슬라이드·트위터 스레드·LinkedIn 포스트 4개 출력 형식 추가  
> **기반**: v2 완성 코드베이스 위에 추가. 기존 패턴(FORMATS 배열, FORMAT_META) 그대로 확장.  
> **원칙**: 각 Task는 독립 커밋 가능. 새 형식 추가는 prompts.js → FormatSelector → ResultViewer 순.

---

## 변경 파일 지도

```
subtodoc/src/
├── services/
│   └── prompts.js          ← 수정 (FORMATS 4개 추가)
├── components/
│   ├── FormatSelector.jsx  ← 수정 (FORMAT_META 4개 추가, 그룹 섹션 UI)
│   └── ResultViewer.jsx    ← 수정 (format prop 추가, 트위터·슬라이드 특수 렌더링)
└── App.jsx                 ← 수정 (format을 ResultViewer에 전달)
```

핵심 원칙: **prompts.js는 AI 지시문만 관리, 렌더링 판단은 ResultViewer가 담당.**  
새 형식이 추가돼도 App.jsx는 format state를 넘겨주기만 하면 됨.

---

## Task 1: prompts.js — 4개 형식 추가

**파일**: `subtodoc/src/services/prompts.js`

FORMATS 배열에 4개 추가:

```js
{
  id: 'mindmap',
  label: '마인드맵',
  instruction: `마인드맵 형식으로 정리해줘.
중심 주제를 # 제목으로, 대분류를 ## 제목으로, 소분류를 - 불릿으로 표현해줘.
계층이 명확하게 보이도록 들여쓰기를 유지해줘. 예시:
# 중심 주제
## 대분류 1
- 소분류 1.1
  - 세부 내용
- 소분류 1.2
## 대분류 2
- 소분류 2.1`,
},
{
  id: 'slides',
  label: '슬라이드',
  instruction: `발표용 슬라이드 구성으로 작성해줘.
각 슬라이드는 "---"로 구분하고, 슬라이드 제목은 ## 로 표시해줘.
각 슬라이드에 핵심 내용 3-5개를 불릿 포인트로 작성해줘.
5-8개 슬라이드 분량으로 구성해줘.`,
},
{
  id: 'twitter',
  label: '트위터',
  instruction: `트위터 스레드 형식으로 작성해줘.
각 트윗은 "---"로 구분하고, 반드시 280자 이내로 작성해줘.
첫 번째 트윗은 강렬한 훅으로 시작하고, 마지막 트윗은 핵심 요약 또는 CTA로 마무리해줘.
5-8개 트윗으로 구성해줘. 번호(1/, 2/ 등)는 붙이지 마.`,
},
{
  id: 'linkedin',
  label: 'LinkedIn',
  instruction: `LinkedIn 포스트 형식으로 작성해줘.
다음 구조를 따라줘:
1. 강렬한 첫 줄 (훅) — 독자의 시선을 잡는 한 문장
2. 빈 줄
3. 핵심 내용 — 이모지와 불릿 포인트로 3-5개 항목 정리
4. 빈 줄
5. 통찰이나 질문으로 마무리 (독자 참여 유도)
6. 빈 줄
7. 관련 해시태그 3-5개 (#으로 시작)`,
},
```

- [ ] **Step 1**: FORMATS 배열에 4개 항목 추가

- [ ] **Step 2**: 기존 테스트 통과 확인

```bash
cd subtodoc && npm run test:run -- src/services/prompts.test.js
```

Expected: PASS (기존 테스트 모두 통과, 새 형식은 buildPrompt 로직 변경 없으므로 자동 호환)

- [ ] **Step 3**: 커밋

```bash
git add subtodoc/src/services/prompts.js
git commit -m "feat: add mindmap, slides, twitter, linkedin to FORMATS"
```

---

## Task 2: FormatSelector — 그룹 섹션 + 새 형식 카드

**파일**: `subtodoc/src/components/FormatSelector.jsx`

### FORMAT_META 추가

```js
const FORMAT_META = {
  // 기존
  summary: { emoji: '📋', desc: '핵심 내용을 간결하게' },
  blog:    { emoji: '✍️', desc: '블로그 포스트 형식으로' },
  minutes: { emoji: '🗒️', desc: '논의·결정·액션아이템' },
  notes:   { emoji: '📚', desc: '핵심 개념 학습 노트' },
  // 신규
  mindmap:  { emoji: '🗺️', desc: '계층 구조 트리로 시각화' },
  slides:   { emoji: '📊', desc: 'PPT용 슬라이드 구성' },
  twitter:  { emoji: '✦',  desc: '280자 트윗 카드 시리즈' },
  linkedin: { emoji: '💼', desc: '훅·본문·해시태그 구조' },
}
```

### UI 변경: 그룹 섹션으로 분리

8개 형식을 한 그리드에 나열하면 시각적으로 과부하. 두 섹션으로 나눈다:

```jsx
// 그룹 정의
const FORMAT_GROUPS = [
  {
    label: '문서',
    ids: ['summary', 'blog', 'minutes', 'notes'],
  },
  {
    label: '소셜 & 시각화',
    ids: ['mindmap', 'slides', 'twitter', 'linkedin'],
  },
]
```

렌더링:
```jsx
{FORMAT_GROUPS.map(group => (
  <div key={group.label} className="space-y-1.5">
    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
      {group.label}
    </p>
    <div className="grid grid-cols-2 gap-2">
      {group.ids.map(id => {
        const f = FORMATS.find(fmt => fmt.id === id)
        const meta = FORMAT_META[id]
        const isSelected = selected === id
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`...기존 카드 스타일...`}>
            ...
          </button>
        )
      })}
    </div>
  </div>
))}
```

- [ ] **Step 1**: FORMAT_META에 4개 추가
- [ ] **Step 2**: FORMAT_GROUPS 상수 추가
- [ ] **Step 3**: 단일 grid → 그룹 섹션 렌더링으로 교체
- [ ] **Step 4**: 커밋

```bash
git add subtodoc/src/components/FormatSelector.jsx
git commit -m "feat: add 4 new format cards with grouped sections in FormatSelector"
```

---

## Task 3: ResultViewer — format prop + 특수 렌더링

**파일**: `subtodoc/src/components/ResultViewer.jsx`

새 `format` prop을 추가하고, `twitter`와 `slides`에 대해 특수 카드 UI를 렌더링한다.  
`mindmap`과 `linkedin`은 기존 마크다운 파서로 충분히 표현 가능.

### 트위터 스레드 렌더링

```js
function parseTweets(content) {
  return content
    .split(/\n---\n|^---$/m)
    .map(t => t.trim())
    .filter(Boolean)
}

function TweetCards({ content }) {
  const tweets = parseTweets(content)
  return (
    <div className="space-y-3">
      {tweets.map((tweet, i) => {
        const charCount = tweet.length
        const isOver = charCount > 280
        return (
          <div key={i} className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">
                {i + 1} / {tweets.length}
              </span>
              <span className={`text-xs font-mono ${isOver ? 'text-red-400' : charCount > 240 ? 'text-yellow-400' : 'text-gray-600'}`}>
                {charCount} / 280
              </span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{tweet}</p>
            {/* 글자수 게이지 */}
            <div className="h-0.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((charCount / 280) * 100, 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### 슬라이드 렌더링

```js
function parseSlides(content) {
  return content
    .split(/\n---\n|^---$/m)
    .map(s => s.trim())
    .filter(Boolean)
    .map((slide, i) => {
      const lines = slide.split('\n')
      const titleLine = lines.find(l => /^#{1,3} /.test(l))
      const title = titleLine ? titleLine.replace(/^#+\s/, '') : `슬라이드 ${i + 1}`
      const bullets = lines
        .filter(l => /^[-*] /.test(l))
        .map(l => l.replace(/^[-*] /, ''))
      const rest = lines
        .filter(l => !(/^#+/.test(l)) && !(/^[-*] /.test(l)) && l.trim())
      return { title, bullets, rest, index: i + 1 }
    })
}

function SlideCards({ content }) {
  const slides = parseSlides(content)
  return (
    <div className="space-y-3">
      {slides.map(slide => (
        <div key={slide.index}
          className="bg-gray-800/40 border border-gray-700/60 rounded-xl overflow-hidden">
          {/* 슬라이드 헤더 */}
          <div className="bg-blue-600/10 border-b border-gray-700/40 px-4 py-2.5 flex items-center gap-2">
            <span className="text-xs text-blue-500 font-mono font-medium">
              {String(slide.index).padStart(2, '0')}
            </span>
            <h3 className="text-sm font-semibold text-gray-100">{slide.title}</h3>
          </div>
          {/* 슬라이드 내용 */}
          <div className="px-4 py-3 space-y-1.5">
            {slide.bullets.map((b, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-blue-400 flex-shrink-0">▸</span>
                <span>{b}</span>
              </div>
            ))}
            {slide.rest.map((line, i) => (
              <p key={`r${i}`} className="text-sm text-gray-400">{line}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### LinkedIn 해시태그 하이라이트

```js
function renderLinkedIn(content, videoId) {
  // 기존 마크다운 파서 + 해시태그 링크 강조
  // inlineMarkdown에 #해시태그 패턴 추가
  // #word → 파란 배지로 표시
}
```

### ResultViewer export 수정

```jsx
export default function ResultViewer({ content, videoId, format }) {
  // format에 따라 렌더링 분기
  const renderContent = () => {
    if (format === 'twitter') return <TweetCards content={content} />
    if (format === 'slides')  return <SlideCards content={content} />
    // mindmap, linkedin, 기존 형식 모두 마크다운 파서
    return <div className="space-y-0.5">{parseMarkdown(content, videoId, format)}</div>
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Toolbar — 동일 */}
      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}
```

- [ ] **Step 1**: `parseTweets` + `TweetCards` 컴포넌트 추가
- [ ] **Step 2**: `parseSlides` + `SlideCards` 컴포넌트 추가
- [ ] **Step 3**: `format` prop 추가, `renderContent()` 분기 로직
- [ ] **Step 4**: `inlineMarkdown`에 LinkedIn 해시태그 강조 추가 (format === 'linkedin' 시)
- [ ] **Step 5**: 커밋

```bash
git add subtodoc/src/components/ResultViewer.jsx
git commit -m "feat: add twitter thread cards and slide deck UI in ResultViewer"
```

---

## Task 4: App.jsx — format prop 전달

**파일**: `subtodoc/src/App.jsx`

ResultViewer에 `format` prop 추가 (1줄 변경):

```jsx
// Before
<ResultViewer content={result} videoId={activeTab === 'url' ? videoId : null} />

// After
<ResultViewer content={result} videoId={activeTab === 'url' ? videoId : null} format={format} />
```

- [ ] **Step 1**: ResultViewer에 format prop 추가
- [ ] **Step 2**: 전체 테스트 통과 확인

```bash
cd subtodoc && npm run test:run
```

- [ ] **Step 3**: 커밋

```bash
git add subtodoc/src/App.jsx
git commit -m "feat: pass format prop to ResultViewer for format-aware rendering"
```

---

## Task 5: 수동 검증 + 배포

시나리오별 수동 확인:

| 시나리오 | 확인 |
|---|---|
| 마인드맵 → 결과가 계층 구조 트리로 표시됨 | ☐ |
| 슬라이드 → 슬라이드 카드 UI, 번호+제목+불릿 표시 | ☐ |
| 트위터 → 트윗 카드, 글자 수 게이지 표시 | ☐ |
| LinkedIn → 해시태그 강조, 구조적 포스트 | ☐ |
| 기존 4개 형식 → 정상 동작 유지 | ☐ |
| 히스토리에 새 형식 저장·복원 | ☐ |

```bash
cd subtodoc && npm run build && # gh-pages 배포
```

---

## 의존 관계

```
Task 1 (prompts.js)  ← 먼저
  └── Task 2 (FormatSelector)  ← Task 1 완료 후
  └── Task 3 (ResultViewer)    ← 독립적으로 진행 가능
Task 4 (App.jsx)  ← Task 3 완료 후 (format prop 필요)
Task 5 (검증+배포)  ← 전체 완료 후
```

Tasks 2와 3은 병렬 진행 가능.

---

## 설계 노트

### 왜 ResultViewer에서 format 분기를 하는가?

형식별 렌더링 로직을 컴포넌트 파일에 두면:
- App.jsx는 `format` state를 ResultViewer에 넘기기만 하면 됨 (1줄)
- 새 형식 추가 시 `prompts.js` + `FormatSelector` + `ResultViewer`만 건드리면 됨
- App.jsx는 변경 없음

향후 형식이 10개 이상으로 늘면 `getFormatRenderer(format)` 팩토리 패턴으로 분리하면 됨 (현재는 과대설계).

### 트위터·슬라이드 구분자 규칙

AI가 `---`를 구분자로 사용하도록 프롬프트에 명시 → ResultViewer의 `split(/\n---\n/)` 파서와 계약 일치.  
이 "프롬프트 ↔ 파서" 계약은 `prompts.js` 주석으로 명시한다.
