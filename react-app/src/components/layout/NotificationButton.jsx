import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { getUnreadNotificationCount } from "../../api/notificationApi.js";
import {
  NOTIFICATION_RECEIVED_EVENT,
  NOTIFICATION_UNREAD_CHANGED_EVENT,
} from "../../features/notifications/notificationEvents.js";

function NotificationButton() {
  const [unreadCount, setUnreadCount] = useState(0);
  const requestPromiseRef = useRef(null); // 요청 promise 를 저장하는 Ref
  const isMountedRef = useRef(false); // 알림 컴포넌트가 마운트 상태인지 추적하는 Ref

  const refreshUnreadCount = useCallback(() => {
    if (requestPromiseRef.current) {
      return requestPromiseRef.current;
    }

    const requestPromise = getUnreadNotificationCount()
      .then((count) => {
        if (isMountedRef.current) {
          // 컴포넌트가 마운트 상태일 때만 읽지않은 알림 개수 업데이트
          setUnreadCount(Number.isFinite(Number(count)) ? Number(count) : 0);
        }
      })
      .catch((error) => {
        console.error("미읽음 알림 개수를 불러오지 못했습니다.", error);
      })
      .finally(() => {
        requestPromiseRef.current = null;
      });

    requestPromiseRef.current = requestPromise;
    return requestPromise;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    refreshUnreadCount();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshUnreadCount();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener(NOTIFICATION_RECEIVED_EVENT, refreshUnreadCount);

    window.addEventListener(
      NOTIFICATION_UNREAD_CHANGED_EVENT,
      refreshUnreadCount,
    );

    // 컴포넌트 언마운트 시 정리(cleanup) 함수 반환
    return () => {
      isMountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        NOTIFICATION_RECEIVED_EVENT,
        refreshUnreadCount,
      );

      window.removeEventListener(
        NOTIFICATION_UNREAD_CHANGED_EVENT,
        refreshUnreadCount,
      );
    };
  }, [refreshUnreadCount]);

  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);
  const accessibleLabel =
    unreadCount > 0
      ? `알림 목록으로 이동, 읽지 않은 알림 ${unreadCount}개`
      : "알림 목록으로 이동";

  return (
    <Link
      className="notification-button"
      to="/notifications"
      aria-label={accessibleLabel}
    >
      <span className="notification-bell" aria-hidden="true">
        <span className="notification-bell-body" />
        <span className="notification-bell-clapper" />
      </span>
      {unreadCount > 0 && (
        <span className="notification-badge" aria-hidden="true">
          {badgeText}
        </span>
      )}
    </Link>
  );
}

export default NotificationButton;
