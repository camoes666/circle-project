export default function UrlInput({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">
        YouTube URL
      </label>
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-gray-100 placeholder-gray-600"
      />
    </div>
  )
}
