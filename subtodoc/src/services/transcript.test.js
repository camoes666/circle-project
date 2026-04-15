import { extractVideoId, fetchTranscript } from './transcript'

// fetch mock
global.fetch = vi.fn()

afterEach(() => {
  vi.clearAllMocks()
})

describe('extractVideoId', () => {
  test('?v= 형식 URL을 파싱한다', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  test('youtu.be 단축 URL을 파싱한다', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  test('embed URL을 파싱한다', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  test('유효하지 않은 URL은 null을 반환한다', () => {
    expect(extractVideoId('https://example.com')).toBeNull()
    expect(extractVideoId('')).toBeNull()
  })
})

describe('fetchTranscript', () => {
  test('Worker URL에 videoId를 붙여 호출한다', async () => {
    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('자막 텍스트') })
    const result = await fetchTranscript('dQw4w9WgXcQ')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('dQw4w9WgXcQ'))
    expect(result).toBe('자막 텍스트')
  })

  test('응답이 ok가 아니면 에러를 던진다', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(fetchTranscript('badid')).rejects.toThrow('자막을 가져오지 못했습니다')
  })
})
