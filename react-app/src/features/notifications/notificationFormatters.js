const NOTIFICATION_MESSAGES = {
  LIKE: (nickname) => `${nickname}님이 회원님의 게시글을 좋아합니다.`,
  COMMENT: (nickname) =>
    `${nickname}님이 회원님의 게시글에 댓글을 작성했습니다.`,
  REPLY: (nickname) =>
    `${nickname}님이 회원님의 댓글에 답글을 작성했습니다.`,
}

export function getNotificationMessage(notification) {
  const nickname = notification?.actorNickname || '알 수 없음'
  const createMessage = NOTIFICATION_MESSAGES[notification?.type]

  return createMessage
    ? createMessage(nickname)
    : `${nickname}님의 새로운 활동이 있습니다.`
}

export function getNotificationTarget(notification) {
  if (!notification?.postId) {
    return '/posts'
  }

  const commentHash = notification.commentId
    ? `#comment-${notification.commentId}`
    : ''

  return `/posts/${notification.postId}${commentHash}`
}

export function formatNotificationDate(value) {
  if (!value) {
    return ''
  }

  const createdAt = new Date(value)

  if (Number.isNaN(createdAt.getTime())) {
    return ''
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / 1000),
  )

  if (elapsedSeconds < 60) {
    return '방금 전'
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}분 전`
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) {
    return `${elapsedHours}시간 전`
  }

  const elapsedDays = Math.floor(elapsedHours / 24)
  if (elapsedDays < 7) {
    return `${elapsedDays}일 전`
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(createdAt)
}
