import { renderHook, act } from '@testing-library/react'
import { useSettings } from './useSettings'

beforeEach(() => {
  localStorage.clear()
})

test('localStorage가 비어있으면 기본값을 반환한다', () => {
  const { result } = renderHook(() => useSettings())
  expect(result.current.settings).toEqual({
    provider: 'groq',
    groqApiKey: '',
    geminiApiKey: '',
    language: '한국어',
  })
})

test('localStorage에 저장된 값을 불러온다', () => {
  localStorage.setItem('subtodoc_settings', JSON.stringify({ provider: 'gemini', groqApiKey: '', geminiApiKey: 'abc', language: '영어' }))
  const { result } = renderHook(() => useSettings())
  expect(result.current.settings.provider).toBe('gemini')
  expect(result.current.settings.geminiApiKey).toBe('abc')
})

test('updateSettings가 localStorage에 저장한다', () => {
  const { result } = renderHook(() => useSettings())
  act(() => {
    result.current.updateSettings({ groqApiKey: 'test-key' })
  })
  const stored = JSON.parse(localStorage.getItem('subtodoc_settings'))
  expect(stored.groqApiKey).toBe('test-key')
})

test('updateSettings가 기존 값을 유지한다', () => {
  const { result } = renderHook(() => useSettings())
  act(() => {
    result.current.updateSettings({ groqApiKey: 'key1' })
  })
  act(() => {
    result.current.updateSettings({ language: '일본어' })
  })
  expect(result.current.settings.groqApiKey).toBe('key1')
  expect(result.current.settings.language).toBe('일본어')
})
