import { render, screen } from '@testing-library/react'
import ResultViewer from './ResultViewer'

test('전달받은 content를 표시한다', () => {
  render(<ResultViewer content="# 제목\n내용입니다." />)
  const preElement = screen.getByText(/제목/)
  expect(preElement).toBeInTheDocument()
  expect(preElement.textContent).toContain('# 제목')
  expect(preElement.textContent).toContain('내용입니다.')
})
