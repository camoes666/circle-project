/**
 * ════════════════════════════════════════════════════════════
 *  SettingsModal.jsx  —  설정 창(모달) 컴포넌트
 * ════════════════════════════════════════════════════════════
 *
 * 오른쪽 상단의 톱니바퀴(⚙) 버튼을 누르면 나타나는 설정 창이에요.
 *
 * 설정할 수 있는 것들:
 * 1. 자막 소스 설정
 *    - 자체 서버 URL (기본: https://my-yt-api.duckdns.org)
 *    - Supadata API Key (supadata.ai에서 발급)
 *    - 로컬 서버 주소 (기본: http://localhost:8000)
 *
 * 2. AI API 키 설정
 *    - Groq API Key (console.groq.com에서 발급)
 *    - Gemini API Key (aistudio.google.com에서 발급)
 *    - 출력 언어 (한국어/영어/일본어/중국어)
 *
 * 모달(Modal)이란?
 * → 현재 화면 위에 떠있는 별도의 창이에요.
 *   배경을 반투명하게 어둡게 만들고 중앙에 팝업처럼 나타나요.
 *   설정을 완료하거나 취소하면 사라져요.
 *
 * props (부모 컴포넌트에서 받는 데이터):
 * @param {object}   settings - 현재 저장된 설정 값들
 * @param {function} onSave   - 저장 버튼을 눌렀을 때 호출되는 함수
 * @param {function} onClose  - 모달을 닫을 때 호출되는 함수 (취소/저장 모두)
 */

// useState: 입력창의 임시 값들을 기억하는 도구
import { useState } from 'react'

/**
 * LANGUAGES — 출력 언어 선택 목록
 *
 * AI가 문서를 어떤 언어로 작성할지 선택해요.
 * 기본값은 '한국어'예요.
 */
const LANGUAGES = ['한국어', '영어', '일본어', '중국어']

/**
 * SettingsModal — 설정 창 컴포넌트
 *
 * @param {object}   settings - 현재 저장된 설정 (초기값으로 사용)
 * @param {function} onSave   - 새 설정을 저장하는 함수
 * @param {function} onClose  - 창을 닫는 함수
 */
