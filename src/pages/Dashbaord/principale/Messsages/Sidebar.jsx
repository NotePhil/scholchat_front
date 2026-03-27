import React from "react";
import { Send, Inbox, Edit, Star, Circle, Trash2 } from "lucide-react";

const Sidebar = ({
  isDark,
  themeColors,
  setShowCompose,
  filterType,
  setFilterType,
  messageCounts,
  currentUser,
  handleEmptyTrash
}) => {
  const sidebarItems = [
    {
      key: "all",
      label: "Boite de reception",
      icon: Inbox,
      count: messageCounts.all,
      badge: messageCounts.unread > 0 ? messageCounts.unread : null,
    },
    {
      key: "starred",
      label: "Messages suivis",
      icon: Star,
      count: messageCounts.starred
    },
    {
      key: "sent",
      label: "Envoyes",
      icon: Send,
      count: messageCounts.sent,
    },
    {
      key: "unread",
      label: "Non lus",
      icon: Circle,
      count: messageCounts.unread,
      badge: messageCounts.unread > 0 ? messageCounts.unread : null,
    },
    {
      key: "trash",
      label: "Corbeille",
      icon: Trash2,
      count: messageCounts.trash
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
        {sidebarItems.map(({ key, label, icon: Icon, count, badge }) => (
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
            <div className="flex items-center gap-1">
              {badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center">
                  {badge}
                </span>
              )}
              {count !== undefined && count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
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
            </div>
          </button>
        ))}
        {filterType === 'trash' && messageCounts.trash > 0 && (
          <button
            className={`w-full mt-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              isDark
                ? "bg-red-900 text-red-200 hover:bg-red-800"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
            onClick={handleEmptyTrash}
          >
            Vider la corbeille
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
