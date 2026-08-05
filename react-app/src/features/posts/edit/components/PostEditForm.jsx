import { useState } from 'react'
import {
  isPostFormValid,
  POST_TITLE_MAX_LENGTH,
  validatePostContent,
  validatePostTitle,
} from '../../editor/utils/postValidation.js'
import EditPostImagePicker from './EditPostImagePicker.jsx'
import ExistingImageList from './ExistingImageList.jsx'

const EMPTY_ERRORS = {
  title: '',
  content: '',
  images: '',
}

function PostEditForm({
  initialValues,
  isSubmitting,
  serverErrors = EMPTY_ERRORS,
  onClearServerError,
  onSubmit,
}) {
  const [title, setTitle] = useState(initialValues.title)
  const [content, setContent] = useState(initialValues.content)
  const [retainedImages, setRetainedImages] = useState(initialValues.images)
  const [imageFiles, setImageFiles] = useState([])
  const [fieldErrors, setFieldErrors] = useState(EMPTY_ERRORS)
  const canSubmit = isPostFormValid({ title, content }) && !isSubmitting

  function handleTitleBlur() {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      title: validatePostTitle(title),
    }))
    onClearServerError('title')
  }

  function handleContentBlur() {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      content: validatePostContent(content),
    }))
    onClearServerError('content')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const nextErrors = {
      title: validatePostTitle(title),
      content: validatePostContent(content),
    }

    setFieldErrors(nextErrors)

    if (nextErrors.title || nextErrors.content) {
      return
    }

    onSubmit({
      title,
      content,
      retainedImageIds: retainedImages.map((image) => image.imageId),
      imageFiles,
    })
  }

  function handleRemoveExistingImage(imageId) {
    setRetainedImages((currentImages) =>
      currentImages.filter((image) => image.imageId !== imageId),
    )
  }

  const titleError = fieldErrors.title || serverErrors.title || ''
  const contentError = fieldErrors.content || serverErrors.content || ''

  return (
    <form className="edit-post-card" onSubmit={handleSubmit} noValidate>
      <div className="edit-post-form-group">
        <label htmlFor="post-title">제목*</label>
        <input
          type="text"
          id="post-title"
          name="title"
          maxLength={POST_TITLE_MAX_LENGTH}
          placeholder="제목을 입력해주세요. (최대 26글자)"
          value={title}
          aria-describedby="edit-post-title-helper"
          aria-invalid={Boolean(titleError)}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={handleTitleBlur}
        />
        <p className="edit-post-helper" id="edit-post-title-helper">
          {titleError}
        </p>
      </div>

      <div className="edit-post-form-group">
        <label htmlFor="post-content">내용*</label>
        <textarea
          id="post-content"
          name="content"
          placeholder="내용을 입력해주세요."
          value={content}
          aria-describedby="edit-post-content-helper"
          aria-invalid={Boolean(contentError)}
          onChange={(event) => setContent(event.target.value)}
          onBlur={handleContentBlur}
        />
        <p className="edit-post-helper" id="edit-post-content-helper">
          {contentError}
        </p>
      </div>

      <ExistingImageList
        images={retainedImages}
        disabled={isSubmitting}
        onRemove={handleRemoveExistingImage}
      />
      <EditPostImagePicker
        files={imageFiles}
        disabled={isSubmitting}
        serverError={serverErrors.images}
        onChange={setImageFiles}
        onClearServerError={() => onClearServerError('images')}
      />

      <button
        type="submit"
        className="edit-post-submit-button"
        disabled={!canSubmit}
      >
        {isSubmitting ? '수정 중...' : '수정하기'}
      </button>
    </form>
  )
}

export default PostEditForm
