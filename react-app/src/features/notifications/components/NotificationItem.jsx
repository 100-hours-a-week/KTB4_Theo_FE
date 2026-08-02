import ProfileImage from '../../../components/media/ProfileImage.jsx'
import {
  formatNotificationDate,
  getNotificationMessage,
} from '../notificationFormatters.js'

function NotificationItem({ notification, isOpening, onOpen }) {
  return (
    <li>
      <button
        type="button"
        className={[
          'notification-item',
          notification.read ? 'is-read' : 'is-unread',
        ].join(' ')}
        disabled={isOpening}
        onClick={() => onOpen(notification)}
      >
        <span className="notification-profile">
          <ProfileImage
            imagePath={notification.actorProfileImage}
            alt=""
          />
        </span>
        <span className="notification-content">
          <span className="notification-message">
            {getNotificationMessage(notification)}
          </span>
          <time
            className="notification-date"
            dateTime={notification.createdAt || ''}
          >
            {formatNotificationDate(notification.createdAt)}
          </time>
        </span>
        {!notification.read && (
          <span className="notification-unread-dot" aria-label="읽지 않음" />
        )}
      </button>
    </li>
  )
}

export default NotificationItem
