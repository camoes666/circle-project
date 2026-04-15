import { describe, test, expect, vi, beforeEach } from 'vitest'
import { generateDocument } from './ai'

// groq-sdk mock
vi.mock('groq-sdk', () => {
  return {
    default: class Groq {
      constructor() {
        this.chat = {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Groq 결과물' } }],
            }),
          },
        }
      }
    },
  }
})

// @google/generative-ai mock
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class GoogleGenerativeAI {
      constructor() {
        // noop
      }
      getGenerativeModel() {
        return {
          generateContent: vi.fn().mockResolvedValue({
            response: { text: () => 'Gemini 결과물' },
          }),
        }
      }
    },
  }
})

const groqSettings = { provider: 'groq', groqApiKey: 'gsk_test', geminiApiKey: '' }
const geminiSettings = { provider: 'gemini', groqApiKey: '', geminiApiKey: 'AIzatest' }

describe('generateDocument', () => {
  test('provider가 groq이면 Groq API를 호출한다', async () => {
    const result = await generateDocument('자막 텍스트', '프롬프트', groqSettings)
    expect(result).toBe('Groq 결과물')
  })

  test('provider가 gemini이면 Gemini API를 호출한다', async () => {
    const result = await generateDocument('자막 텍스트', '프롬프트', geminiSettings)
    expect(result).toBe('Gemini 결과물')
  })

  test('API 키가 비어있으면 에러를 던진다', async () => {
    await expect(
      generateDocument('자막', '프롬프트', { provider: 'groq', groqApiKey: '', geminiApiKey: '' })
    ).rejects.toThrow('API 키를 설정해주세요.')
  })

  test('알 수 없는 provider이면 에러를 던진다', async () => {
    await expect(
      generateDocument('자막', '프롬프트', { provider: 'openai', groqApiKey: 'key', geminiApiKey: '' })
    ).rejects.toThrow('지원하지 않는 provider')
  })
})
