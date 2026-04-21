# python-server/

YouTube 자막을 추출하는 Python Flask 서버. SubToDoc 앱의 "로컬 Python 서버" 자막 제공자에서 사용한다.

클라우드 서버(AWS, GCP 등)는 YouTube가 데이터센터 IP를 차단해 작동하지 않을 수 있다.  
개인 PC나 Google Colab처럼 일반 IP 환경에서 실행해야 한다.

## 파일

| 파일 | 용도 |
|------|------|
| `local_server.py` | 개인 PC / 우분투 서버용 |
| `colab_server.py` | Google Colab용 (Cloudflare Tunnel로 외부 노출) |

## local_server.py — 로컬/우분투 서버 실행

**의존성 설치**:
```bash
pip install flask flask-cors youtube-transcript-api
```

**실행**:
```bash
python3 local_server.py
# → http://0.0.0.0:8000 에서 대기
```

**API**:
```
GET /transcript?videoId=dQw4w9WgXcQ
→ { "transcript": "자막 텍스트..." }
```

자막 우선순위: 한국어 → 영어 → 자동 생성 자막 → 기타 언어 순으로 시도.

**SubToDoc 앱 설정**: 설정 → 자막 소스 → 로컬 Python 서버 → `http://서버IP:8000` 입력

---

## colab_server.py — Google Colab 실행

Colab 셀에 파일 내용 전체를 붙여넣고 실행하면:

1. 의존성 자동 설치 (flask, youtube-transcript-api)
2. cloudflared 바이너리 자동 다운로드
3. Flask 서버 포트 5000에서 시작
4. Cloudflare Tunnel을 통해 외부 접근 가능한 `*.trycloudflare.com` URL 출력

출력된 URL을 SubToDoc 앱의 로컬 서버 주소 입력란에 입력하면 된다.

> **주의**: Colab 런타임이 종료되면 URL이 무효화된다. 사용할 때마다 재실행 후 새 URL로 업데이트 필요.
