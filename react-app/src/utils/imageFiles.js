export const IMAGE_FILE_ACCEPT = 'image/jpeg,image/png,image/webp'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_REQUEST_SIZE = 25 * 1024 * 1024

export function validateImageFiles(files, { required = false } = {}) {
  if (files.length === 0) {
    return required ? '* 이미지를 선택해주세요.' : ''
  }

  if (files.some((file) => !ALLOWED_IMAGE_TYPES.has(file.type))) {
    return '* JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.'
  }

  if (files.some((file) => file.size === 0)) {
    return '* 비어 있는 이미지 파일은 업로드할 수 없습니다.'
  }

  if (files.some((file) => file.size > MAX_IMAGE_FILE_SIZE)) {
    return '* 이미지 한 장의 크기는 최대 5MB입니다.'
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > MAX_IMAGE_REQUEST_SIZE) {
    return '* 이미지 전체 크기는 최대 25MB입니다.'
  }

  return ''
}

export function getImageRequestError(error) {
  const message = error?.message

  if (message === 'empty_image_file') {
    return '* 비어 있는 이미지 파일은 업로드할 수 없습니다.'
  }

  if (message === 'invalid_image_type') {
    return '* JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.'
  }

  if (message === 'image_file_too_large') {
    return '* 이미지 용량이 허용 범위를 초과했습니다.'
  }

  if (message === 'invalid_image_id') {
    return '* 기존 이미지 정보가 변경되었습니다. 새로고침 후 다시 시도해주세요.'
  }

  if (message === 'image_upload_failed') {
    return '* 이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }

  if (message === 'image_delete_failed') {
    return '* 이미지 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }

  if (message === 'image_read_failed') {
    return '* 이미지 정보를 불러오지 못했습니다.'
  }

  return ''
}
