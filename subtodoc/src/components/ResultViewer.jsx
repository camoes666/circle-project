export default function ResultViewer({ content }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <pre className="whitespace-pre-wrap text-sm text-gray-200 font-sans leading-relaxed">
        {content}
      </pre>
    </div>
  )
}
