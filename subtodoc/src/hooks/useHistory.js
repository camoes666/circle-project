/**
 * ════════════════════════════════════════════════════════════
 *  useHistory.js  —  변환 기록을 저장하고 관리하는 훅
 * ════════════════════════════════════════════════════════════
 *
 * 이 파일은 사용자가 이전에 변환했던 기록을 관리해요.
 * 마치 인터넷 방문 기록처럼 이전에 변환한 영상들을 저장해둬요.
 *
 * 기록에 저장되는 정보:
 * - url: YouTube URL
 * - videoId: 영상 ID (썸네일 이미지 표시에 사용)
 * - format: 어떤 형식으로 변환했는지 (요약, 블로그 등)
 * - result: AI가 만들어준 문서 내용
 * - customInstruction: 사용자가 입력한 특별 지시사항
 * - includeTimestamps: 타임스탬프를 포함했는지 여부
 * - id: 각 기록의 고유 번호 (현재 시각으로 만들어요)
 * - createdAt: 기록이 만들어진 시간
 *
 * 최대 저장 개수: 20개
 * → 20개가 넘으면 오래된 것부터 자동으로 삭제해요.
 *   마치 메모장에 최신 것을 맨 위에 쓰고 종이가 꽉 차면 밑에 걸 지우는 것처럼요.
 */

// useState: React에서 값을 기억해두는 도구예요
import { useState } from 'react'

// localStorage에서 기록을 저장/불러올 때 쓸 고유 키(이름표)예요
const HISTORY_KEY = 'subtodoc_history'

// 기록을 최대 몇 개까지 저장할지 정해요
const MAX_ITEMS = 20

/**
 * useHistory — 변환 기록을 관리하는 커스텀 훅
 *
 * 사용법:
 * const { history, addEntry, removeEntry, clearHistory } = useHistory()
 * → history: 저장된 기록 목록 (배열)
 * → addEntry: 새 기록을 추가하는 함수
 * → removeEntry: 특정 기록을 삭제하는 함수
 * → clearHistory: 모든 기록을 삭제하는 함수
 *
 * @returns {{ history, addEntry, removeEntry, clearHistory }}
 */
export function useHistory() {
  /**
   * useState 초기화 — 앱 시작 시 localStorage에서 기록을 불러와요
   *
   * JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
   * → localStorage에 저장된 기록을 JavaScript 배열로 변환해요
   * → 저장된 게 없으면 빈 배열 []을 써요
   */
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch {
      // 저장된 데이터가 손상되었을 때 빈 배열로 시작해요
      return []
    }
  })

  /**
   * addEntry — 새로운 변환 기록을 추가하는 함수
   *
   * 동작 방식:
   * 1. 새 기록에 id(고유번호)와 createdAt(생성 시각)을 붙여요
   * 2. 새 기록을 목록 맨 앞에 추가해요 (최신 것이 위에 오도록)
   * 3. 20개가 넘으면 오래된 것은 잘라내요
   * 4. localStorage에 저장해요
   *
   * @param {object} entry - 저장할 기록 정보
   *   entry.url              - YouTube URL
   *   entry.videoId          - 영상 ID
   *   entry.format           - 변환 형식
   *   entry.result           - AI 생성 결과
   *   entry.customInstruction - 특별 지시사항
   *   entry.includeTimestamps - 타임스탬프 포함 여부
   */
  const addEntry = (entry) => {
    const next = [
      {
        ...entry,                              // 받은 기록 정보를 그대로 복사
        id: Date.now(),                        // 현재 시각(밀리초)을 고유 ID로 사용
        createdAt: new Date().toISOString(),   // 현재 시각을 ISO 형식 문자열로 저장
      },
      ...history,                              // 기존 기록들을 뒤에 붙여요
    ].slice(0, MAX_ITEMS)                      // 최대 20개만 유지해요

    setHistory(next)                           // React 상태 업데이트
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) // 브라우저에 저장
  }

  /**
   * removeEntry — 특정 기록을 삭제하는 함수
   *
   * id를 기준으로 해당 기록을 찾아서 제거해요.
   * filter: 조건에 맞는 것만 남기는 함수예요.
   * e.id !== id → "내가 삭제하려는 id와 다른 것만 남겨줘" = 해당 id 제거
   *
   * @param {number} id - 삭제할 기록의 고유 번호
   */
  const removeEntry = (id) => {
    // 해당 id를 가진 기록을 제외하고 나머지를 남겨요
    const next = history.filter(e => e.id !== id)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  }

  /**
   * clearHistory — 모든 기록을 삭제하는 함수
   *
   * 빈 배열로 상태를 초기화하고, localStorage에서도 아예 삭제해요.
   * removeItem은 setItem의 반대로 해당 키를 완전히 지워요.
   */
  const clearHistory = () => {
    setHistory([])                          // React 상태를 빈 배열로 초기화
    localStorage.removeItem(HISTORY_KEY)    // localStorage에서 기록을 완전히 삭제
  }

  // 4가지를 내보내요: 기록 목록, 추가, 삭제, 전체 삭제
  return { history, addEntry, removeEntry, clearHistory }
}
