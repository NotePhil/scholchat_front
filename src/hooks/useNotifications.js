import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  toggleNotificationPanel,
  setNotificationPanelOpen,
  setNotificationFilter,
} from "../store/slices/notificationsSlice";
import { useAuth } from "./useAuth";
import { useNotificationWebSocket } from "./useNotificationWebSocket";

export const useNotifications = () => {
  const dispatch = useDispatch();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isOpen,
    filter,
  } = useSelector((state) => state.notifications);

  const { isAuthenticated, normalizedUserRole } = useAuth();
  const userId = localStorage.getItem("userId");

  // Fetch notifications once on mount — unreadCount is derived from the list in the reducer,
  // so no separate /count request is needed.
  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchNotifications());
  }, [dispatch, isAuthenticated]);

  // Real-time push via WebSocket
  useNotificationWebSocket(isAuthenticated ? userId : null);

  const refreshNotifications = useCallback(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = useCallback(
    (notificationId) => {
      dispatch(markNotificationAsRead(notificationId));
    },
    [dispatch]
  );

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllNotificationsAsRead());
  }, [dispatch]);

  const handleDelete = useCallback(
    (notificationId) => {
      dispatch(deleteNotification(notificationId));
    },
    [dispatch]
  );

  const handleDeleteAll = useCallback(() => {
    dispatch(deleteAllNotifications());
  }, [dispatch]);

  const handleTogglePanel = useCallback(() => {
    // Refresh on every open: cheap, and covers a WebSocket that failed to
    // connect (the list only shows the spinner when it is still empty).
    if (!isOpen) {
      dispatch(fetchNotifications());
    }
    dispatch(toggleNotificationPanel());
  }, [dispatch, isOpen]);

  const handleClosePanel = useCallback(() => {
    dispatch(setNotificationPanelOpen(false));
  }, [dispatch]);

  const handleSetFilter = useCallback(
    (newFilter) => {
      dispatch(setNotificationFilter(newFilter));
    },
    [dispatch]
  );

  // No client-side role allow-list: the backend only ever returns the
  // logged-in user's own notifications, and the former per-role whitelist hid
  // real types (CORRECTION_DISPONIBLE, DEVOIR_SOUMIS, CLASSE_ADHESION_DEMANDE,
  // OFFRE_*, the student's own ACCESS_REQUEST confirmations…).
  const roleFilteredNotifications = notifications;

  const filteredNotifications =
    filter === "unread"
      ? roleFilteredNotifications.filter((n) => !n.read)
      : roleFilteredNotifications;

  // Get notification icon and color based on type
  const getNotificationMeta = useCallback((type) => {
    switch (type) {
      case "ACCESS_REQUEST":
      case "DEMANDE_ACCES":
        return { icon: "UserPlus", color: "blue", category: "access" };
      case "ACTIVITY_CREATED":
      case "NEW_ACTIVITY":
        return { icon: "Calendar", color: "green", category: "activity" };
      case "CLASS_VALIDATED":
        return { icon: "CheckCircle", color: "emerald", category: "class" };
      case "CLASS_REJECTED":
        return { icon: "RefreshCw", color: "orange", category: "class" };
      case "CLASS_CREATED":
        return { icon: "BookOpen", color: "blue", category: "class" };
      case "CLASS_JOIN":
        return { icon: "UserPlus", color: "emerald", category: "class" };
      case "PROFESSOR_CREATED":
        return { icon: "UserPlus", color: "green", category: "professor" };
      case "STUDENT_CREATED":
        return { icon: "UserPlus", color: "blue", category: "student" };
      case "PARENT_CREATED":
        return { icon: "UserPlus", color: "purple", category: "parent" };
      case "ASSIGNMENT_GIVEN":
        return { icon: "BookOpen", color: "purple", category: "assignment" };
      case "NEW_COURSE":
      case "COURSE_SCHEDULED":
        return { icon: "BookOpen", color: "indigo", category: "course" };
      case "EXERCISE_CREATED":
      case "EXERCISE_ASSIGNED":
        return { icon: "BookOpen", color: "orange", category: "exercise" };
      case "DEVOIR_SOUMIS":
        return { icon: "BookOpen", color: "purple", category: "exercise" };
      case "CORRECTION_DISPONIBLE":
        return { icon: "CheckCircle", color: "emerald", category: "exercise" };
      case "CLASSE_ADHESION_DEMANDE":
        return { icon: "UserPlus", color: "blue", category: "class" };
      case "ETABLISSEMENT_CREATED":
        return { icon: "CheckCircle", color: "green", category: "establishment" };
      case "OFFRE_EXPIRATION_BIENTOT":
      case "OFFRE_EXPIREE":
      case "SUPPRESSION_IMMINENTE":
        return { icon: "RefreshCw", color: "orange", category: "offer" };
      case "MESSAGE_SENT":
        return { icon: "MessageSquare", color: "indigo", category: "message" };
      case "EVENT_UPDATED":
        return { icon: "RefreshCw", color: "orange", category: "event" };
      default:
        return { icon: "Bell", color: "gray", category: "general" };
    }
  }, []);

  // Get role-relevant notification description
  const getRoleContext = useCallback(
    (notification) => {
      const { type } = notification;

      switch (normalizedUserRole) {
        case "admin":
          // Admin sees class validations, access requests, system notifications
          if (type === "ACCESS_REQUEST") return "access_request_admin";
          if (type === "CLASS_VALIDATED") return "class_validated_admin";
          return "general_admin";

        case "professor":
          // Professor sees access requests to their classes, assignments, activities
          if (type === "ACCESS_REQUEST") return "access_request_professor";
          if (type === "ASSIGNMENT_GIVEN") return "assignment_professor";
          if (type === "CLASS_VALIDATED") return "class_validated_professor";
          return "general_professor";

        case "student":
          // Students see assignments, activities, class events
          if (type === "ASSIGNMENT_GIVEN") return "assignment_student";
          if (type === "ACTIVITY_CREATED") return "activity_student";
          if (type === "EVENT_UPDATED") return "event_student";
          return "general_student";

        case "parent":
          // Parents see their children's assignments, activities, class events
          if (type === "ASSIGNMENT_GIVEN") return "assignment_parent";
          if (type === "ACTIVITY_CREATED") return "activity_parent";
          return "general_parent";

        default:
          return "general";
      }
    },
    [normalizedUserRole]
  );

  return {
    notifications: filteredNotifications,
    allNotifications: notifications,
    unreadCount,
    loading,
    error,
    isOpen,
    filter,
    userRole: normalizedUserRole,
    refreshNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
    deleteAll: handleDeleteAll,
    togglePanel: handleTogglePanel,
    closePanel: handleClosePanel,
    setFilter: handleSetFilter,
    getNotificationMeta,
    getRoleContext,
  };
};
