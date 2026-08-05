import { useState } from 'react'
import imageNextButton from '../../../../assets/images/image-next-button.png'
import imageFallback from '../../../../assets/images/image_fallback.png'
import { resolveImageUrl } from '../../../../utils/image.js'

function PostImageGallery({ images: imageResponses }) {
  const images = Array.isArray(imageResponses)
    ? imageResponses.filter((image) => image?.imageId && image?.imageUrl)
    : []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fallbackImagePaths, setFallbackImagePaths] = useState(
    () => new Set(),
  )
  const [isUnavailable, setIsUnavailable] = useState(false)

  if (images.length === 0 || isUnavailable) {
    return null
  }

  const imageCount = images.length
  const currentImage = images[currentIndex]
  const currentImagePath = currentImage.imageUrl
  const shouldUseFallback = fallbackImagePaths.has(currentImagePath)
  const currentImageSrc = shouldUseFallback
    ? imageFallback
    : resolveImageUrl(currentImagePath)
  const hasMultipleImages = imageCount > 1
  const isFirstImage = currentIndex === 0
  const isLastImage = currentIndex === imageCount - 1

  function showPreviousImage() {
    setCurrentIndex((index) => Math.max(0, index - 1))
  }

  function showNextImage() {
    setCurrentIndex((index) => Math.min(imageCount - 1, index + 1))
  }

  function handleImageError() {
    if (shouldUseFallback) {
      setIsUnavailable(true)
      return
    }

    setFallbackImagePaths((currentPaths) => {
      if (currentPaths.has(currentImagePath)) {
        return currentPaths
      }

      const nextPaths = new Set(currentPaths)
      nextPaths.add(currentImagePath)
      return nextPaths
    })
  }

  return (
    <section className="post-image-gallery" aria-label="게시글 이미지">
      {hasMultipleImages && (
        <button
          type="button"
          className="gallery-navigation gallery-previous"
          aria-label="이전 이미지"
          disabled={isFirstImage}
          onClick={showPreviousImage}
        >
          <img src={imageNextButton} alt="" aria-hidden="true" />
        </button>
      )}

      <img
        key={currentImage.imageId}
        className="post-gallery-image"
        src={currentImageSrc}
        alt="게시글 첨부 이미지"
        onError={handleImageError}
      />

      {hasMultipleImages && (
        <>
          <button
            type="button"
            className="gallery-navigation gallery-next"
            aria-label="다음 이미지"
            disabled={isLastImage}
            onClick={showNextImage}
          >
            <img src={imageNextButton} alt="" aria-hidden="true" />
          </button>
          <p className="gallery-indicator">
            {currentIndex + 1} / {imageCount}
          </p>
        </>
      )}
    </section>
  )
}

export default PostImageGallery