export default function SettingsModal({ settings, onSave, onClose }) {
  /**
   * local — 설정 창 안에서 임시로 가지고 있는 설정 값들이에요
   *
   * 왜 따로 만드냐면?
   * → 사용자가 설정 창에서 값을 바꾸다가 "취소"를 누르면
   *   원래 값으로 돌아가야 해요.
   *   만약 바로 settings를 바꾸면 취소가 불가능해지기 때문에
   *   local에 임시로 저장해두고, "저장"을 눌러야만 실제로 적용해요.
   *
   * { ...settings }: settings 객체를 복사해서 새 객체를 만들어요
   *   (원본 settings가 변경되지 않도록)
   */
  const [local, setLocal] = useState({ ...settings })

  /**
   * handleSave — 저장 버튼을 눌렀을 때 실행되는 함수
   *
   * 1. onSave(local): 임시 설정(local)을 실제로 저장해요
   * 2. onClose(): 설정 창을 닫아요
   */
  const handleSave = () => { onSave(local); onClose() }

  return (
    // 모달 배경 — 전체 화면을 반투명 검은색으로 덮어요
    // fixed: 스크롤해도 항상 같은 자리에 고정
    // inset-0: 화면 전체를 덮음 (위, 오른쪽, 아래, 왼쪽 모두 0)
    // bg-black/70: 70% 불투명 검은색 배경
    // z-50: 다른 요소들보다 위에 표시
    // overflow-y-auto py-8: 모달이 길면 스크롤 가능
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">

      {/* 설정 창 본체 */}
      {/* max-w-md: 최대 너비 제한 (너무 넓어지지 않게) */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2px] p-6 w-full max-w-md space-y-5" style={{ boxShadow: 'rgba(0,0,0,0.3) 0px 0px 5px 0px' }}>

        {/* 창 제목 */}
        <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">설정 — API 키 관리</h2>

        {/* ════════ 자막 소스 설정 섹션 ════════ */}
        <section className="space-y-3">
          {/* 섹션 제목 (초록색) */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#76b900]">자막 소스</h3>

          {/* ── 자체 서버 URL 입력 ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              자체 서버 URL
            </label>
            <input
              type="text"
              // 값이 없으면 기본값(duckdns.org)을 보여줘요
              value={local.customServerUrl ?? 'https://my-yt-api.duckdns.org'}
              // 타이핑할 때마다 local 상태의 customServerUrl을 업데이트해요
              // { ...l }: 기존 설정을 복사하고, customServerUrl만 새 값으로 바꿔요
              onChange={e => setLocal(l => ({ ...l, customServerUrl: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="https://my-yt-api.duckdns.org"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">POST /api/transcript 엔드포인트를 지원하는 서버 주소</p>
          </div>

          {/* ── Supadata API Key 입력 ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Supadata API Key
              {/* 외부 링크 — 새 탭에서 supadata.ai를 열어요 */}
              <a href="https://supadata.ai" target="_blank" rel="noopener noreferrer" className="ml-2 normal-case font-normal text-[#76b900] hover:text-[#bff230] text-xs">무료 가입 →</a>
            </label>
            {/* type="password": 입력값이 ***로 가려져요 (보안) */}
            <input
              type="password"
              value={local.supadadataApiKey ?? ''}
              onChange={e => setLocal(l => ({ ...l, supadadataApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="sup_..."  /* Supadata 키는 "sup_"로 시작해요 */
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">무료 플랜: 10회/일</p>
          </div>

          {/* ── 로컬 서버 주소 입력 ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">로컬 서버 주소</label>
            <input
              type="text"
              value={local.localServerUrl ?? 'http://localhost:8000'}
              onChange={e => setLocal(l => ({ ...l, localServerUrl: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="http://localhost:8000"
            />
            {/* code 태그: 코드를 보여줄 때 쓰는 태그 (초록색으로 표시) */}
            <p className="text-xs text-[var(--text-muted)] mt-1">Python 서버가 <code className="text-[#76b900]">GET /transcript?videoId=XXX</code>를 처리해야 합니다</p>
          </div>
        </section>

        {/* ════════ AI API 키 설정 섹션 ════════ */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#76b900]">AI API 키</h3>

          {/* ── Groq API Key 입력 ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Groq API Key
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="ml-2 normal-case font-normal text-[#76b900] hover:text-[#bff230] text-xs">무료 키 발급 →</a>
            </label>
            <input
              type="password"
              value={local.groqApiKey ?? ''}
              onChange={e => setLocal(l => ({ ...l, groqApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="gsk_..."  /* Groq 키는 "gsk_"로 시작해요 */
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Groq · OpenAI(gpt-oss) 모두 이 키를 사용합니다.</p>
          </div>

          {/* ── Gemini API Key 입력 ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Gemini API Key
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="ml-2 normal-case font-normal text-[#76b900] hover:text-[#bff230] text-xs">무료 키 발급 →</a>
            </label>
            <input
              type="password"
              value={local.geminiApiKey ?? ''}
              onChange={e => setLocal(l => ({ ...l, geminiApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
              placeholder="AIza..."  /* Gemini 키는 "AIza"로 시작해요 */
            />
          </div>

          {/* ── 출력 언어 선택 ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">출력 언어</label>
            {/* select: 드롭다운 선택 박스예요 */}
            <select
              value={local.language}
              onChange={e => setLocal(l => ({ ...l, language: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[2px] text-sm focus:outline-none focus:border-[#76b900] text-[var(--text)]"
            >
              {/* LANGUAGES 배열의 각 언어를 옵션으로 표시해요 */}
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </section>

        {/* ── 하단 버튼들 (취소 / 저장) ── */}
        <div className="flex justify-end gap-2 pt-2">
          {/* 취소 버튼 — 저장하지 않고 창을 닫아요 */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            취소
          </button>

          {/* 저장 버튼 — handleSave를 호출해서 설정을 저장하고 창을 닫아요 */}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-transparent border-2 border-[#76b900] rounded-[2px] text-sm font-bold text-[var(--text)] hover:bg-[#1eaedb] hover:border-[#1eaedb] transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
