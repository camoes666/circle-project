import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import SettingsModal from './SettingsModal'

const defaultSettings = {
  provider: 'groq',
  groqApiKey: '',
  geminiApiKey: '',
  language: '한국어',
}

test('모달을 렌더링한다', () => {
  render(<SettingsModal settings={defaultSettings} onSave={() => {}} onClose={() => {}} />)
  expect(screen.getByText('설정')).toBeInTheDocument()
})

test('Groq가 기본으로 선택된다', () => {
  render(<SettingsModal settings={defaultSettings} onSave={() => {}} onClose={() => {}} />)
  expect(screen.getByText('Groq (기본)').className).toContain('bg-blue-600')
})

test('Gemini 버튼 클릭 시 provider가 전환된다', async () => {
  render(<SettingsModal settings={defaultSettings} onSave={() => {}} onClose={() => {}} />)
  await userEvent.click(screen.getByText('Gemini Flash'))
  expect(screen.getByText('Gemini Flash').className).toContain('bg-blue-600')
})

test('저장 버튼 클릭 시 onSave와 onClose를 호출한다', async () => {
  const onSave = vi.fn()
  const onClose = vi.fn()
  render(<SettingsModal settings={defaultSettings} onSave={onSave} onClose={onClose} />)
  await userEvent.click(screen.getByText('저장'))
  expect(onSave).toHaveBeenCalled()
  expect(onClose).toHaveBeenCalled()
})

test('취소 버튼 클릭 시 onClose를 호출한다', async () => {
  const onClose = vi.fn()
  render(<SettingsModal settings={defaultSettings} onSave={() => {}} onClose={onClose} />)
  await userEvent.click(screen.getByText('취소'))
  expect(onClose).toHaveBeenCalled()
})
