# components/

SubToDoc UI 컴포넌트 모음. 각 컴포넌트는 단일 책임 원칙을 따르며, 상태는 `App.jsx`에서 내려준다.

## 컴포넌트 목록

### UrlInput
YouTube URL 입력 필드. YouTube 아이콘 prefix, 입력 시 X 버튼(지우기) 포함.

**Props**: `value: string`, `onChange: (value) => void`

---

### FormatSelector
문서 형식 선택 2×2 그리드 카드. 타임스탬프 토글과 직접 지시하기 입력란 포함.

**Props**: `selected`, `onChange`, `includeTimestamps`, `onTimestampsChange`, `customInstruction`, `onCustomInstructionChange`

---

### ResultViewer
변환 결과 마크다운 렌더링. h1/h2/h3, 불릿, 굵게, 기울임, 코드 지원. 결과 내 `[MM:SS]` 타임스탬프는 YouTube 링크로 자동 변환.

**Props**: `content: string`, `videoId?: string`

상단 툴바에 복사 버튼 내장.

---

### ExportButtons
변환 결과 내보내기 버튼 모음.

**Props**: `content: string`

- `.md 다운로드` — Markdown 파일로 저장
- `PDF 저장` — html2pdf.js로 PDF 생성

---

### SettingsModal
AI 제공자(Groq/Gemini), API 키, 자막 소스, 출력 언어 설정 모달.

**Props**: `settings`, `onSave`, `onClose`

내부에서 로컬 복사 상태 유지 → 저장 버튼 클릭 시 반영 (Cancel 시 원복).

---

### TranscriptPaste
자막 직접 붙여넣기 모드 UI. 북마클릿 드래그 저장 링크, 사용 방법 안내, 글자 수 표시 포함.

**Props**: `value: string`, `onChange: (value) => void`

---

### VideoPreview _(v2 예정)_
YouTube embed iframe. `videoId`가 있을 때만 렌더링.

**Props**: `videoId?: string`

---

### HistoryPanel _(v2 예정)_
지난 변환 목록 아코디언 패널. 썸네일, 날짜, 형식 배지, 복원/삭제 버튼 포함.

**Props**: `history`, `onRestore`, `onRemove`, `onClear`
