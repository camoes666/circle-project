# SubToDoc - 로컬 YouTube 자막 서버
# 내 PC에서 실행할 때 사용
#
# 설치:  pip install flask flask-cors youtube-transcript-api
# 실행:  python local_server.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi

app = Flask(__name__)
CORS(app)

@app.route('/transcript')
def get_transcript():
    video_id = request.args.get('videoId', '').strip()
    if not video_id:
        return jsonify({'error': 'videoId가 필요합니다'}), 400

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

if __name__ == '__main__':
    print('SubToDoc 서버 시작: http://localhost:8000')
    print('앱 설정 → 자막 소스: 로컬 Python 서버 → http://localhost:8000')
    app.run(host='0.0.0.0', port=8000, debug=False)
