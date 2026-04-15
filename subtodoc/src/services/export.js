export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
}

export function downloadMarkdown(text, filename = 'subtodoc-output.md') {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadPdf(text, filename = 'subtodoc-output.pdf') {
  const { default: html2pdf } = await import('html2pdf.js')
  const element = document.createElement('div')
  element.style.padding = '20px'
  element.style.fontFamily = 'sans-serif'
  element.innerHTML = text.replace(/\n/g, '<br>')
  html2pdf().set({ filename }).from(element).save()
}
