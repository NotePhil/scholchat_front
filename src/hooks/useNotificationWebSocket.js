import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  fetchNotifications,
  pushNotification,
} from "../store/slices/notificationsSlice";

// Backend: WebSocketConfig registers the SockJS endpoint "/ws" under the
// servlet context path (REACT_APP_API_BASE_URL already ends with /scholchat);
// NotificationPublisher sends each NotificationEntity to
// /topic/notifications/{userId}.
const WS_URL = (process.env.REACT_APP_API_BASE_URL || "") + "/ws";

const readToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("authToken");

export const useNotificationWebSocket = (userId) => {
  const dispatch = useDispatch();
  const clientRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    let connectedOnce = false;
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      // Re-read the token on every (re)connect so a re-login/role switch isn't
      // stuck with the token captured at mount.
      beforeConnect: () => {
        const token = readToken();
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },
      onConnect: () => {
        client.subscribe(`/topic/notifications/${userId}`, (frame) => {
          try {
            dispatch(pushNotification(JSON.parse(frame.body)));
          } catch (e) {
            // malformed payload — ignore
          }
        });
        // After a reconnect, catch up on anything pushed while we were offline.
        if (connectedOnce) dispatch(fetchNotifications());
        connectedOnce = true;
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [userId, dispatch]);
};
