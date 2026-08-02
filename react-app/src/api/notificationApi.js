import { request } from './client.js'

export const DEFAULT_NOTIFICATION_PAGE_SIZE = 20

export function createNotificationListUrl({
  lastNotificationId = null,
  size = DEFAULT_NOTIFICATION_PAGE_SIZE,
} = {}) {
  const params = new URLSearchParams({ size: String(size) })

  if (lastNotificationId !== null) {
    params.set('lastNotificationId', String(lastNotificationId))
  }

  return `/notifications?${params.toString()}`
}

export async function getNotifications(params = {}) {
  const result = await request(createNotificationListUrl(params), {
    method: 'GET',
  })

  return result?.data
}

export async function getUnreadNotificationCount() {
  const result = await request('/notifications/unread-count', {
    method: 'GET',
  })

  return result?.data?.unreadCount ?? 0
}

export async function markNotificationAsRead(notificationId) {
  await request(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })
}

export async function markAllNotificationsAsRead() {
  await request('/notifications/read-all', {
    method: 'PATCH',
  })
}
