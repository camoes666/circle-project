export default function VideoPreview({ videoId }) {
  if (!videoId) return null

  return (
    <div className="rounded-xl overflow-hidden bg-black aspect-video animate-fade-in">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube 영상 미리보기"
        loading="lazy"
      />
    </div>
  )
}
