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
