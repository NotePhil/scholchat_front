import React, { useState, useEffect } from "react";
import { Bell, X, ChevronRight } from "lucide-react";

const NotificationIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        // Fetch access requests for classes
        const response = await fetch(
          "http://localhost:8486/scholchat/acceder/classes/utilisateurs?classeIds=550e8400-e29b-41d4-a716-446655440400"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await response.json();

        // Transform API data to notification format
        const apiNotifications = data.map((request) => {
          // Extract user full name (nom + prenom)
          const userFullName = request.prenom
            ? `${request.prenom} ${request.nom}`
            : request.nom || "Un utilisateur";

          return {
            id: request.id,
            type: "ACCESS_REQUEST",
            message: `${userFullName} a fait une demande d'accès pour la classe ${
              request.className || "une classe"
            }`,
            classId: request.classeId,
            className: request.className,
            userName: userFullName,
            timestamp: new Date(request.creationDate || request.timestamp),
            read: false,
            status: request.status || "PENDING",
          };
        });

        setNotifications(apiNotifications);
        setUnreadCount(apiNotifications.filter((n) => !n.read).length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 300000); // Poll every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount((prev) => prev - 1);
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.type === "ACCESS_REQUEST") {
      console.log("Navigate to class:", notification.classId);
      // Here you would typically navigate to the class or show a modal
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 relative"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-medium text-gray-800">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
                disabled={unreadCount === 0}
              >
                Tout marquer comme lu
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Chargement des notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucune notification
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`border-b border-gray-100 last:border-0 ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-left p-4 hover:bg-gray-50 flex items-start"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • {notification.timestamp.toLocaleDateString()}
                        </p>
                        {notification.type === "ACCESS_REQUEST" && (
                          <div className="mt-2 flex items-center text-xs text-blue-600">
                            <span>Voir les détails</span>
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </div>
                        )}
                      </div>
                      {!notification.read && (
                        <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;
