import { useState } from 'react'
import {
  isPostFormValid,
  POST_TITLE_MAX_LENGTH,
  validatePostContent,
  validatePostTitle,
} from '../utils/postValidation.js'
import PostImagePicker from './PostImagePicker.jsx'

const EMPTY_ERRORS = {
  title: '',
  content: '',
  images: '',
}

function PostForm({
  isSubmitting,
  serverErrors = EMPTY_ERRORS,
  onClearServerError,
  onSubmit,
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
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

    onSubmit({ title, content, imageFiles })
  }

  const titleError = fieldErrors.title || serverErrors.title || ''
  const contentError = fieldErrors.content || serverErrors.content || ''

  return (
    <form className="make-post-editor" onSubmit={handleSubmit} noValidate>
      <div className="make-post-title-field">
        <label className="sr-only" htmlFor="post-title">
          제목*
        </label>
        <input
          type="text"
          id="post-title"
          name="title"
          maxLength={POST_TITLE_MAX_LENGTH}
          placeholder="오늘의 개발 한입을 적어주세요"
          value={title}
          aria-describedby="post-title-helper"
          aria-invalid={Boolean(titleError)}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={handleTitleBlur}
        />
        <p className="make-post-helper" id="post-title-helper">
          {titleError}
        </p>
      </div>

      <div className="make-post-content-field">
        <label className="sr-only" htmlFor="post-content">
          내용*
        </label>
        <textarea
          id="post-content"
          name="content"
          placeholder="배운 점, 막혔던 부분, 해결한 과정을 자유롭게 남겨보세요."
          value={content}
          aria-describedby="post-content-helper"
          aria-invalid={Boolean(contentError)}
          onChange={(event) => setContent(event.target.value)}
          onBlur={handleContentBlur}
        />
        <p className="make-post-helper" id="post-content-helper">
          {contentError}
        </p>
      </div>

      <PostImagePicker
        files={imageFiles}
        disabled={isSubmitting}
        serverError={serverErrors.images}
        onChange={setImageFiles}
        onClearServerError={() => onClearServerError('images')}
      />

      <div className="make-post-actions">
        <button
          type="submit"
          className="make-post-submit-button"
          disabled={!canSubmit}
        >
          {isSubmitting ? '등록 중...' : '완료'}
        </button>
      </div>
    </form>
  )
}

export default PostForm
