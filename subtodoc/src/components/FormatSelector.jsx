import { FORMATS } from '../services/prompts'

export default function FormatSelector({ selected, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        문서 형식
      </label>
      <div className="flex gap-2 flex-wrap">
        {FORMATS.map(f => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
