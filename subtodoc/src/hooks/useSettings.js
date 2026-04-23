/**
 * ════════════════════════════════════════════════════════════
 *  useSettings.js  —  앱 설정을 저장하고 불러오는 훅(Hook)
 * ════════════════════════════════════════════════════════════
 *
 * 이 파일은 사용자의 설정(API 키, 언어, 자막 소스 등)을
 * 컴퓨터에 저장하고 불러오는 역할을 해요.
 *
 * 훅(Hook)이란?
 * → React에서 상태(state)나 기능을 재사용하기 쉽게 만든 특별한 함수예요.
 *   "use"로 시작하는 이름이 훅이에요.
 *
 * localStorage란?
 * → 브라우저에 데이터를 영구적으로 저장하는 공간이에요.
 *   앱을 껐다 켜도, 브라우저를 다시 열어도 데이터가 남아있어요.
 *   마치 노트에 메모해두는 것처럼요.
 *   단, 같은 컴퓨터, 같은 브라우저에서만 유지돼요.
 *
 * 저장되는 설정 목록:
 * - provider: AI 선택 (groq / groq-oss / gemini)
 * - groqApiKey: Groq API 키
 * - geminiApiKey: Gemini API 키
 * - language: 출력 언어 (한국어 등)
 * - transcriptProvider: 자막 소스 (custom-server / supadata / local / auto)
 * - customServerUrl: 자체 서버 주소
 * - supadadataApiKey: Supadata API 키
 * - localServerUrl: 로컬 서버 주소
 */

// useState: React에서 값을 기억해두는 도구예요
import { useState } from 'react'

// localStorage에서 설정을 저장/불러올 때 사용할 고유 키(이름표)예요
// 다른 앱의 데이터와 섞이지 않도록 고유한 이름을 써요
const STORAGE_KEY = 'subtodoc_settings'

/**
 * DEFAULTS — 설정의 기본값들이에요
 *
 * 처음 앱을 실행하거나, 저장된 설정이 없을 때 사용해요.
 * 사용자가 API 키를 입력하지 않아도 기본적으로 동작할 수 있게 설정해요.
 */
const DEFAULTS = {
  provider: 'groq',              // 기본 AI: Groq (가장 빠르고 무료 플랜이 넉넉해요)
  groqApiKey: '',                // Groq API 키 (처음엔 비어있어요)
  geminiApiKey: '',              // Gemini API 키 (처음엔 비어있어요)
  language: '한국어',            // 출력 언어 기본값: 한국어
  transcriptProvider: 'custom-server',  // 기본 자막 소스: 자체 서버
  customServerUrl: 'https://my-yt-api.duckdns.org', // 자체 서버 기본 주소
  supadadataApiKey: '',          // Supadata API 키 (처음엔 비어있어요)
  localServerUrl: 'http://localhost:8000', // 로컬 서버 기본 주소
}

/**
 * useSettings — 설정을 관리하는 커스텀 훅
 *
 * 사용법:
 * const { settings, updateSettings } = useSettings()
 * → settings: 현재 설정 값들의 객체예요
 * → updateSettings: 설정을 바꾸는 함수예요
 *
 * @returns {{ settings: object, updateSettings: function }}
 */
export function useSettings() {
  /**
   * useState의 초기화 함수 — 앱이 처음 실행될 때 딱 한 번만 실행돼요
   *
   * 동작 순서:
   * 1. localStorage에서 저장된 설정을 읽어요
   * 2. 읽은 설정이 있으면 기본값(DEFAULTS)과 합쳐요
   *    → 나중에 새 설정 항목이 추가되어도 기본값이 채워줘요
   * 3. 읽은 설정이 없거나 오류가 나면 기본값을 써요
   */
  const [settings, setSettings] = useState(() => {
    try {
      // localStorage에서 저장된 설정 문자열을 읽어요
      const stored = localStorage.getItem(STORAGE_KEY)
      // JSON.parse: 문자열을 JavaScript 객체로 변환해요
      // { ...DEFAULTS, ...JSON.parse(stored) }: 기본값에 저장된 값을 덮어써요
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS }
    } catch {
      // JSON 파싱 실패 등 오류가 생기면 기본값을 사용해요
      return { ...DEFAULTS }
    }
  })

  /**
   * updateSettings — 설정 일부를 업데이트하는 함수
   *
   * 사용 예시:
   * updateSettings({ groqApiKey: 'gsk_...' })
   * → groqApiKey만 바꾸고 나머지는 그대로 유지해요
   *
   * updateSettings({ provider: 'gemini', geminiApiKey: 'AIza...' })
   * → provider와 geminiApiKey 두 가지를 한번에 바꿔요
   *
   * @param {object} updates - 바꿀 설정 항목들 ({ 키: 새값, ... })
   */
  const updateSettings = (updates) => {
    // 현재 설정과 새로운 값을 합쳐서 업데이트된 설정을 만들어요
    const next = { ...settings, ...updates }

    // React 상태를 업데이트해요 → 화면이 다시 그려져요
    setSettings(next)

    // localStorage에도 저장해요 → 브라우저를 닫아도 유지돼요
    // JSON.stringify: JavaScript 객체를 문자열로 변환해요
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  // settings(현재 값)와 updateSettings(변경 함수)를 내보내요
  return { settings, updateSettings }
}
