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
  // v3 formats
  // 마인드맵: 계층 구조 헤딩으로 표현, 기존 마크다운 파서로 렌더링
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
  // 슬라이드: "---" 구분자 계약 — ResultViewer의 split(/\n---\n/) 파서와 일치해야 함
  {
    id: 'slides',
    label: '슬라이드',
    instruction: `발표용 슬라이드를 아래 형식으로 작성해줘. 반드시 이 형식을 정확히 지켜줘.

## 슬라이드 제목
- 핵심 내용 1
- 핵심 내용 2
- 핵심 내용 3

---

## 다음 슬라이드 제목
- 핵심 내용 1
- 핵심 내용 2

---

## 또 다음 슬라이드 제목
- 핵심 내용 1

⚠️ 반드시 각 슬라이드 사이에 빈 줄 + "---" + 빈 줄 형식으로 구분해줘.
슬라이드는 5-8개로 구성하고, 각 슬라이드마다 반드시 ## 제목과 - 불릿 포인트를 포함해줘.`,
  },
  // 트위터: "---" 구분자 계약 — ResultViewer의 split(/\n---\n/) 파서와 일치해야 함
  {
    id: 'twitter',
    label: '트위터',
    instruction: `트위터 스레드를 아래 형식으로 작성해줘. 반드시 이 형식을 정확히 지켜줘.

첫 번째 트윗 내용 (강렬한 훅으로 시작)

---

두 번째 트윗 내용

---

세 번째 트윗 내용

---

마지막 트윗 내용 (핵심 요약 또는 CTA)

⚠️ 반드시 각 트윗 사이에 빈 줄 + "---" + 빈 줄 형식으로 구분해줘.
각 트윗은 반드시 280자 이내. 5-8개 트윗으로 구성. 트윗 번호(1/, 2/ 등)는 붙이지 마.`,
  },
  // LinkedIn: 해시태그 파싱은 ResultViewer가 담당
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
]

export function buildPrompt(formatId, language = '한국어', options = {}) {
  const { includeTimestamps = false, customInstruction = '' } = options
  const format = FORMATS.find(f => f.id === formatId)

  let prompt = `다음 YouTube 영상 자막을 ${language}로 변환해줘.\n${format.instruction}\n`

  if (includeTimestamps) {
    prompt += `중요한 내용마다 가까운 타임스탬프를 [MM:SS] 형식으로 포함해줘. 예: [01:23] 핵심 내용\n`
  }

  if (customInstruction.trim()) {
    prompt += `추가 지시사항: ${customInstruction.trim()}\n`
  }

  return prompt + '\n자막:\n'
}
