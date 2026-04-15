import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlInput from './UrlInput'

test('입력 필드를 렌더링한다', () => {
  render(<UrlInput value="" onChange={() => {}} />)
  expect(screen.getByPlaceholderText(/youtube\.com/i)).toBeInTheDocument()
})

test('value prop을 표시한다', () => {
  render(<UrlInput value="https://youtube.com/watch?v=abc" onChange={() => {}} />)
  expect(screen.getByDisplayValue('https://youtube.com/watch?v=abc')).toBeInTheDocument()
})

test('입력 시 onChange를 호출한다', async () => {
  const onChange = vi.fn()
  render(<UrlInput value="" onChange={onChange} />)
  await userEvent.type(screen.getByRole('textbox'), 'https://youtube.com')
  expect(onChange).toHaveBeenCalled()
})
