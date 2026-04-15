import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormatSelector from './FormatSelector'

test('4개의 형식 버튼을 렌더링한다', () => {
  render(<FormatSelector selected="summary" onChange={() => {}} />)
  expect(screen.getByText('요약')).toBeInTheDocument()
  expect(screen.getByText('블로그')).toBeInTheDocument()
  expect(screen.getByText('회의록')).toBeInTheDocument()
  expect(screen.getByText('노트')).toBeInTheDocument()
})

test('선택된 형식 버튼이 강조된다', () => {
  render(<FormatSelector selected="blog" onChange={() => {}} />)
  expect(screen.getByText('블로그').className).toContain('bg-blue-600')
  expect(screen.getByText('요약').className).not.toContain('bg-blue-600')
})

test('버튼 클릭 시 onChange를 id와 함께 호출한다', async () => {
  const onChange = vi.fn()
  render(<FormatSelector selected="summary" onChange={onChange} />)
  await userEvent.click(screen.getByText('회의록'))
  expect(onChange).toHaveBeenCalledWith('minutes')
})
