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
