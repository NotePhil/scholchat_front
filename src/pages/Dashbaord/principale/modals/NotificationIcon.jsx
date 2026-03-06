import { useEffect, useRef, useCallback } from "react";
import {
  Bell,
  X,
  ChevronRight,
  Check,
  CheckCheck,
  Trash2,
  UserPlus,
  Calendar,
  CheckCircle,
  BookOpen,
  MessageSquare,
  RefreshCw,
  Filter,
  Loader2,
} from "lucide-react";
import { useNotifications } from "../../../../hooks/useNotifications";
import { useTranslation } from "../../../../hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setActiveTab as setActiveTabAction } from "../../../../store/slices/uiSlice";

const ICON_MAP = {
  UserPlus,
  Calendar,
  CheckCircle,
  BookOpen,
  MessageSquare,
  RefreshCw,
  Bell,
};

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-400",
    dot: "bg-blue-500",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-400",
    dot: "bg-green-500",
  },
  emerald: {
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    darkBg: "dark:bg-emerald-900/30",
    darkText: "dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    darkBg: "dark:bg-purple-900/30",
    darkText: "dark:text-purple-400",
    dot: "bg-purple-500",
  },
  indigo: {
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    darkBg: "dark:bg-indigo-900/30",
    darkText: "dark:text-indigo-400",
    dot: "bg-indigo-500",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    darkBg: "dark:bg-orange-900/30",
    darkText: "dark:text-orange-400",
    dot: "bg-orange-500",
  },
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    darkBg: "dark:bg-gray-900/30",
    darkText: "dark:text-gray-400",
    dot: "bg-gray-500",
  },
};

const formatTimeAgo = (dateStr, language) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const isFr = language === "fr";

  if (diffSec < 60) return isFr ? "A l'instant" : "Just now";
  if (diffMin < 60)
    return isFr ? `Il y a ${diffMin} min` : `${diffMin}m ago`;
  if (diffHour < 24)
    return isFr ? `Il y a ${diffHour}h` : `${diffHour}h ago`;
  if (diffDay < 7)
    return isFr ? `Il y a ${diffDay}j` : `${diffDay}d ago`;

  return date.toLocaleDateString(isFr ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });
};

const NotificationItem = ({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
  getNotificationMeta,
  language,
}) => {
  const meta = getNotificationMeta(notification.type);
  const IconComponent = ICON_MAP[meta.icon] || Bell;
  const colors = COLOR_MAP[meta.color] || COLOR_MAP.gray;

  return (
    <div
      className={`flex items-start gap-3 p-3 transition-colors cursor-pointer ${
        !notification.read
          ? "bg-blue-50 hover:bg-blue-100/70"
          : "hover:bg-gray-50"
      }`}
      onClick={() => onClick(notification)}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${colors.bg} ${colors.text}`}
      >
        <IconComponent size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${
              !notification.read ? "font-semibold text-gray-900" : "text-gray-700"
            }`}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className={`flex-shrink-0 w-2 h-2 mt-1.5 rounded-full ${colors.dot}`} />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-gray-400">
            {formatTimeAgo(notification.createdAt, language)}
          </span>
          {notification.actorName && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                {notification.actorName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            title={language === "fr" ? "Marquer comme lu" : "Mark as read"}
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
          title={language === "fr" ? "Supprimer" : "Delete"}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ filter, language }) => {
  const isFr = language === "fr";
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Bell size={24} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-600">
        {filter === "unread"
          ? isFr
            ? "Aucune notification non lue"
            : "No unread notifications"
          : isFr
          ? "Aucune notification"
          : "No notifications"}
      </p>
      <p className="text-xs text-gray-400 mt-1 text-center">
        {isFr
          ? "Vos notifications apparaîtront ici"
          : "Your notifications will appear here"}
      </p>
    </div>
  );
};

