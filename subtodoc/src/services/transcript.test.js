import {
  extractVideoId,
  fetchTranscript,
  fetchFromSupadata,
  fetchFromLocalServer,
} from './transcript'

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

describe('fetchTranscript (auto 모드)', () => {
  test('InnerTube API로 자막 URL을 가져온 뒤 Worker로 XML을 받아온다', async () => {
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

describe('fetchFromSupadata', () => {
  test('content 배열을 텍스트로 합친다', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: '안녕하세요' }, { text: '반갑습니다' }],
      }),
    })
    const result = await fetchFromSupadata('abc', 'key')
    expect(result).toBe('안녕하세요 반갑습니다')
  })

  test('content가 문자열이면 그대로 반환한다', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: '자막 전체 텍스트' }),
    })
    const result = await fetchFromSupadata('abc', 'key')
    expect(result).toBe('자막 전체 텍스트')
  })

  test('401이면 API 키 오류 메시지를 던진다', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 401 })
    await expect(fetchFromSupadata('abc', 'bad_key')).rejects.toThrow('API 키')
  })

  test('404이면 자막 없음 메시지를 던진다', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(fetchFromSupadata('abc', 'key')).rejects.toThrow('자막이 없습니다')
  })
})

describe('fetchFromLocalServer', () => {
  test('transcript 필드를 반환한다', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ transcript: '로컬 자막 텍스트' }),
    })
    const result = await fetchFromLocalServer('abc', 'http://localhost:8000')
    expect(result).toBe('로컬 자막 텍스트')
  })

  test('text 필드도 허용한다', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: '로컬 텍스트' }),
    })
    const result = await fetchFromLocalServer('abc', 'http://localhost:8000')
    expect(result).toBe('로컬 텍스트')
  })

  test('서버 오류시 에러를 던진다', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 })
    await expect(fetchFromLocalServer('abc', 'http://localhost:8000')).rejects.toThrow('로컬 서버 오류')
  })
})

describe('fetchTranscript 라우팅', () => {
  test('supadata provider면 Supadata API를 호출한다', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: 'Supadata 자막' }),
    })
    const result = await fetchTranscript('abc', {
      transcriptProvider: 'supadata',
      supadadataApiKey: 'test_key',
    })
    expect(result).toBe('Supadata 자막')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('supadata.ai'),
      expect.any(Object)
    )
  })

  test('supadata API 키 없으면 에러를 던진다', async () => {
    await expect(
      fetchTranscript('abc', { transcriptProvider: 'supadata', supadadataApiKey: '' })
    ).rejects.toThrow('API 키를 설정에서 입력해주세요')
  })

  test('local provider면 로컬 서버를 호출한다', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ transcript: '로컬 자막' }),
    })
    const result = await fetchTranscript('abc', {
      transcriptProvider: 'local',
      localServerUrl: 'http://localhost:8000',
    })
    expect(result).toBe('로컬 자막')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('localhost:8000')
    )
  })
})
