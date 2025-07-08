import React from "react";
import { Send, Inbox, Edit, Star, Circle } from "lucide-react";

const Sidebar = ({ 
  isDark, 
  themeColors, 
  setShowCompose, 
  filterType, 
  setFilterType, 
  messageCounts,
  currentUser 
}) => {
  const sidebarItems = [
    { 
      key: "all", 
      label: "Boîte de réception", 
      icon: Inbox, 
      count: messageCounts.all 
    },
    { 
      key: "starred", 
      label: "Messages suivis", 
      icon: Star, 
      count: messageCounts.starred 
    },
    { 
      key: "sent", 
      label: "Envoyés", 
      icon: Send, 
      count: messageCounts.sent 
    },
    { 
      key: "unread", 
      label: "Non lus", 
      icon: Circle, 
      count: messageCounts.unread 
    },
  ];

  return (
    <div className={`w-64 border-r ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
      <div className="p-4">
        <button
          className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
          style={{ backgroundColor: themeColors.primary, color: "white" }}
          onClick={() => setShowCompose(true)}
        >
          <Edit size={20} />
          Nouveau message
        </button>
      </div>

      <div className="px-2">
        {sidebarItems.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm mb-1 transition-colors ${
              filterType === key
                ? isDark
                  ? "bg-blue-900 text-blue-200"
                  : "bg-blue-50 text-blue-700 border-r-3 border-blue-600"
                : isDark
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setFilterType(key)}
          >
            <div className="flex items-center gap-3">
              <Icon size={18} />
              {label}
            </div>
            {count > 0 && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  filterType === key
                    ? "bg-blue-600 text-white"
                    : isDark
                    ? "bg-gray-600 text-gray-300"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;