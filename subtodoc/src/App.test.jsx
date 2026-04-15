import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./services/transcript', () => ({
  extractVideoId: vi.fn(url => url.includes('v=') ? 'test-id' : null),
  fetchTranscript: vi.fn().mockResolvedValue('자막 텍스트'),
}))

vi.mock('./services/ai', () => ({
  generateDocument: vi.fn().mockResolvedValue('생성된 문서 내용'),
}))

test('기본 UI를 렌더링한다', () => {
  render(<App />)
  expect(screen.getByText('SubToDoc')).toBeInTheDocument()
  expect(screen.getByText('변환하기')).toBeInTheDocument()
})

test('설정 아이콘 클릭 시 SettingsModal을 열고 닫는다', async () => {
  render(<App />)
  await userEvent.click(screen.getByRole('button', { name: /설정/i }))
  expect(screen.getByText('설정')).toBeInTheDocument()
  await userEvent.click(screen.getByText('취소'))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('유효하지 않은 URL 입력 시 에러를 표시한다', async () => {
  render(<App />)
  await userEvent.type(screen.getByRole('textbox'), 'https://example.com')
  await userEvent.click(screen.getByText('변환하기'))
  expect(screen.getByText('유효한 YouTube URL을 입력해주세요.')).toBeInTheDocument()
})

test('성공적인 변환 후 결과를 표시한다', async () => {
  render(<App />)
  await userEvent.type(screen.getByRole('textbox'), 'https://youtube.com/watch?v=abc')
  await userEvent.click(screen.getByText('변환하기'))
  await waitFor(() => {
    expect(screen.getByText('생성된 문서 내용')).toBeInTheDocument()
  })
})
