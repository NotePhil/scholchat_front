import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { pushNotification } from "../store/slices/notificationsSlice";

const WS_URL = (process.env.REACT_APP_API_BASE_URL || "") + "/ws";

export const useNotificationWebSocket = (userId) => {
  const dispatch = useDispatch();
  const clientRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken");

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/notifications/${userId}`, (frame) => {
          try {
            dispatch(pushNotification(JSON.parse(frame.body)));
          } catch (e) {}
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [userId, dispatch]);
};
