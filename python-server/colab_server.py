# SubToDoc - YouTube 자막 서버
# Google Colab에서 실행하세요
# 셀 하나에 전부 붙여넣고 실행 (Shift+Enter)

# ── 1. 패키지 설치 ──────────────────────────────────────────
import subprocess
subprocess.run(['pip', 'install', '-q', 'flask', 'flask-cors', 'youtube-transcript-api'])

# Cloudflare Tunnel (무료, 계정 불필요)
import os, platform
if not os.path.exists('./cloudflared'):
    subprocess.run([
        'wget', '-q',
        'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64',
        '-O', 'cloudflared'
    ])
    subprocess.run(['chmod', '+x', 'cloudflared'])

# ── 2. Flask 서버 ───────────────────────────────────────────
from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
import threading, subprocess, re, time

app = Flask(__name__)
CORS(app)  # 모든 도메인 허용 (GitHub Pages 포함)

@app.route('/transcript')
def get_transcript():
    video_id = request.args.get('videoId', '').strip()
    if not video_id:
        return jsonify({'error': 'videoId가 필요합니다'}), 400

    # 한국어 → 영어 → 자동생성 순서로 시도
    for langs in (['ko'], ['en'], None):
        try:
            kwargs = {'languages': langs} if langs else {}
            data = YouTubeTranscriptApi.get_transcript(video_id, **kwargs)
            text = ' '.join(d['text'] for d in data)
            return jsonify({'transcript': text})
        except Exception:
            continue

    return jsonify({'error': '이 영상에는 자막이 없습니다'}), 404

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

# Flask를 백그라운드 스레드에서 실행
threading.Thread(
    target=lambda: app.run(host='0.0.0.0', port=5000, use_reloader=False),
    daemon=True
).start()
print('Flask 서버 시작됨 (port 5000)')

# ── 3. Cloudflare Tunnel로 외부 URL 생성 ────────────────────
print('Cloudflare Tunnel 연결 중...')
tunnel = subprocess.Popen(
    ['./cloudflared', 'tunnel', '--url', 'http://localhost:5000'],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT
)

# URL이 나올 때까지 대기
public_url = None
for _ in range(30):
    line = tunnel.stdout.readline().decode('utf-8', errors='ignore')
    match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
    if match:
        public_url = match.group()
        break
    time.sleep(0.5)

if public_url:
    print(f'\n{"="*50}')
    print(f'✅ 서버 URL:\n   {public_url}')
    print(f'{"="*50}')
    print('\n👆 이 URL을 복사해서:')
    print('   앱 설정(⚙️) → 자막 소스: 로컬 Python 서버 → 서버 주소에 붙여넣기')
    print('\n⚠️  이 셀을 종료하면 서버도 꺼집니다. 탭을 열어두세요.')
else:
    print('❌ Tunnel URL을 가져오지 못했습니다. 다시 실행해보세요.')
