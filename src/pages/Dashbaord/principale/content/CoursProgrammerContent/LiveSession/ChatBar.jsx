import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHand,
  faPaperPlane,
  faComment,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { asIconComponent } from "../../../../../../utils/faIconAdapter";
const Hand = asIconComponent(faHand);
const MessageCircle = asIconComponent(faComment);
const Users = asIconComponent(faUsers);
const ChatBar = ({
  messages = [],
  participants = [],
  onSendMessage,
  onRaiseHand,
  handRaises = [],
}) => {
  const [tab, setTab] = useState("chat");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          {
            key: "chat",
            icon: MessageCircle,
            label: "Chat",
            badge: messages.length,
          },
          {
            key: "participants",
            icon: Users,
            label: `Participants (${participants.length})`,
          },
          {
            key: "hands",
            icon: Hand,
            label: "Mains levées",
            badge: handRaises.length,
          },
        ].map(({ key, icon: Icon, label, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors relative ${tab === key ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
            {badge > 0 && key !== "chat" && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === "chat" && (
          <div className="p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-4">
                Aucun message pour l'instant
              </p>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.userId === currentUserId;
              return (
                <div
                  key={i}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {(msg.userName || "?")[0].toUpperCase()}
                  </div>
                  <div
                    className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}
                  >
                    {!isMe && (
                      <span className="text-[10px] text-gray-400 mb-0.5">
                        {msg.userName}
                      </span>
                    )}
                    <div
                      className={`px-3 py-1.5 rounded-2xl text-xs ${isMe ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {tab === "participants" && (
          <div className="p-3 space-y-1.5">
            {participants.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-4">
                Aucun participant
              </p>
            )}
            {participants.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {(p.userName || "?")[0].toUpperCase()}
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {p.userName}
                </span>
                {p.userId === currentUserId && (
                  <span className="ml-auto text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                    Vous
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "hands" && (
          <div className="p-3 space-y-1.5">
            {handRaises.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-4">
                Aucune main levée
              </p>
            )}
            {handRaises.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20"
              >
                <FontAwesomeIcon
                  icon={faHand}
                  className="w-4 h-4 text-amber-500 flex-shrink-0"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {h.userName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <button
          onClick={onRaiseHand}
          className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors flex-shrink-0"
          title="Lever la main"
        >
          <FontAwesomeIcon icon={faHand} className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Écrire un message..."
          className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default ChatBar;
