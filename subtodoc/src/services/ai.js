/**
 * ════════════════════════════════════════════════════════════
 *  ai.js  —  AI(인공지능)에게 글 생성을 요청하는 파일
 * ════════════════════════════════════════════════════════════
 *
 * 지원하는 AI:
 * 1. Groq — Llama 4 Scout / OpenAI gpt-oss (Groq 서버)
 * 2. Gemini — Google Gemini 2.5 Flash Lite
 *
 * ── Groq TPM(분당 토큰) 한도 처리 ──
 *
 * llama-4-scout 모델의 속도 한도:
 *   - TPM: 30,000 토큰/분  (입력 + 출력 합산)
 *   - TPD: 500,000 토큰/일
 *
 * 긴 자막은 여러 조각(청크)으로 나눠서 처리해요.
 * 각 조각은 TPM 한도(30K) 안에 들어오도록 25,000글자 이하로 잘라요.
 * 한 분에 처리할 수 있는 토큰이 부족하면 자동으로 잠깐 기다렸다가 재시도해요.
 *
 * ── 출력 잘림 문제 해결 (이어쓰기) ──
 *
 * Groq 모델은 한 번 요청에 최대 8,192 토큰까지만 출력할 수 있어요.
 * 출력이 잘리면 finish_reason 값이 'length'가 돼요.
 *   - finish_reason === 'stop'   → 정상 완료
 *   - finish_reason === 'length' → 토큰 한계로 잘림
 * 잘린 경우 "이어서 계속 써줘" 메시지를 추가해서 최대 4번까지 연장해요.
 *
 * Gemini는 출력 한계가 65,536 토큰으로 넉넉해서 이어쓰기 없이 처리해요.
 */

import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─────────────────────────────────────────────────────────
// 상수 (설정값)
// ─────────────────────────────────────────────────────────

/** Groq에서 사용할 모델 이름 매핑 */
const GROQ_MODELS = {
  'groq':     'meta-llama/llama-4-scout-17b-16e-instruct',
  'groq-oss': 'openai/gpt-oss-120b',
}

/**
 * GROQ_MAX_TOKENS — 최종 문서 생성 시 요청당 최대 출력 토큰
 * 모델 한계가 8,192이라서 이보다 높게 설정하면 400 에러가 나요.
 */
const GROQ_MAX_TOKENS = 8192

/**
 * GROQ_SUMMARY_MAX_TOKENS — 청크 요약 시 최대 출력 토큰
 * 중간 요약은 짧아도 충분해서 2,048로 제한해요.
 * 덕분에 TPM 여유가 생겨서 더 많은 청크를 처리할 수 있어요.
 */
const GROQ_SUMMARY_MAX_TOKENS = 2048

/**
 * GROQ_MAX_CONTINUATIONS — 이어쓰기 최대 횟수
 * 첫 요청 1번 + 이어쓰기 최대 4번 = 총 5번
 * 최대 출력: 8,192 × 5 = 40,960 토큰
 */
const GROQ_MAX_CONTINUATIONS = 4

/**
 * GROQ_TPM — llama-4-scout 분당 최대 토큰 처리량
 * Groq API에서 1분에 처리할 수 있는 총 토큰 수(입력 + 출력 합산)예요.
 * 이 한도를 넘으면 429(요청 한도 초과) 오류가 나요.
 */
const GROQ_TPM = 30_000

/**
 * GEMINI_MAX_TOKENS — Gemini 2.5 Flash Lite 최대 출력 토큰
 * Gemini는 65,536 토큰까지 출력할 수 있어서 이어쓰기가 필요 없어요.
 */
const GEMINI_MAX_TOKENS = 65536

/**
 * CHUNK_SIZE — 자막 입력을 나누는 단위 (글자 수)
 *
 * 한국어 1글자 ≈ 1토큰 (보수적 추정)
 * 25,000글자 ≈ 25,000토큰 입력
 * + 요약 출력 2,048토큰 = 약 27,048토큰 → TPM 30K 안에 맞아요.
 *
 * ⚠️ 기존 80,000에서 25,000으로 줄였어요 (TPM 한도 초과 방지)
 */
const CHUNK_SIZE = 25_000

// ─────────────────────────────────────────────────────────
// 유틸리티
// ─────────────────────────────────────────────────────────

/**
 * splitIntoChunks — 긴 텍스트를 일정 크기로 나누는 함수
 *
 * 예: 텍스트가 60,000글자이고 size가 25,000이면
 *   → [0~25000], [25000~50000], [50000~60000] 으로 3조각
 *
 * @param {string} text - 나눌 텍스트
 * @param {number} size - 조각 하나의 최대 글자 수
 * @returns {string[]} - 나눈 조각들의 배열
 */
