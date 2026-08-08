import { useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const WS_URL = `${process.env.REACT_APP_API_BASE_URL?.replace("/scholchat", "")}/scholchat/ws`;

/**
 * Subscribes to /topic/messages/{userId} via STOMP/SockJS.
 *
 * Calls onMessage(event) whenever the server pushes a real-time event:
 *   event = { type: "NEW_MESSAGE", message: MessageDto }
 *
 * Returns a disconnect function for manual cleanup.
 */
export function useMessageSocket(userId, onMessage) {
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep the callback ref up-to-date without reconnecting
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!userId) return;
    if (clientRef.current?.active) return; // already connected

    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken");

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/messages/${userId}`, (frame) => {
          try {
            const event = JSON.parse(frame.body);
            onMessageRef.current?.(event);
          } catch (e) {
            console.warn("[useMessageSocket] Failed to parse frame:", e);
          }
        });
      },
      onStompError: (frame) => {
        console.warn("[useMessageSocket] STOMP error:", frame.headers?.message);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [userId]);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect };
}