const NotificationIcon = () => {
  const {
    notifications,
    unreadCount,
    loading,
    isOpen,
    filter,
    userRole,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification: handleDeleteNotification,
    deleteAll,
    togglePanel,
    closePanel,
    setFilter,
    getNotificationMeta,
  } = useNotifications();

  const { language } = useTranslation();
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const isFr = language === "fr";

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        closePanel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, closePanel]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        closePanel();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closePanel]);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleNotificationClick = useCallback(
    (notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }

      // Navigation based on notification type and related entity
      const { type, relatedEntityId } = notification;

      // Close panel after click
      closePanel();

      switch (type) {
        case "ACCESS_REQUEST":
        case "DEMANDE_ACCES":
          dispatch(setActiveTabAction({ 
            tab: "manage-class", 
            data: { classId: relatedEntityId, subTab: "access-requests" } 
          }));
          break;
        case "CLASS_VALIDATED":
        case "CLASS_REJECTED":
        case "CLASS_JOIN":
          dispatch(setActiveTabAction({ 
            tab: "manage-class", 
            data: { classId: relatedEntityId, subTab: "overview" } 
          }));
          break;
        case "ACTIVITY_CREATED":
        case "ASSIGNMENT_GIVEN":
        case "NEW_ACTIVITY":
          dispatch(setActiveTabAction({ 
            tab: "activities", 
            data: { activityId: relatedEntityId } 
          }));
          break;
        case "COURSE_SCHEDULED":
        case "NEW_COURSE":
          dispatch(setActiveTabAction({ 
            tab: "cours", 
            data: { courseId: relatedEntityId } 
          }));
          break;
        case "MESSAGE_SENT":
          dispatch(setActiveTabAction("messages"));
          break;
        case "PROFESSOR_CREATED":
          dispatch(setActiveTabAction("professors"));
          break;
        case "STUDENT_CREATED":
          dispatch(setActiveTabAction("students"));
          break;
        case "PARENT_CREATED":
          dispatch(setActiveTabAction("parents"));
          break;
        default:
          dispatch(setActiveTabAction("dashboard"));
      }
    },
    [markAsRead, closePanel, dispatch]
  );

  // Role-based header subtitle
  const getRoleSubtitle = () => {
    switch (userRole) {
      case "admin":
        return isFr ? "Notifications administrateur" : "Admin notifications";
      case "professor":
        return isFr ? "Notifications professeur" : "Professor notifications";
      case "student":
        return isFr ? "Mes notifications" : "My notifications";
      case "parent":
        return isFr ? "Notifications parent" : "Parent notifications";
      default:
        return isFr ? "Notifications" : "Notifications";
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={togglePanel}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
        style={{ minWidth: "44px", minHeight: "44px" }}
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/10 md:hidden"
            onClick={closePanel}
          />

          <div
            ref={panelRef}
            className="fixed md:absolute right-3 md:right-0 mt-2 w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
            style={{
              maxHeight: "calc(100vh - 120px)",
              top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : undefined,
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {getRoleSubtitle()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title={
                        isFr
                          ? "Tout marquer comme lu"
                          : "Mark all as read"
                      }
                    >
                      <CheckCheck size={14} />
                      <span className="hidden sm:inline">
                        {isFr ? "Tout lire" : "Read all"}
                      </span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={deleteAll}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title={isFr ? "Tout supprimer" : "Delete all"}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={closePanel}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 mt-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === "all"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {isFr ? "Toutes" : "All"}
                  {notifications.length > 0 && (
                    <span className="ml-1 text-[10px]">
                      ({notifications.length})
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === "unread"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {isFr ? "Non lues" : "Unread"}
                  {unreadCount > 0 && (
                    <span className="ml-1 text-[10px]">({unreadCount})</span>
                  )}
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "400px" }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">
                    {isFr ? "Chargement..." : "Loading..."}
                  </span>
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState filter={filter} language={language} />
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="group">
                      <NotificationItem
                        notification={notification}
                        onClick={handleNotificationClick}
                        onMarkAsRead={markAsRead}
                        onDelete={handleDeleteNotification}
                        getNotificationMeta={getNotificationMeta}
                        language={language}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={refreshNotifications}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <RefreshCw size={12} />
                  {isFr ? "Actualiser" : "Refresh"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationIcon;
