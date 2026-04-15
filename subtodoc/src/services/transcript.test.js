import { extractVideoId, fetchTranscript } from './transcript'

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
  test('InnerTube API로 자막 URL을 가져온 뒤 Worker로 XML을 받아온다', async () => {
    // 1차 호출: InnerTube API
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              { languageCode: 'ko', baseUrl: 'https://youtube.com/api/timedtext?v=abc' },
            ],
          },
        },
      }),
    })
    // 2차 호출: Worker 프록시 (XML 반환)
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<transcript><text>자막 텍스트</text></transcript>'),
    })

    const result = await fetchTranscript('dQw4w9WgXcQ')
    expect(result).toBe('자막 텍스트')
  })

  test('자막이 없으면 에러를 던진다', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ captions: null }),
    })
    await expect(fetchTranscript('badid')).rejects.toThrow('이 영상에는 자막이 없습니다.')
  })

  test('InnerTube API 응답이 실패하면 에러를 던진다', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 403 })
    await expect(fetchTranscript('badid')).rejects.toThrow('YouTube API 오류: 403')
  })
})
