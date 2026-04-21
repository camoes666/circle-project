# worker/

YouTube 자막 URL CORS 프록시 역할을 하는 Cloudflare Worker.

브라우저에서 YouTube 자막 URL을 직접 호출하면 CORS 정책으로 차단된다.  
이 Worker가 중간에서 요청을 대신 보내고 응답에 CORS 헤더를 붙여 돌려준다.

**배포 주소**: https://subtodoc-transcript.camoes666.workers.dev

## 사용 방법

SubToDoc 앱이 자동으로 이 Worker를 호출한다. 직접 호출할 경우:

```
GET /?url=https%3A%2F%2Fwww.youtube.com%2Fapi%2Ftimedtext%3F...
→ 자막 XML 텍스트 반환
```

## 로컬 개발

```bash
npm install
npm run dev     # http://localhost:8787
```

## 배포

```bash
npm run deploy   # wrangler를 통해 Cloudflare에 배포
```

> Cloudflare 계정과 `wrangler login`이 필요하다.

## 한계

YouTube의 PO Token(Proof of Origin) 정책으로 인해 자막 timedtext URL이  
서버 IP에서 요청될 때 빈 응답(200 OK, 0 bytes)을 반환하는 경우가 있다.  
이 경우 Supadata API 또는 로컬 Python 서버 방식으로 전환해야 한다.

## test-*.mjs 파일들

Worker 개발 중 YouTube API 동작 방식을 실험한 테스트 스크립트들.  
현재는 참고용으로만 남아 있으며, 프로덕션 코드가 아니다.