function splitIntoChunks(text, size) {
  const chunks = []
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

/**
 * estimateTokens — 텍스트의 토큰 수를 추정하는 함수
 *
 * 정확한 토크나이저 없이 글자 수로 대략 계산해요.
 * 한국어: 1글자 ≈ 1토큰 (보수적 추정)
 * 영어:   4글자 ≈ 1토큰
 * 혼합 콘텐츠: 1.5글자당 1토큰으로 보수적으로 계산해요.
 *
 * 보수적으로 계산해야 실제보다 많이 나와서 안전해요.
 * (적게 나오면 TPM 한도를 넘을 수 있어요)
 *
 * @param {string} text - 토큰 수를 추정할 텍스트
 * @returns {number} - 추정 토큰 수
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 1.5)
}

/**
 * sleep — 지정한 시간만큼 기다리는 함수
 *
 * API 요청 한도 초과 시 일정 시간 기다릴 때 써요.
 *
 * @param {number} ms - 기다릴 시간 (밀리초, 1초 = 1000ms)
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─────────────────────────────────────────────────────────
// TpmGuard — 분당 토큰 한도 관리 도구
// ─────────────────────────────────────────────────────────

/**
 * TpmGuard — Groq TPM(분당 토큰) 한도 초과를 방지하는 클래스
 *
 * Groq API는 1분에 처리할 수 있는 토큰 수가 30,000개로 제한돼요.
 * 여러 청크를 연속으로 처리할 때 이 한도를 초과하면 429 오류가 나요.
 *
 * TpmGuard의 역할:
 * 1. 이번 분에 얼마나 토큰을 썼는지 추적해요
 * 2. 다음 요청을 보내면 한도를 넘을 것 같으면 자동으로 기다려요
 * 3. 1분이 지나면 카운터를 초기화해서 다시 보낼 수 있게 해요
 *
 * 비유: 레스토랑 주방에서 요리사가 "1분에 30개 이상은 못 만들어"라고 할 때
 *       손님(우리 앱)이 알아서 기다렸다가 주문하는 것처럼요.
 */
class TpmGuard {
  /**
   * @param {number}        tpm    - 분당 최대 토큰 수
   * @param {function|null} onWait - 대기 시 호출되는 콜백 (대기 초수를 전달)
   */
  constructor(tpm, onWait = null) {
    this.tpm         = tpm          // 분당 최대 토큰 수
    this.used        = 0            // 현재 윈도우에서 사용한 토큰 수
    this.windowStart = Date.now()   // 현재 1분 윈도우가 시작된 시각
    this.onWait      = onWait       // 대기 시 알림 콜백
  }

  /**
   * reserve — 토큰을 예약하고, 한도 초과 시 자동 대기해요
   *
   * 요청 보내기 전에 이 함수를 호출해서 "나 이만큼 토큰 쓸 거야"라고 예약해요.
   * 한도를 넘을 것 같으면 1분 창이 리셋될 때까지 기다려요.
   *
   * @param {number} tokens - 이번 요청에서 사용할 예상 토큰 수
   */
  async reserve(tokens) {
    const now     = Date.now()
    const elapsed = now - this.windowStart  // 현재 윈도우 경과 시간 (ms)

    // 1분이 지났으면 카운터를 초기화해요
    if (elapsed >= 60_000) {
      this.used        = 0
      this.windowStart = now
    }

    // 이번 요청을 더하면 한도의 90%를 넘을 것 같으면 대기해요
    // 100%가 아닌 90% 기준으로 여유를 두어요
    if (this.used + tokens > this.tpm * 0.9) {
      // 다음 1분 창이 열릴 때까지 남은 시간 + 1초 여유
      const waitMs   = 60_000 - elapsed + 1_000
      const waitSecs = Math.ceil(waitMs / 1000)

      // 대기 중임을 알림 콜백으로 전달해요 (UI에서 표시할 수 있어요)
      if (this.onWait) this.onWait(waitSecs)

      await sleep(waitMs)

      // 대기 후 윈도우 초기화
      this.used        = 0
      this.windowStart = Date.now()
    }

    // 토큰 사용량 누적
    this.used += tokens
  }
}

// ─────────────────────────────────────────────────────────
// Groq
// ─────────────────────────────────────────────────────────

/**
 * callGroqOnce — Groq API에 한 번 요청하는 함수 (429 오류 시 재시도 포함)
 *
 * 429(요청 한도 초과) 오류가 나면 60~90초 기다렸다가 최대 3번 재시도해요.
 * TpmGuard로 사전에 방지하지만, 혹시 넘어도 여기서 안전하게 처리해요.
 *
 * @param {function}      fn         - 실제 API 요청 함수 (비동기)
 * @param {function|null} onRetry    - 재시도 시 알림 콜백 (waitSecs, attempt 전달)
 * @param {number}        maxRetries - 최대 재시도 횟수 (기본 3회)
 */
async function callGroqOnce(fn, onRetry = null, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      // 429: Too Many Requests (요청 한도 초과)
      const is429     = e?.status === 429 || e?.error?.code === 'rate_limit_exceeded'
      const isLastTry = attempt >= maxRetries - 1

      if (is429 && !isLastTry) {
        // 시도 횟수에 따라 점점 더 오래 기다려요 (60초, 90초, 120초)
        const waitSecs = 60 + attempt * 30
        if (onRetry) onRetry(waitSecs, attempt + 1)
        await sleep(waitSecs * 1000)
        continue
      }

      // 429가 아닌 오류이거나 마지막 시도면 오류를 그대로 던져요
      throw e
    }
  }
}

