import { useState } from 'react'

const HISTORY_KEY = 'subtodoc_history'
const MAX_ITEMS = 20

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch {
      return []
    }
  })

  const addEntry = (entry) => {
    const next = [
      { ...entry, id: Date.now(), createdAt: new Date().toISOString() },
      ...history,
    ].slice(0, MAX_ITEMS)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  }

  const removeEntry = (id) => {
    const next = history.filter(e => e.id !== id)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  return { history, addEntry, removeEntry, clearHistory }
}
