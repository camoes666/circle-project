# circle-project

개인 개발 실험 모음 레포지토리.

## 프로젝트 구조

| 폴더 | 설명 |
|------|------|
| [`subtodoc/`](./subtodoc/) | YouTube URL → AI 문서 변환 웹앱 (메인 프로젝트) |
| [`worker/`](./worker/) | YouTube 자막 CORS 프록시 Cloudflare Worker |
| [`python-server/`](./python-server/) | 로컬/Colab 자막 추출 Python 서버 |
| [`docs/`](./docs/) | 기획서, 개발계획, 아키텍처 리뷰 등 문서 모음 |
| [`지식/`](./지식/) | 개발·기획 관련 학습 노트 |

## 배포

- **SubToDoc 앱**: https://camoes666.github.io/circle-project/
- **Cloudflare Worker**: https://subtodoc-transcript.camoes666.workers.dev

## 개발 환경

```bash
# SubToDoc 로컬 실행
cd subtodoc && npm install && npm run dev

# Worker 로컬 실행
cd worker && npm install && npm run dev
```
