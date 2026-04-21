# SubToDoc

YouTube 영상 URL을 붙여넣으면 자막을 추출해 AI가 요약·블로그·회의록·노트로 변환해주는 웹앱.

**배포 주소**: https://camoes666.github.io/circle-project/

## 특징

- 서버 없음 — 브라우저에서 직접 AI API 호출 (Groq / Gemini)
- API 키는 내 브라우저 localStorage에만 저장
- 자막 가져오기 방법 3가지: Supadata API / 로컬 Python 서버 / 자동
- 자막을 자동으로 못 가져오면 직접 붙여넣기 fallback 제공

## 로컬 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

`.env` 파일에 Worker URL 설정 (없으면 자동 모드 작동 안 함):

```
VITE_WORKER_URL=https://subtodoc-transcript.camoes666.workers.dev
```

## 빌드 & 배포

```bash
npm run build      # dist/ 생성
# GitHub Pages는 gh-pages 브랜치에 dist/ 내용을 수동 push
```

## 테스트

```bash
npm run test:run   # 전체 테스트 1회 실행
npm test           # watch 모드
```

## 폴더 구조

```
src/
├── App.jsx              메인 컴포넌트 (상태 관리, 변환 흐름)
├── components/          UI 컴포넌트 모음
├── services/            비즈니스 로직 (자막 추출, AI 호출, 내보내기)
├── hooks/               커스텀 훅 (설정, 히스토리)
└── index.css            Tailwind + 마크다운 렌더링 스타일
```

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | React 18 + Vite |
| 스타일링 | Tailwind CSS |
| AI | Groq (llama-4-scout) / Gemini (gemini-1.5-flash) |
| 테스트 | Vitest + Testing Library |
| 배포 | GitHub Pages |
