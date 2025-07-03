import React from "react";
import { X, Reply, Forward } from "lucide-react";

const MessageDetailPanel = ({ isDark, selectedMessage, setSelectedMessage, formatDate, getUserInitials, getUserDisplay }) => {
  return (
    <div className={`w-96 border-l ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
      <div className={`p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
            {selectedMessage.objet || "Sans objet"}
          </h2>
          <button
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            onClick={() => setSelectedMessage(null)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${
              isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
            }`}
          >
            {getUserInitials(selectedMessage.expediteur)}
          </div>
          <div>
            <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
              {getUserDisplay(selectedMessage.expediteur)}
            </div>
            <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {formatDate(selectedMessage.dateCreation)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Reply size={16} />
            Répondre
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Forward size={16} />
            Transférer
          </button>
        </div>
      </div>
      <div className={`p-6 flex-1 overflow-y-auto ${isDark ? "text-gray-300" : "text-gray-800"}`}>
        <div className="whitespace-pre-wrap">{selectedMessage.contenu}</div>
      </div>
    </div>
  );
};

export default MessageDetailPanel;
