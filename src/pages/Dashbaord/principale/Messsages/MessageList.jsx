import React from "react";
import { Search, RefreshCw, X, Mail, AlertCircle, Star, StarOff, CheckCircle, Circle, Trash2, Users } from "lucide-react";

const MessageList = ({
  isDark,
  messages,
  selectedMessage,
  setSelectedMessage,
  selectedMessages,
  setSelectedMessages,
  toggleMessageSelection,
  toggleStarMessage,
  handleMarkAsRead,
  handleDeleteMessage,
  handleBulkDelete,
  loading,
  searchTerm,
  setSearchTerm,
  handleRefresh,
  refreshing,
  error,
  setError,
  getUserInitials,
  getUserDisplay,
  formatDate,
}) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className={`px-6 py-3 border-b flex items-center gap-4 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
        <div className="flex items-center gap-2">
          {selectedMessages.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <button
                className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                onClick={() => setSelectedMessages(new Set())}
              >
                <X size={16} />
              </button>
              <span className="text-sm text-gray-600">{selectedMessages.size} sélectionné(s)</span>
              <button
                className={`p-2 rounded-full text-red-600 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                onClick={handleBulkDelete}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="relative flex-1 max-w-2xl">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${isDark ? "text-gray-400" : "text-gray-500"}`} size={18} />
          <input
            type="text"
            placeholder="Rechercher dans les messages"
            className={`w-full pl-12 pr-4 py-3 rounded-full border-2 focus:outline-none focus:border-blue-500 ${
              isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${isDark ? "bg-gray-900" : "bg-white"}`}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="animate-spin text-blue-600" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Mail size={64} className={`mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
            <h3 className={`text-xl font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {searchTerm ? "Aucun résultat trouvé" : "Aucun message"}
            </h3>
            <p className={`${isDark ? "text-gray-500" : "text-gray-500"}`}>
              {searchTerm ? "Essayez avec d'autres mots-clés" : "Votre boîte de réception est vide"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-center px-6 py-4 hover:shadow-md transition-all cursor-pointer group ${
                  selectedMessage?.id === message.id
                    ? isDark
                      ? "bg-blue-900"
                      : "bg-blue-50"
                    : isDark
                    ? "hover:bg-gray-800"
                    : "hover:bg-gray-50"
                } ${!message.read ? "border-l-4 border-blue-500" : ""}`}
                onClick={() => setSelectedMessage(message)}
              >
                <input
                  type="checkbox"
                  className="mr-4 rounded"
                  checked={selectedMessages.has(message.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleMessageSelection(message.id);
                  }}
                />

                <button
                  className={`mr-4 p-1 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStarMessage(message.id, message.starred);
                  }}
                >
                  {message.starred ? (
                    <Star size={16} className="text-yellow-500 fill-current" />
                  ) : (
                    <StarOff size={16} className={isDark ? "text-gray-400" : "text-gray-400"} />
                  )}
                </button>

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                    isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {getUserInitials(message.expediteur)}
                </div>
<div className="flex-1 min-w-0">
  <div className="flex items-center justify-between mb-1">
    <div className="flex items-center gap-2">
      <span className={`font-medium truncate ${!message.read ? "font-bold" : ""} ${isDark ? "text-white" : "text-gray-900"}`}>
        {getUserDisplay(message.expediteur)}
      </span>
      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
        {message.expediteur?.role}
      </span>
    </div>
    <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
      {formatDate(message.dateCreation)}
    </span>
  </div>
  <div className="flex items-center gap-2 mb-1">
    <span className={`font-medium text-sm ${!message.read ? "font-bold" : ""} ${isDark ? "text-gray-200" : "text-gray-800"}`}>
      {message.objet || "Sans objet"}
    </span>
  </div>
  <p className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}>
    {message.contenu}
  </p>
  {message.destinataires && message.destinataires.length > 0 && (
    <div className="flex items-center gap-1 mt-1">
      <Users size={12} className={isDark ? "text-gray-500" : "text-gray-400"} />
      <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
        {message.destinataires.map((dest) => getUserDisplay(dest)).join(", ")}
      </span>
    </div>
  )}
</div>


                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(message.id, message.read);
                    }}
                  >
                    {message.read ? <Circle size={14} /> : <CheckCircle size={14} />}
                  </button>
                  <button
                    className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMessage(message.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;