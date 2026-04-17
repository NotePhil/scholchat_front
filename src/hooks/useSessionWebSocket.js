import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// WS endpoint: same host as REST but at /ws (SockJS)
// e.g. REACT_APP_API_BASE_URL = http://localhost:8486/scholchat
//      WS_URL                 = http://localhost:8486/scholchat/ws
const WS_URL = (process.env.REACT_APP_API_BASE_URL || "") + "/ws";

export const useSessionWebSocket = (coursId, onEvent) => {
  const clientRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!coursId) return;

    const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        // Subscribe to session events (SESSION_STARTED, SESSION_ENDED, CHAPTER_CHANGED,
        // PARTICIPANT_JOINED, PARTICIPANT_LEFT, HAND_RAISED, PONG)
        client.subscribe(`/topic/cours/${coursId}/session`, (msg) => {
          try { onEventRef.current(JSON.parse(msg.body)); } catch (e) {}
        });
        // Subscribe to chat events (CHAT_MESSAGE)
        client.subscribe(`/topic/cours/${coursId}/chat`, (msg) => {
          try { onEventRef.current(JSON.parse(msg.body)); } catch (e) {}
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [coursId]);

  // Send to /app/cours/{coursId}/chat  body: { message }
  // Server resolves userName from JWT
  const sendChat = useCallback((message) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/cours/${coursId}/chat`,
        body: JSON.stringify({ message }),
      });
    }
  }, [coursId]);

  // Send to /app/cours/{coursId}/hand-raise  no body needed
  const raiseHand = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/cours/${coursId}/hand-raise`,
        body: "{}",
      });
    }
  }, [coursId]);

  // Send to /app/cours/{coursId}/session/ping
  const ping = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/cours/${coursId}/session/ping`,
        body: "{}",
      });
    }
  }, [coursId]);

  return { sendChat, raiseHand, ping };
};
