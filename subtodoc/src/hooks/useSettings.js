import { useState } from 'react'

const STORAGE_KEY = 'subtodoc_settings'

const DEFAULTS = {
  provider: 'groq',
  groqApiKey: '',
  geminiApiKey: '',
  language: '한국어',
  transcriptProvider: 'supadata',
  supadadataApiKey: '',
  localServerUrl: 'http://localhost:8000',
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS }
    } catch {
      return { ...DEFAULTS }
    }
  })

  const updateSettings = (updates) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { settings, updateSettings }
}
