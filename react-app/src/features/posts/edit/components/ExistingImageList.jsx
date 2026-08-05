import { useState } from 'react'
import { resolveImageUrl } from '../../../../utils/image.js'

function ExistingImageList({ images, onRemove, disabled = false }) {
  const [failedImageIds, setFailedImageIds] = useState(() => new Set())
  const validImages = Array.isArray(images)
    ? images.filter((image) => image?.imageId && image?.imageUrl)
    : []

  if (validImages.length === 0) {
    return null
  }

  function handleImageError(imageId) {
    setFailedImageIds((currentIds) => {
      if (currentIds.has(imageId)) {
        return currentIds
      }

      const nextIds = new Set(currentIds)
      nextIds.add(imageId)
      return nextIds
    })
  }

  return (
    <section className="existing-image-area">
      <h3>기존 이미지</h3>
      <div className="existing-image-list">
        {validImages.map((image, index) =>
          failedImageIds.has(image.imageId) ? null : (
            <div key={image.imageId} className="existing-post-image-item">
              <img
                className="existing-post-image"
                src={resolveImageUrl(image.imageUrl)}
                alt={`기존 게시글 이미지 ${index + 1}`}
                onError={() => handleImageError(image.imageId)}
              />
              <button
                type="button"
                className="existing-post-image-remove"
                disabled={disabled}
                onClick={() => onRemove(image.imageId)}
              >
                이미지 삭제
              </button>
            </div>
          ),
        )}
      </div>
    </section>
  )
}

export default ExistingImageList
