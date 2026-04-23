import { useState } from 'react'

const STORAGE_KEY = 'subtodoc_settings'

const DEFAULTS = {
  provider: 'groq',             // 'groq' | 'groq-oss' | 'gemini'
  groqApiKey: '',               // groq + groq-oss 공유
  geminiApiKey: '',
  language: '한국어',
  transcriptProvider: 'custom-server',  // 'custom-server' | 'supadata' | 'local' | 'auto'
  customServerUrl: 'http://115.68.193.201',
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
