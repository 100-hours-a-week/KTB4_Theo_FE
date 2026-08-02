export const NOTIFICATION_RECEIVED_EVENT =
  'notifications:received'

export const NOTIFICATION_UNREAD_CHANGED_EVENT =
  'notifications:unread-changed'

export function notifyNotificationReceived(notification) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_RECEIVED_EVENT, {
      detail: notification,
    }),
  )
}

export function notifyUnreadCountChanged() {
  window.dispatchEvent(
    new Event(NOTIFICATION_UNREAD_CHANGED_EVENT),
  )
}