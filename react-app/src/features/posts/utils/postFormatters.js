export const POST_TITLE_MAX_LENGTH = 26
export const COUNT_COMPACT_THRESHOLD = 1000

function parseDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function padDatePart(value) {
  return String(value).padStart(2, '0')
}

export function formatPostCount(count) {
  const safeCount = Number(count) || 0

  if (safeCount >= COUNT_COMPACT_THRESHOLD) {
    return `${Math.floor(safeCount / COUNT_COMPACT_THRESHOLD)}k`
  }

  return String(safeCount)
}

export function formatPostDate(createdAt) {
  const date = parseDate(createdAt)

  if (!date) {
    return ''
  }

  const datePart = [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-')
  const timePart = [
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
    padDatePart(date.getSeconds()),
  ].join(':')

  return `${datePart} ${timePart}`
}

export function formatPostListDate(createdAt) {
  const date = parseDate(createdAt)

  if (!date) {
    return ''
  }

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('.')
}

export function getPostTitle(post) {
  if (post.blinded) {
    return '숨김 처리된 게시글입니다.'
  }

  const title = post.title || ''

  return title.length > POST_TITLE_MAX_LENGTH
    ? title.slice(0, POST_TITLE_MAX_LENGTH)
    : title
}

export function getPostNickname(post) {
  if (post.authorDeleted) {
    return '알 수 없음'
  }

  return post.nickname || ''
}
