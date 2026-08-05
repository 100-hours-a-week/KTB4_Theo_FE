import { useState } from 'react'
import useObjectUrls from '../../../../hooks/useObjectUrls.js'
import {
  IMAGE_FILE_ACCEPT,
  validateImageFiles,
} from '../../../../utils/imageFiles.js'
import ImagePreviewList from './ImagePreviewList.jsx'

function PostImagePicker({
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
      <p className="selected-image-names">
        {selectedFileNames || '선택된 이미지가 없습니다.'}
      </p>
      <p className="make-post-helper">{fileError || serverError}</p>
      <ImagePreviewList
        previews={previews}
        disabled={disabled}
        onRemove={handleRemove}
      />
    </div>
  )
}

export default PostImagePicker