/**
 * callGroqWithContinuation — Groq AI에 요청하고 잘리면 이어쓰기하는 함수
 *
 * 동작 흐름:
 * 1. 첫 요청을 보내요 → AI가 max 토큰까지 응답해요
 * 2. finish_reason이 'length'이면 잘린 것 → 이어쓰기 요청 추가
 * 3. 최대 GROQ_MAX_CONTINUATIONS번까지 반복해서 텍스트를 이어붙여요
 * 4. finish_reason이 'stop'이 되면 완료
 *
 * 이어쓰기 대화 구조:
 * [user]:      원래 지시문 + 자막
 * [assistant]: (잘린 응답)
 * [user]:      "이어서 계속 써줘"
 * [assistant]: (이어진 응답)
 * ...
 *
 * @param {Groq}          groq           - Groq 클라이언트
 * @param {string}        model          - 모델 이름
 * @param {string}        initialContent - 첫 요청 내용
 * @param {number}        maxTokens      - 최대 출력 토큰 (기본: GROQ_MAX_TOKENS)
 * @param {TpmGuard|null} guard          - TPM 한도 관리 도구
 * @param {function|null} onProgress     - 진행 상황 알림 콜백
 * @returns {Promise<string>} - 이어붙인 완성 텍스트
 */
async function callGroqWithContinuation(
  groq,
  model,
  initialContent,
  maxTokens  = GROQ_MAX_TOKENS,
  guard      = null,
  onProgress = null,
) {
  // 대화 메시지 목록 — 이어쓰기 시 이전 대화 내용을 포함해야 해요
  const messages = [{ role: 'user', content: initialContent }]
  let fullText   = ''

  for (let i = 0; i <= GROQ_MAX_CONTINUATIONS; i++) {
    // TPM 한도 확인: 예상 토큰을 예약하고 필요하면 대기해요
    if (guard) {
      const inputTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
      await guard.reserve(inputTokens + maxTokens)
    }

    // API 요청 (429 오류 시 자동 재시도)
    const completion = await callGroqOnce(
      () => groq.chat.completions.create({ model, messages, max_tokens: maxTokens }),
      (waitSecs, attempt) => {
        onProgress?.(`API 한도 초과 — ${waitSecs}초 대기 후 ${attempt}번째 재시도`)
      },
    )

    const choice = completion.choices[0]
    fullText += choice.message.content

    // 'stop' = 정상 완료, 더 이상 이어쓰기 필요 없어요
    if (choice.finish_reason !== 'length') break

    // 'length' = 토큰 한계로 잘림 → 이어쓰기 요청 추가
    if (i < GROQ_MAX_CONTINUATIONS) {
      messages.push({ role: 'assistant', content: choice.message.content })
      messages.push({
        role: 'user',
        // 이전 내용을 반복하지 말고 잘린 곳부터 바로 이어 써달라고 요청해요
        content: '중단된 곳에서 바로 이어서 계속 작성해줘. 앞에서 한 말은 반복하지 말고 이어서만 써줘.',
      })
    }
  }

  return fullText
}

