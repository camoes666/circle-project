import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function callGroq(transcript, prompt, apiKey) {
  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true })
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt + transcript }],
  })
  return completion.choices[0].message.content
}

async function callGemini(transcript, prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt + transcript)
  return result.response.text()
}

export async function generateDocument(transcript, prompt, settings) {
  if (settings.provider === 'groq') {
    if (!settings.groqApiKey) throw new Error('API 키를 설정해주세요.')
    return callGroq(transcript, prompt, settings.groqApiKey)
  }
  if (settings.provider === 'gemini') {
    if (!settings.geminiApiKey) throw new Error('API 키를 설정해주세요.')
    return callGemini(transcript, prompt, settings.geminiApiKey)
  }
  throw new Error(`지원하지 않는 provider: ${settings.provider}`)
}
