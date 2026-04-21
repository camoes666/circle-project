import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GROQ_MODELS = {
  'groq':     'meta-llama/llama-4-scout-17b-16e-instruct',
  'groq-oss': 'openai/gpt-oss-120b',
}

// llama-4-scout: 30K TPM → 요청당 안전 한도 ~80K 글자
const CHUNK_SIZE = 80000

function splitIntoChunks(text, size) {
  const chunks = []
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

async function callGroqOnce(groq, model, content) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: 'user', content }],
  })
  return completion.choices[0].message.content
}

async function callGroq(transcript, prompt, apiKey, provider) {
  const model = GROQ_MODELS[provider]
  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true })

  if (transcript.length <= CHUNK_SIZE) {
    return callGroqOnce(groq, model, prompt + transcript)
  }

  // 긴 자막: 청크별 요약 후 합치기
  const chunks = splitIntoChunks(transcript, CHUNK_SIZE)
  const chunkSummaries = []
  for (const chunk of chunks) {
    const summary = await callGroqOnce(
      groq,
      model,
      `다음 자막의 일부를 핵심 내용 위주로 간략히 정리해줘:\n\n${chunk}`
    )
    chunkSummaries.push(summary)
  }

  return callGroqOnce(groq, model, prompt + chunkSummaries.join('\n\n'))
}

async function callGemini(transcript, prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
  const result = await model.generateContent(prompt + transcript)
  return result.response.text()
}

export async function generateDocument(transcript, prompt, settings) {
  if (settings.provider === 'groq' || settings.provider === 'groq-oss') {
    if (!settings.groqApiKey) throw new Error('Groq API 키를 설정해주세요.')
    return callGroq(transcript, prompt, settings.groqApiKey, settings.provider)
  }
  if (settings.provider === 'gemini') {
    if (!settings.geminiApiKey) throw new Error('Gemini API 키를 설정해주세요.')
    return callGemini(transcript, prompt, settings.geminiApiKey)
  }
  throw new Error(`지원하지 않는 provider: ${settings.provider}`)
}
