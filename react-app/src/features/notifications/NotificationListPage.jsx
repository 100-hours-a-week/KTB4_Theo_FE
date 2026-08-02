import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../api/notificationApi.js'
import AppLayout from '../../components/layout/AppLayout.jsx'
import {
  NOTIFICATION_RECEIVED_EVENT,
  notifyUnreadCountChanged,
} from './notificationEvents.js'
import useHeaderControls from '../../hooks/useHeaderControls.js'
import '../../styles/common.css'
import '../../styles/notifications.css'
import useAuth from '../auth/useAuth.js'
import useInfiniteScroll from '../posts/hooks/useInfiniteScroll.js'
import NotificationItem from './components/NotificationItem.jsx'
import { getNotificationTarget } from './notificationFormatters.js'

function NotificationListPage() {
  const navigate = useNavigate()
  const { user, logout, isLoggingOut } = useAuth()
  const {
    isProfileMenuOpen,
    closeProfileMenu,
    toggleProfileMenu,
    handleLogout,
  } = useHeaderControls({ logout })
  const [notifications, setNotifications] = useState([])
  const [hasNext, setHasNext] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [openingNotificationId, setOpeningNotificationId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const nextCursorRef = useRef(null)
  const requestPromiseRef = useRef(null)
  const hasRequestedInitialPageRef = useRef(false)
  const isMountedRef = useRef(false)

  const readNotificationList = useCallback(
    ({ initial = false } = {}) => {
      if (requestPromiseRef.current) {
        return requestPromiseRef.current
      }

      if (!initial && !hasNext) {
        return Promise.resolve()
      }

      setErrorMessage('')
      initial ? setIsInitialLoading(true) : setIsLoadingMore(true)

      const requestPromise = getNotifications({
        lastNotificationId: initial ? null : nextCursorRef.current,
      })
        .then((data) => {
          if (!isMountedRef.current) {
            return
          }

          const nextNotifications = Array.isArray(data?.notifications)
            ? data.notifications
            : []

          setNotifications((current) =>
            initial
              ? nextNotifications
              : [...current, ...nextNotifications],
          )
          setHasNext(Boolean(data?.hasNext))
          nextCursorRef.current = data?.nextCursor ?? null
        })
        .catch((error) => {
          console.error(error)

          if (isMountedRef.current) {
            setErrorMessage('알림을 불러오지 못했습니다. 다시 시도해주세요.')
          }
        })
        .finally(() => {
          requestPromiseRef.current = null

          if (isMountedRef.current) {
            setIsInitialLoading(false)
            setIsLoadingMore(false)
          }
        })

      requestPromiseRef.current = requestPromise
      return requestPromise
    },
    [hasNext],
  )

  const handleNotificationOpen = useCallback(
    async (notification) => {
      if (openingNotificationId !== null) {
        return
      }

      setOpeningNotificationId(notification.notificationId)

      try {
        if (!notification.read) {
          await markNotificationAsRead(notification.notificationId)
          notifyUnreadCountChanged()
        }

        navigate(getNotificationTarget(notification))
      } catch (error) {
        console.error(error)
        setOpeningNotificationId(null)
        setErrorMessage('알림을 여는 중 오류가 발생했습니다.')
      }
    },
    [navigate, openingNotificationId],
  )

  const handleMarkAllAsRead = useCallback(async () => {
    if (isMarkingAll) {
      return
    }

    setIsMarkingAll(true)
    setErrorMessage('')

    try {
      await markAllNotificationsAsRead()
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        })),
      )
      notifyUnreadCountChanged()
    } catch (error) {
      console.error(error)
      setErrorMessage('전체 읽음 처리에 실패했습니다.')
    } finally {
      if (isMountedRef.current) {
        setIsMarkingAll(false)
      }
    }
  }, [isMarkingAll])

  const sentinelRef = useInfiniteScroll({
    hasNext,
    isLoading: isInitialLoading || isLoadingMore,
    onLoadMore: readNotificationList,
    refreshKey: notifications.length,
  })

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!hasRequestedInitialPageRef.current) {
      hasRequestedInitialPageRef.current = true
      readNotificationList({ initial: true })
    }
  }, [readNotificationList])

  const hasUnreadNotifications = notifications.some(
    (notification) => !notification.read,
  )

  useEffect(() => {
  function handleNotificationReceived(event) {
    const receivedNotification = event.detail

    if (!receivedNotification?.notificationId) {
      return
    }

    setNotifications((current) => {
      const alreadyExists = current.some(
        (notification) =>
          notification.notificationId ===
          receivedNotification.notificationId,
      )

      if (alreadyExists) {
        return current
      }

      return [
        receivedNotification,
        ...current,
      ]
    })
  }

  window.addEventListener(
    NOTIFICATION_RECEIVED_EVENT,
    handleNotificationReceived,
  )

  return () => {
    window.removeEventListener(
      NOTIFICATION_RECEIVED_EVENT,
      handleNotificationReceived,
    )
  }
}, [])

  return (
    <AppLayout
      pageClassName="notifications-page"
      headerClassName="posts-header"
      mainClassName="notifications-main"
      headerProps={{
        profileImagePath: user?.profileImage,
        isProfileMenuOpen,
        onProfileMenuToggle: toggleProfileMenu,
        onProfileMenuClose: closeProfileMenu,
        onLogout: handleLogout,
        isLoggingOut,
      }}
    >
      <section
        className="notifications-container"
        aria-labelledby="notifications-title"
      >
        <div className="notifications-heading">
          <div>
            <p className="notifications-eyebrow">ACTIVITY</p>
            <h2 id="notifications-title">알림</h2>
            <p className="notifications-description">
              회원님의 게시글과 댓글에 도착한 새로운 소식입니다.
            </p>
          </div>
          <button
            type="button"
            className="notification-read-all-button"
            disabled={!hasUnreadNotifications || isMarkingAll}
            onClick={handleMarkAllAsRead}
          >
            {isMarkingAll ? '처리 중...' : '모두 읽음'}
          </button>
        </div>

        {errorMessage && (
          <div className="notifications-error" role="alert">
            <span>{errorMessage}</span>
            {notifications.length === 0 && (
              <button
                type="button"
                onClick={() => readNotificationList({ initial: true })}
              >
                다시 시도
              </button>
            )}
          </div>
        )}

        {isInitialLoading ? (
          <div className="notifications-status" role="status">
            알림을 불러오는 중입니다.
          </div>
        ) : notifications.length === 0 && !errorMessage ? (
          <div className="notifications-empty">
            <span className="notifications-empty-bell" aria-hidden="true">
              !
            </span>
            <h3>아직 도착한 알림이 없습니다.</h3>
            <p>새로운 활동이 생기면 이곳에서 바로 확인할 수 있어요.</p>
          </div>
        ) : (
          <ul className="notification-list">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                isOpening={
                  openingNotificationId === notification.notificationId
                }
                onOpen={handleNotificationOpen}
              />
            ))}
          </ul>
        )}

        {isLoadingMore && (
          <div className="notifications-loading-more" role="status">
            알림을 더 불러오는 중입니다.
          </div>
        )}
        <div
          className="notification-list-sentinel"
          ref={sentinelRef}
          aria-hidden="true"
        />
      </section>
    </AppLayout>
  )
}

export default NotificationListPage
