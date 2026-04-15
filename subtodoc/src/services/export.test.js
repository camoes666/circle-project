import { copyToClipboard, downloadMarkdown } from './export'

beforeEach(() => {
  // navigator.clipboard mock
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  })

  // URL mock
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()

  // document.createElement mock for anchor
  const originalCreateElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'a') {
      return { href: '', download: '', click: vi.fn(), style: {} }
    }
    return originalCreateElement(tag)
  })
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('copyToClipboard가 navigator.clipboard.writeText를 호출한다', async () => {
  await copyToClipboard('hello')
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello')
})

test('downloadMarkdown이 Blob을 생성하고 클릭을 트리거한다', () => {
  downloadMarkdown('# Title\nContent')
  expect(URL.createObjectURL).toHaveBeenCalled()
  const anchor = document.createElement.mock.results.find(r => r.value?.download !== undefined)?.value
  expect(anchor).toBeDefined()
})

test('downloadMarkdown이 .md 확장자를 사용한다', () => {
  downloadMarkdown('text', 'my-doc.md')
  const anchor = document.createElement.mock.results.find(r => r.value?.download !== undefined)?.value
  expect(anchor?.download).toBe('my-doc.md')
})
