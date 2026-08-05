function ImagePreviewList({ previews, onRemove, disabled = false }) {
  if (previews.length === 0) {
    return null
  }

  return (
    <div className="post-image-preview-list">
      {previews.map(({ file, url }, index) => (
        <div key={url} className="post-image-preview-item">
          <img
            className="post-image-preview"
            src={url}
            alt={`${file.name} 미리보기`}
          />
          <button
            type="button"
            className="post-image-remove-button"
            disabled={disabled}
            onClick={() => onRemove(index)}
          >
            이미지 삭제
          </button>
        </div>
      ))}
    </div>
  )
}

export default ImagePreviewList
