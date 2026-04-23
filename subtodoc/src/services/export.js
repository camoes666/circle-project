/**
 * ════════════════════════════════════════════════════════════
 *  export.js  —  문서를 파일로 저장하는 기능 모음
 * ════════════════════════════════════════════════════════════
 *
 * AI가 만들어준 문서를 컴퓨터에 파일로 저장할 수 있게 해주는 파일이에요.
 *
 * 지원하는 형식:
 * 1. 마크다운(.md) 파일 — 텍스트 파일로 저장해요
 *    → 마크다운이란? # 제목, - 불릿 등 특별한 기호로 서식을 표현하는 텍스트 형식이에요
 *      GitHub, Notion 등에서 예쁘게 보여줘요
 *
 * 2. PDF 파일 — PDF 형식으로 저장해요
 *    → 어떤 기기에서든 같은 모양으로 보이는 문서 형식이에요
 *      출력하거나 공유할 때 편리해요
 */

/**
 * copyToClipboard — 텍스트를 클립보드에 복사하는 함수
 *
 * 클립보드란? 복사(Ctrl+C)했을 때 임시로 저장되는 공간이에요.
 * 붙여넣기(Ctrl+V)로 어디서든 쓸 수 있어요.
 *
 * @param {string} text - 복사할 텍스트
 * @returns {Promise<void>} - 복사 완료를 알려주는 Promise
 */
export async function copyToClipboard(text) {
  // 현대 브라우저의 클립보드 API를 사용해서 텍스트를 복사해요
  await navigator.clipboard.writeText(text)
}

/**
 * downloadMarkdown — 텍스트를 .md 마크다운 파일로 저장하는 함수
 *
 * 파일 다운로드 원리:
 * 1. 텍스트를 Blob(파일 덩어리)으로 만들어요
 * 2. 그 Blob의 임시 URL을 만들어요
 * 3. 눈에 보이지 않는 링크(<a> 태그)를 만들고 클릭해요
 * 4. 브라우저가 파일 다운로드를 시작해요
 * 5. 임시 URL을 정리해요
 *
 * @param {string} text     - 저장할 마크다운 텍스트
 * @param {string} filename - 저장될 파일 이름 (기본값: 'subtodoc-output.md')
 */
export function downloadMarkdown(text, filename = 'subtodoc-output.md') {
  // 텍스트를 마크다운 형식의 Blob(파일 덩어리)으로 만들어요
  const blob = new Blob([text], { type: 'text/markdown' })

  // Blob의 임시 주소(URL)를 만들어요 — 브라우저 메모리에 임시 저장되는 주소예요
  const url = URL.createObjectURL(blob)

  // 눈에 보이지 않는 링크 요소를 만들어요
  const a = document.createElement('a')
  a.href = url        // 임시 URL을 링크에 연결해요
  a.download = filename // 다운로드될 파일 이름을 설정해요

  // 페이지에 잠깐 추가하고 클릭해서 다운로드를 시작해요
  document.body.appendChild(a)
  a.click()

  // 다운로드 후 링크를 페이지에서 제거해요 (흔적 청소)
  document.body.removeChild(a)

  // 메모리에서 임시 URL을 해제해요 (메모리 누수 방지)
  URL.revokeObjectURL(url)
}

/**
 * downloadPdf — 텍스트를 PDF 파일로 저장하는 함수
 *
 * html2pdf.js 라이브러리를 사용해요.
 * 이 라이브러리는 크기가 크기 때문에(~1MB) 필요할 때만 불러와요.
 * → 이걸 "동적 import(dynamic import)"라고 해요.
 *   처음부터 모두 불러오지 않아 앱이 빠르게 시작될 수 있어요.
 *
 * 동작 방식:
 * 1. html2pdf 라이브러리를 필요할 때만 불러와요
 * 2. 텍스트를 담을 HTML div 요소를 만들어요
 * 3. 줄바꿈(\n)을 <br> 태그로 바꿔서 HTML에 넣어요
 * 4. html2pdf가 그 HTML을 PDF로 변환해서 저장해줘요
 *
 * @param {string} text     - 저장할 텍스트 (마크다운 형식)
 * @param {string} filename - 저장될 파일 이름 (기본값: 'subtodoc-output.pdf')
 */
export async function downloadPdf(text, filename = 'subtodoc-output.pdf') {
  // html2pdf 라이브러리를 필요한 순간에만 불러와요 (지연 로딩)
  const { default: html2pdf } = await import('html2pdf.js')

  // 텍스트를 담을 빈 div 박스를 만들어요
  const element = document.createElement('div')
  element.style.padding = '20px'       // 여백 20px
  element.style.fontFamily = 'sans-serif' // 글꼴 설정

  // 텍스트의 줄바꿈(\n)을 HTML <br> 태그로 바꿔서 PDF에서도 줄이 바뀌게 해요
  element.innerHTML = text.replace(/\n/g, '<br>')

  // html2pdf로 PDF를 만들고 저장해요
  html2pdf().set({ filename }).from(element).save()
}
