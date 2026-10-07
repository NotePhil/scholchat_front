import { useEffect, useRef, useCallback } from "react";
import { useNotifications } from "../../../../hooks/useNotifications";
import { useTranslation } from "../../../../hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setActiveTab as setActiveTabAction } from "../../../../store/slices/uiSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBell,
  faCheck,
  faCheckDouble,
  faSpinner,
  faTrashCan,
  faXmark,
  faUserPlus,
  faCalendarDays,
  faCircleCheck,
  faBookOpen,
  faMessage,
} from "@fortawesome/free-solid-svg-icons";
import { asIconComponent } from "../../../../utils/faIconAdapter";
const Bell = asIconComponent(faBell);
const BookOpen = asIconComponent(faBookOpen);
const Calendar = asIconComponent(faCalendarDays);
const CheckCircle = asIconComponent(faCircleCheck);
const MessageSquare = asIconComponent(faMessage);
const RefreshCw = asIconComponent(faArrowsRotate);
const UserPlus = asIconComponent(faUserPlus);
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
  if (diffMin < 60) return isFr ? `Il y a ${diffMin} min` : `${diffMin}m ago`;
  if (diffHour < 24) return isFr ? `Il y a ${diffHour}h` : `${diffHour}h ago`;
  if (diffDay < 7) return isFr ? `Il y a ${diffDay}j` : `${diffDay}d ago`;
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
  buildMessage,
}) => {
  const meta = getNotificationMeta(notification.type);
  const IconComponent = ICON_MAP[meta.icon] || Bell;
  const colors = COLOR_MAP[meta.color] || COLOR_MAP.gray;

  // Clean the message: replace literal "null" with a sensible fallback
  const safeMessage = buildMessage
    ? buildMessage(notification)
    : (notification.message || "")
        .replace(/\bnull\b/gi, "cet exercice")
        .replace(/:\s*$/, "");
  return (
    <div
      className={`flex items-start gap-3 p-3 transition-colors cursor-pointer ${!notification.read ? "bg-blue-50 hover:bg-blue-100/70" : "hover:bg-gray-50"}`}
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
            className={`text-sm leading-snug ${!notification.read ? "font-semibold text-gray-900" : "text-gray-700"}`}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span
              className={`flex-shrink-0 w-2 h-2 mt-1.5 rounded-full ${colors.dot}`}
            />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
          {safeMessage}
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
            <FontAwesomeIcon
              icon={faCheck}
              style={{
                fontSize: 14,
              }}
            />
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
          <FontAwesomeIcon
            icon={faTrashCan}
            style={{
              fontSize: 14,
            }}
          />
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
        <FontAwesomeIcon
          icon={faBell}
          className="text-gray-400"
          style={{
            fontSize: 24,
          }}
        />
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
/**
 * Maps a backend notification (NotificationService.java) to the dashboard tab
 * (+ optional tabData) most relevant for the current role. Tab keys are the
 * Principal.jsx renderContent keys allowed for that role (ROLE_TABS).
 *
 * Types and their relatedEntityType / relatedEntityId:
 *  MESSAGE_SENT MESSAGE(null) · ACCESS_REQUEST CLASS(classeId) ·
 *  ACTIVITY_CREATED EVENT(eventId) or COURSE(classeId, course scheduled) ·
 *  NEW_COURSE COURSE(coursId) · ASSIGNMENT_GIVEN ASSIGNMENT(classeId) ·
 *  EXERCISE_CREATED EXERCISE(exerciseId) · DEVOIR_SOUMIS / CORRECTION_DISPONIBLE
 *  EXERCISE(exerciseProgrammerId) · CLASS_VALIDATED / CLASS_CREATED /
 *  CLASSE_ADHESION_DEMANDE CLASS(classeId) · ETABLISSEMENT_CREATED
 *  ETABLISSEMENT(id) · PROFESSOR_CREATED PROFESSOR(professorId) ·
 *  OFFRE_EXPIRATION_BIENTOT / OFFRE_EXPIREE / SUPPRESSION_IMMINENTE
 *  CLASSE | ETABLISSEMENT(id).
 * Returns null when there is no sensible destination.
 */
const getNotificationTarget = (notification, role) => {
  const type = (notification.type || "").toUpperCase();
  const entity = (notification.relatedEntityType || "").toUpperCase();
  const id = notification.relatedEntityId || null;
  const isLearner = role === "student" || role === "parent";
  const isAdmin = role === "admin";
  const isGest = role === "gestionnaire";
  const isProf = role === "professor" || role === "tutor";
  const classTarget = (subTab = "overview") =>
    isLearner
      ? { tab: "classes" }
      : id
        ? { tab: "manage-class", data: { classId: id, subTab } }
        : { tab: "manage-class" };

  switch (type) {
    case "MESSAGE_SENT":
    case "NEW_MESSAGE":
      return { tab: "messages" };

    case "ACCESS_REQUEST":
    case "DEMANDE_ACCES":
      // Moderators/admins: open the class straight on its access-requests tab.
      // Students/parents: their own sent/approved/rejected confirmation.
      return classTarget("access-requests");

    case "CLASS_VALIDATED":
    case "CLASS_REJECTED":
    case "CLASS_JOIN":
    case "CLASS_CREATED":
      return classTarget("overview");

    case "CLASSE_ADHESION_DEMANDE":
      return isGest ? { tab: "manage-establishment" } : classTarget("overview");

    case "ETABLISSEMENT_CREATED":
      return isGest || isAdmin ? { tab: "manage-establishment" } : null;

    case "ACTIVITY_CREATED":
    case "NEW_ACTIVITY":
    case "EVENT_UPDATED":
      // Course scheduling is sent as ACTIVITY_CREATED with relatedEntityType COURSE.
      if (entity === "COURSE") return { tab: "cours" };
      return { tab: "activities", data: id ? { activityId: id } : null };

    case "NEW_COURSE":
    case "COURSE_SCHEDULED":
    case "COURS_PROGRAMME":
    case "NOUVEAU_COURS":
    case "LIVE_SESSION_STARTED":
    case "SESSION_STARTED":
      // List only: for scheduled courses relatedEntityId is a class id, not a course id.
      return isGest ? null : { tab: "cours" };

    case "ASSIGNMENT_GIVEN":
    case "EXERCISE_ASSIGNED":
    case "NOUVEL_EXERCICE":
    case "EXERCISE_CREATED":
      return isGest ? null : { tab: "manage-exercises" };

    case "DEVOIR_ASSIGNED":
    case "NOUVEAU_DEVOIR":
      return isLearner ? { tab: "devoirs" } : { tab: "manage-exercises" };

    case "DEVOIR_SOUMIS":
      // Professor: a submission waiting for correction. Student: confirmation.
      if (isLearner) return { tab: "devoirs" };
      return isProf || isAdmin ? { tab: "corrections-exercise" } : null;

    case "CORRECTION_DISPONIBLE":
      return isLearner ? { tab: "devoirs" } : { tab: "corrections-exercise" };

    // Profile (role) validation / approval / refusal → profile page, "Mes profils" card.
    case "PROFESSOR_ROLE_VALIDATED":
    case "PROFESSOR_ROLE_REJECTED":
    case "PROFESSOR_ROLE_DOCUMENTS_REQUIRED":
    case "PROFESSOR_VERIFICATION_VALIDATED":
    case "PROFESSOR_VERIFICATION_REJECTED":
    case "PROFESSOR_VERIFICATION_DOCUMENTS_REQUIRED":
    case "STUDENT_ROLE_APPROVED":
    case "STUDENT_ROLE_VALIDATED":
    case "STUDENT_ROLE_REJECTED":
    case "ELEVE_ROLE_APPROUVE":
    case "ROLE_ELEVE_APPROUVE":
    case "ROLE_ELEVE_REFUSE":
    case "ROLE_VALIDATED":
    case "ROLE_APPROVED":
    case "ROLE_REJECTED":
      return { tab: "settings", data: { section: "profils" } };

    case "PROFESSOR_CREATED":
      return isAdmin ? { tab: "professors" } : null;
    case "STUDENT_CREATED":
      return isAdmin ? { tab: "students" } : null;
    case "PARENT_CREATED":
      return isAdmin ? { tab: "parents" } : null;

    case "OFFRE_EXPIRATION_BIENTOT":
    case "OFFRE_EXPIREE":
    case "SUPPRESSION_IMMINENTE":
      if (isAdmin) return { tab: "manage-offers" };
      if (entity === "ETABLISSEMENT") return isGest ? { tab: "manage-establishment" } : null;
      return classTarget("overview");

    default:
      if (entity === "MESSAGE") return { tab: "messages" };
      if (entity === "CLASS" || entity === "CLASSE") return classTarget("overview");
      if (entity === "EVENT") return { tab: "activities" };
      if (entity === "COURSE") return isGest ? null : { tab: "cours" };
      if (entity === "EXERCISE" || entity === "ASSIGNMENT")
        return isGest ? null : { tab: isLearner ? "devoirs" : "manage-exercises" };
      return null;
  }
};

const NotificationIcon = () => {
  const {
    notifications,
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

  // Use filtered unread count (notifications list is already role-filtered by useNotifications)
  const unreadCount = notifications.filter((n) => !n.read).length;
  const handleNotificationClick = useCallback(
    (notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      closePanel();

      // Determine dashboard path robustly
      const dashboardMatch = window.location.pathname.match(
        /\/schoolchat\/Principal\/([\w]+Dashboard)/,
      );
      let dashboard = dashboardMatch ? dashboardMatch[1] : null;
      if (!dashboard) {
        if (userRole === "student") dashboard = "StudentDashboard";
        else if (userRole === "parent") dashboard = "ParentDashboard";
        else if (userRole === "admin") dashboard = "AdminDashboard";
        else if (userRole === "gestionnaire")
          dashboard = "GestionnaireDashboard";
        else dashboard = "ProfessorDashboard";
      }

      const target = getNotificationTarget(notification, userRole);
      if (!target) return; // unknown type: marking read is all we can do
      dispatch(
        setActiveTabAction(
          target.data ? { tab: target.tab, data: target.data } : target.tab,
        ),
      );
      navigate(`/schoolchat/Principal/${dashboard}/${target.tab}`);
    },
    [markAsRead, closePanel, dispatch, navigate, userRole],
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

  // Build a clean display message — guard against backend sending "null" as literal value
  const buildDisplayMessage = (notification) => {
    const raw = notification.message || "";
    const cleaned = raw
      .replace(/\bnull\b/gi, "cet exercice")
      .replace(/:\s*$/, "");
    return cleaned || notification.title || "";
  };
  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={togglePanel}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
        style={{
          minWidth: "44px",
          minHeight: "44px",
        }}
      >
        <FontAwesomeIcon
          icon={faBell}
          className="text-gray-600"
          style={{
            fontSize: 20,
          }}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white">
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
              top: buttonRef.current
                ? buttonRef.current.getBoundingClientRect().bottom + 8
                : undefined,
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
                        isFr ? "Tout marquer comme lu" : "Mark all as read"
                      }
                    >
                      <FontAwesomeIcon
                        icon={faCheckDouble}
                        style={{
                          fontSize: 14,
                        }}
                      />
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
                      <FontAwesomeIcon
                        icon={faTrashCan}
                        style={{
                          fontSize: 14,
                        }}
                      />
                    </button>
                  )}
                  <button
                    onClick={closePanel}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={faXmark}
                      style={{
                        fontSize: 16,
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 mt-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === "all" ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-100"}`}
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
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === "unread" ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-100"}`}
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
              style={{
                maxHeight: "400px",
              }}
            >
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin text-blue-500"
                    style={{
                      fontSize: 24,
                    }}
                  />
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
                        buildMessage={buildDisplayMessage}
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
                  <FontAwesomeIcon
                    icon={faArrowsRotate}
                    style={{
                      fontSize: 12,
                    }}
                  />
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
