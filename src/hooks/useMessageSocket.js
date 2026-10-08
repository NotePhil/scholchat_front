import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { messageService } from "../services/MessageService";
import { isParentLimited } from "../utils/parentAccess";

// SockJS endpoint registered under the servlet context path
// (REACT_APP_API_BASE_URL already ends with /scholchat).
const WS_URL = (process.env.REACT_APP_API_BASE_URL || "") + "/ws";

// Same token source as the axios clients (MessageService reads accessToken).
export const readAuthToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("authToken");

// ── Unread-messages store ─────────────────────────────────────────────────
// Shared by the dashboard Sidebar / MobileBottomNav badges and the messaging
// screen so every badge updates live from the same socket events.
let unreadCount = 0;
const unreadSubscribers = new Set();
let unreadInflight = null;
const countedMessageIds = new Set();

export const getUnreadMessageCount = () => unreadCount;

export const setUnreadMessageCount = (value) => {
  const next = Math.max(0, Number(value) || 0);
  if (next === unreadCount) return;
  unreadCount = next;
  unreadSubscribers.forEach((fn) => fn(next));
};

export const refreshUnreadMessageCount = (
  userId = localStorage.getItem("userId"),
) => {
  if (!userId) return Promise.resolve(unreadCount);
  // Limited parent (no child accepted yet): /messages/** answers 403 PARENT_SANS_ENFANT_VALIDE.
  if (isParentLimited()) return Promise.resolve(unreadCount);
  if (unreadInflight) return unreadInflight;
  unreadInflight = messageService
    .compterNonLus(userId)
    .then((count) => {
      countedMessageIds.clear();
      setUnreadMessageCount(typeof count === "number" ? count : Number(count));
      return unreadCount;
    })
    .catch(() => unreadCount)
    .finally(() => {
      unreadInflight = null;
    });
  return unreadInflight;
};

// ── Shared STOMP connection (one per logged-in user) ──────────────────────
// Every consumer of /topic/messages/{userId} shares a single connection; it is
// closed once the last consumer unmounts.
let shared = null;

const handleUnreadEvent = (userId, event) => {
  const msg = event?.message;
  if (!event?.type || !msg) return;
  if (event.type === "NEW_MESSAGE") {
    if (
      msg.lu === false &&
      msg.expediteur?.id !== userId &&
      msg.id &&
      !countedMessageIds.has(msg.id)
    ) {
      countedMessageIds.add(msg.id);
      setUnreadMessageCount(unreadCount + 1);
    }
  } else if (
    event.type === "MESSAGE_DELETED" ||
    event.type === "MESSAGE_RESTORED"
  ) {
    refreshUnreadMessageCount(userId);
  }
};

const ensureConnection = (userId) => {
  if (shared && shared.userId === userId) {
    if (shared.releaseTimer) {
      clearTimeout(shared.releaseTimer);
      shared.releaseTimer = null;
    }
    return shared;
  }
  if (shared) {
    shared.client.deactivate();
    shared = null;
  }
  const state = {
    userId,
    listeners: new Set(),
    reconnectListeners: new Set(),
    connectedOnce: false,
    releaseTimer: null,
    client: null,
  };
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    // Re-read the token on every (re)connect so a refreshed token is used.
    beforeConnect: () => {
      const token = readAuthToken();
      client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },
    onConnect: () => {
      client.subscribe(`/topic/messages/${userId}`, (frame) => {
        let event;
        try {
          event = JSON.parse(frame.body);
        } catch (e) {
          console.warn("[useMessageSocket] Failed to parse frame:", e);
          return;
        }
        handleUnreadEvent(userId, event);
        state.listeners.forEach((listener) => {
          try {
            listener(event);
          } catch (e) {
            console.warn("[useMessageSocket] listener error:", e);
          }
        });
      });
      // Socket dropped and came back: ONE catch-up re-fetch.
      if (state.connectedOnce) {
        refreshUnreadMessageCount(userId);
        state.reconnectListeners.forEach((listener) => listener());
      }
      state.connectedOnce = true;
    },
    onStompError: (frame) => {
      console.warn("[useMessageSocket] STOMP error:", frame.headers?.message);
    },
  });
  state.client = client;
  client.activate();
  shared = state;
  return state;
};

const releaseConnection = (state) => {
  if (state.listeners.size > 0 || state.reconnectListeners.size > 0) return;
  // Deferred so a quick unmount/remount doesn't tear the socket down.
  state.releaseTimer = setTimeout(() => {
    if (
      shared === state &&
      state.listeners.size === 0 &&
      state.reconnectListeners.size === 0
    ) {
      state.client.deactivate();
      shared = null;
    }
  }, 1000);
};

/**
 * Subscribes to /topic/messages/{userId} via STOMP/SockJS.
 *
 * onEvent(event) is called for every push:
 *   { type: "NEW_MESSAGE" | "MESSAGE_DELETED" | "MESSAGE_RESTORED", message }
 * onReconnect() is called once each time the socket comes back after a drop.
 */
export function useMessageSocket(userId, onEvent, onReconnect) {
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onEventRef.current = onEvent;
    onReconnectRef.current = onReconnect;
  });

  useEffect(() => {
    if (!userId) return undefined;
    const state = ensureConnection(userId);
    const listener = (event) => onEventRef.current?.(event);
    const reconnectListener = () => onReconnectRef.current?.();
    state.listeners.add(listener);
    state.reconnectListeners.add(reconnectListener);
    return () => {
      state.listeners.delete(listener);
      state.reconnectListeners.delete(reconnectListener);
      releaseConnection(state);
    };
  }, [userId]);
}

/** Live unread-messages count for badges (no polling: socket-driven). */
export function useUnreadMessageCount() {
  const userId = localStorage.getItem("userId");
  const [count, setCount] = useState(unreadCount);

  useEffect(() => {
    unreadSubscribers.add(setCount);
    setCount(unreadCount);
    return () => {
      unreadSubscribers.delete(setCount);
    };
  }, []);

  useEffect(() => {
    refreshUnreadMessageCount(userId);
  }, [userId]);

  // Keeps the shared connection open while a badge is displayed; unread
  // bookkeeping itself happens in the shared frame handler.
  useMessageSocket(userId, null, null);

  return count;
}
