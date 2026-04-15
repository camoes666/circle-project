import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportButtons from './ExportButtons'
import { vi } from 'vitest'

vi.mock('../services/export', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
  downloadMarkdown: vi.fn(),
  downloadPdf: vi.fn(),
}))

import { copyToClipboard, downloadMarkdown, downloadPdf } from '../services/export'

test('3개의 버튼을 렌더링한다', () => {
  render(<ExportButtons content="텍스트" />)
  expect(screen.getByText('클립보드 복사')).toBeInTheDocument()
  expect(screen.getByText('.md 다운로드')).toBeInTheDocument()
  expect(screen.getByText('PDF')).toBeInTheDocument()
})

test('복사 버튼 클릭 시 copyToClipboard를 호출한다', async () => {
  render(<ExportButtons content="내용" />)
  await userEvent.click(screen.getByText('클립보드 복사'))
  expect(copyToClipboard).toHaveBeenCalledWith('내용')
})

test('복사 후 "복사됨!" 피드백을 표시한다', async () => {
  render(<ExportButtons content="내용" />)
  await userEvent.click(screen.getByText('클립보드 복사'))
  expect(screen.getByText('복사됨!')).toBeInTheDocument()
})

test('.md 버튼 클릭 시 downloadMarkdown을 호출한다', async () => {
  render(<ExportButtons content="내용" />)
  await userEvent.click(screen.getByText('.md 다운로드'))
  expect(downloadMarkdown).toHaveBeenCalledWith('내용')
})

test('PDF 버튼 클릭 시 downloadPdf를 호출한다', async () => {
  render(<ExportButtons content="내용" />)
  await userEvent.click(screen.getByText('PDF'))
  expect(downloadPdf).toHaveBeenCalledWith('내용')
})
