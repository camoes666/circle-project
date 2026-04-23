/**
 * ════════════════════════════════════════════════════════════
 *  VideoPreview.jsx  —  YouTube 영상 미리보기 컴포넌트
 * ════════════════════════════════════════════════════════════
 *
 * 사용자가 YouTube URL을 입력하면 영상 ID를 받아서
 * 영상을 화면에 미리 보여주는 컴포넌트예요.
 *
 * 어떻게 작동하나요?
 * → YouTube는 "https://www.youtube.com/embed/영상ID" URL로
 *   영상을 삽입(embed)할 수 있는 기능을 제공해요.
 *   이 URL을 iframe(창 안의 창)에 넣으면 영상이 재생돼요.
 *
 * iframe이란?
 * → 웹페이지 안에 다른 웹페이지를 끼워 넣는 HTML 요소예요.
 *   TV 속에 TV가 있는 것처럼요.
 *
 * props (부모 컴포넌트에서 받는 데이터):
 * @param {string|null} videoId - YouTube 영상 ID (예: "dQw4w9WgXcQ")
 *                                 URL을 입력하지 않았거나 잘못된 URL이면 null이에요
 */
export default function VideoPreview({ videoId }) {
  // videoId가 없으면 (null, undefined, 빈 문자열) 아무것도 표시하지 않아요
  // → URL을 아직 입력하지 않았거나 잘못된 URL일 때예요
  if (!videoId) return null

  return (
    // 영상 미리보기를 감싸는 컨테이너
    // aspect-video: 16:9 비율을 유지해요 (일반 영상 비율)
    // overflow-hidden: 내용이 컨테이너 밖으로 삐져나오지 않게 해요
    // animate-fade-in: 영상이 부드럽게 나타나는 애니메이션이에요
    <div className="rounded-[2px] overflow-hidden bg-[var(--bg)] border border-[var(--border)] aspect-video animate-fade-in">

      {/* iframe: YouTube 영상을 페이지 안에 삽입해요 */}
      <iframe
        // YouTube embed URL에 영상 ID를 넣어요
        // 예: https://www.youtube.com/embed/dQw4w9WgXcQ
        src={`https://www.youtube.com/embed/${videoId}`}

        // w-full h-full: 컨테이너를 꽉 채우도록 크기를 설정해요
        className="w-full h-full"

        // allow: iframe 안에서 허용할 기능들이에요
        // accelerometer, gyroscope: 기기 기울기 감지 (모바일용)
        // autoplay: 자동 재생 허용
        // clipboard-write: 클립보드 쓰기 허용
        // encrypted-media: 암호화된 영상 재생 허용
        // picture-in-picture: PIP 모드 허용
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

        // allowFullScreen: 전체화면 버튼을 사용할 수 있게 해요
        allowFullScreen

        // title: 접근성(스크린 리더)을 위한 설명이에요
        title="YouTube 영상 미리보기"

        // loading="lazy": 화면에 보일 때만 로드해요 (성능 최적화)
        loading="lazy"
      />
    </div>
  )
}
