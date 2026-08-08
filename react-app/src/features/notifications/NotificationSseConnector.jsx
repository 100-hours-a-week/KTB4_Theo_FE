import { useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { API_BASE_URL, reissueAccessToken } from "../../api/client.js";
import useAuth from "../auth/useAuth.js";
import { notifyNotificationReceived } from "./notificationEvents.js";

const SSE_CLIENT_ID_STORAGE_KEY = "notification-sse-client-id";
// 고유한 클라이언트 ID를 생성하는 함수
function createSseClientId() {
  if (typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);

  // RFC 4122 version 4 UUID 형식으로 설정
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

// SSE 연결을 위한 고유한 클라이언트 ID를 생성하거나 가져오는 함수
function getOrCreateSseClientId() {
  const storedClientId = window.sessionStorage.getItem(
    SSE_CLIENT_ID_STORAGE_KEY,
  );

  if (storedClientId) {
    return storedClientId;
  }

  const newClientId = createSseClientId();

  window.sessionStorage.setItem(SSE_CLIENT_ID_STORAGE_KEY, newClientId);

  return newClientId;
}

function NotificationSseConnector() {
  const { accessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return undefined;
    }

    // SSE 연결을 위한 고유한 클라이언트 ID
    const clientId = getOrCreateSseClientId();

    // SSE 연결을 관리하기 위한 컨트롤러
    const controller = new AbortController();

    // SSE 정상 종료 후 실행할 재연결 타이머 ID
    let reconnectTimerId = null;

    async function connect() {
      try {
        await fetchEventSource(
          // SSE 연결을 위한 API 엔드포인트
          `${API_BASE_URL}/notifications/subscribe`,
          {
            method: "GET",
            headers: {
              Accept: "text/event-stream",
              Authorization: `Bearer ${accessToken}`,
              "X-SSE-Client-Id": clientId,
            },
            // AbortController를 사용하여 연결을 취소할 수 있도록 설정
            signal: controller.signal,

            // 최초 연결
            onopen(response) {
              const contentType = response.headers.get("content-type");

              if (!response.ok) {
                const error = new Error(`SSE 연결 실패: ${response.status}`);
                error.status = response.status;

                throw error;
              }

              if (!contentType?.includes("text/event-stream")) {
                throw new Error("SSE 응답 형식이 아닙니다.");
              }
            },

            // SSE 이벤트 수신
            onmessage(event) {
              if (event.event === "connect") {
                console.log("SSE 연결 완료:", {
                  clientId,
                  data: event.data,
                });
                return;
              }

              if (event.event === "notification") {
                try {
                  const notification = JSON.parse(event.data);

                  console.log("새로운 알림 수신:", notification);

                  notifyNotificationReceived(notification);
                } catch (error) {
                  console.error(
                    "SSE 알림 데이터를 처리하지 못했습니다.",
                    error,
                  );
                }
              }
            },

            // SSE 연결 종료
            onclose() {
              console.log("SSE 연결이 종료되었습니다.");

              if (controller.signal.aborted) {
                return;
              }

              reconnectTimerId = window.setTimeout(() => {
                reconnectTimerId = null;
                connect();
              }, 3_000);
            },

            // 인증 오류는 외부에서 토큰을 재발급하고,
            // 그 외 일시적인 오류는 fetchEventSource의 기본 재시도에 맡김
            onerror(error) {
              if (error?.status === 401) {
                throw error;
              }

              return undefined;
            },
          },
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (error?.status === 401) {
          try {
            await reissueAccessToken();
          } catch (reissueError) {
            if (!controller.signal.aborted) {
              console.error("SSE 인증 갱신 실패:", reissueError);
            }
          }

          return;
        }

        console.error("SSE 구독 실패:", error);
      }
    }

    connect();

    return () => {
      controller.abort();

      if (reconnectTimerId !== null) {
        window.clearTimeout(reconnectTimerId);
      }
    };
  }, [accessToken, isAuthenticated]);
  // SSE 연결을 관리하는 컴포넌트이므로 UI를 렌더링하지 않음
  return null;
}

export default NotificationSseConnector;