/**
 * callGroq — Groq AI로 자막을 문서로 변환하는 함수
 *
 * 자막 길이에 따라 두 가지 경로로 처리해요:
 *
 * [짧은 자막 ≤ 25,000글자]
 *   → 바로 이어쓰기 방식으로 변환
 *
 * [긴 자막 > 25,000글자]
 *   → 청크로 나눠 각각 요약 → 요약본들을 합쳐 최종 변환
 *   → TpmGuard가 속도를 자동 조절해요 (TPM 30K 한도 준수)
 *
 * @param {string}        transcript - 자막 전체 텍스트
 * @param {string}        prompt     - AI 지시문
 * @param {string}        apiKey     - Groq API 키
 * @param {string}        provider   - 'groq' 또는 'groq-oss'
 * @param {function|null} onProgress - 진행 상황 알림 콜백 (UI에 상태를 표시해요)
 */
async function callGroq(transcript, prompt, apiKey, provider, onProgress) {
  const model = GROQ_MODELS[provider]
  const groq  = new Groq({ apiKey, dangerouslyAllowBrowser: true })

  // TpmGuard: 분당 토큰 한도를 초과하면 자동으로 대기해요
  // 대기 시에는 onProgress로 현재 상태를 알려줘요
  const guard = new TpmGuard(GROQ_TPM, (waitSecs) => {
    onProgress?.(`API 요청 한도 관리 중 — 약 ${waitSecs}초 대기`)
  })

  // ── 짧은 자막: 바로 처리 ──
  if (transcript.length <= CHUNK_SIZE) {
    onProgress?.('AI 처리 중...')
    return callGroqWithContinuation(groq, model, prompt + transcript, GROQ_MAX_TOKENS, guard, onProgress)
  }

  // ── 긴 자막: 청크 분할 후 요약 → 합치기 ──
  const chunks         = splitIntoChunks(transcript, CHUNK_SIZE)
  const chunkSummaries = []

  // 각 청크를 순서대로 요약해요
  // (병렬 처리하면 TPM 한도를 한 번에 초과할 수 있어서 순서대로 처리해요)
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(`청크 ${i + 1} / ${chunks.length} 요약 중...`)

    const summary = await callGroqWithContinuation(
      groq,
      model,
      `다음 자막의 일부를 핵심 내용 위주로 간략히 정리해줘:\n\n${chunks[i]}`,
      GROQ_SUMMARY_MAX_TOKENS,  // 요약은 짧아도 충분해요
      guard,
      onProgress,
    )
    chunkSummaries.push(summary)
  }

  // 모든 요약을 합쳐서 최종 문서 생성
  onProgress?.('최종 문서 생성 중...')
  return callGroqWithContinuation(
    groq,
    model,
    prompt + chunkSummaries.join('\n\n'),
    GROQ_MAX_TOKENS,
    guard,
    onProgress,
  )
}

// ─────────────────────────────────────────────────────────
// Gemini
// ─────────────────────────────────────────────────────────

/**
 * callGemini — Gemini AI로 자막을 문서로 변환하는 함수
 *
 * Gemini 2.5 Flash Lite는 최대 65,536 토큰 출력을 지원해서
 * 이어쓰기 없이 한 번에 처리할 수 있어요.
 *
 * @param {string}        transcript - 자막 전체 텍스트
 * @param {string}        prompt     - AI 지시문
 * @param {string}        apiKey     - Google AI Studio API 키
 * @param {function|null} onProgress - 진행 상황 알림 콜백
 */
async function callGemini(transcript, prompt, apiKey, onProgress) {
  onProgress?.('AI 처리 중...')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: { maxOutputTokens: GEMINI_MAX_TOKENS },
  })

  const result = await model.generateContent(prompt + transcript)
  return result.response.text()
}

// ─────────────────────────────────────────────────────────
// 통합 진입점
// ─────────────────────────────────────────────────────────

/**
 * generateDocument — 선택된 AI로 자막을 문서로 변환하는 메인 함수
 *
 * @param {string}        transcript - 자막 전체 텍스트
 * @param {string}        prompt     - AI 지시문
 * @param {object}        settings   - 앱 설정 (provider, apiKey 등)
 * @param {function|null} onProgress - 진행 상황 알림 콜백 (선택적)
 *                                    예: (msg) => setLoadingStatus(msg)
 */
export async function generateDocument(transcript, prompt, settings, onProgress) {
  if (settings.provider === 'groq' || settings.provider === 'groq-oss') {
    if (!settings.groqApiKey) throw new Error('Groq API 키를 설정해주세요.')
    return callGroq(transcript, prompt, settings.groqApiKey, settings.provider, onProgress)
  }

  if (settings.provider === 'gemini') {
    if (!settings.geminiApiKey) throw new Error('Gemini API 키를 설정해주세요.')
    return callGemini(transcript, prompt, settings.geminiApiKey, onProgress)
  }

  throw new Error(`지원하지 않는 provider: ${settings.provider}`)
}
