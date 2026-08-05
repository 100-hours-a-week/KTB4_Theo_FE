import { useState } from 'react'
import useObjectUrls from '../../../../hooks/useObjectUrls.js'
import {
  IMAGE_FILE_ACCEPT,
  validateImageFiles,
} from '../../../../utils/imageFiles.js'

function EditPostImagePicker({
  files,
  onChange,
  disabled = false,
  serverError = '',
  onClearServerError,
}) {
  const { previews, replaceFiles } = useObjectUrls()
  const [fileError, setFileError] = useState('')
  const selectedFileNames = files.map((file) => file.name).join(', ')

  function handleChange(event) {
    const nextFiles = Array.from(event.target.files ?? [])
    const nextError = validateImageFiles(nextFiles)

    setFileError(nextError)
    onClearServerError?.()

    if (nextError) {
      replaceFiles([])
      onChange([])
      event.target.value = ''
      return
    }

    replaceFiles(nextFiles)
    onChange(nextFiles)
  }

  function handleRemove(index) {
    const nextFiles = files.filter((_, fileIndex) => fileIndex !== index)
    replaceFiles(nextFiles)
    onChange(nextFiles)
    setFileError('')
    onClearServerError?.()
  }

  return (
    <div className="post-image-upload-area">
      <label className="post-image-label" htmlFor="post-images">
        이미지
      </label>
      <p className="post-image-policy-guide">
        JPEG, PNG, WebP 형식만 가능하며 이미지당 최대 5MB, 전체 최대 25MB까지 업로드할 수 있습니다.
      </p>
      <input
        type="file"
        id="post-images"
        name="postImages"
        accept={IMAGE_FILE_ACCEPT}
        multiple
        disabled={disabled}
        onChange={handleChange}
      />
      <p className="selected-image-name">
        {selectedFileNames
          ? `${selectedFileNames} 선택됨 - 기존 이미지 뒤에 추가됩니다.`
          : '새 이미지를 선택하면 기존 이미지 뒤에 추가됩니다.'}
      </p>
      <p className="edit-post-helper">{fileError || serverError}</p>
      <div className="new-image-preview">
        {previews.map(({ file, url }, index) => (
          <div key={url} className="new-post-image-item">
            <img
              className="new-post-image"
              src={url}
              alt={`${file.name} 미리보기`}
            />
            <button
              type="button"
              className="new-post-image-remove"
              disabled={disabled}
              onClick={() => handleRemove(index)}
            >
              이미지 삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EditPostImagePicker
