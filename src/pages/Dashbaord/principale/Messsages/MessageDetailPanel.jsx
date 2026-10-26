import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faForward,
  faPaperPlane,
  faReply,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { parseMessageDate, toUtilisateurPayload } from "./messageUtils";
import { messageService } from "../../../../services/MessageService";
import { useMessageAttachments, MAX_ATTACHMENTS } from "./messageMedia";
import {
  AttachButton,
  AttachmentPreviewList,
  MessageAttachments,
} from "./MessageAttachments";
const QUOTE_SEPARATOR = "--- Message original ---";
const MessageContent = ({ contenu, isDark }) => {
  if (!contenu) return null;
  const sepIndex = contenu.indexOf(QUOTE_SEPARATOR);
  if (sepIndex === -1)
    return <div className="whitespace-pre-wrap">{contenu}</div>;
  const newPart = contenu.slice(0, sepIndex).trim();
  const quotedPart = contenu.slice(sepIndex).trim();
  return (
    <div>
      <div className="whitespace-pre-wrap">{newPart}</div>
      <div
        className={`mt-3 pl-3 border-l-4 text-sm whitespace-pre-wrap ${isDark ? "border-gray-500 text-gray-400" : "border-gray-300 text-gray-500"}`}
      >
        {quotedPart}
      </div>
    </div>
  );
};
const MessageDetailPanel = ({
  isDark,
  selectedMessage,
  setSelectedMessage,
  formatDate,
  getUserInitials,
  getUserDisplay,
  currentUser,
  onMessageSent,
  handleMarkAsRead,
  onDeleteMessage,
  onDeleteConversation,
}) => {
  const attachments = useMessageAttachments();
  const [showReplyField, setShowReplyField] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState("");

  // Auto-mark every unread RECEIVED message of the open conversation as read
  // (also covers replies that arrive while it is open).
  useEffect(() => {
    if (!selectedMessage) return;
    const myId = currentUser?.id || localStorage.getItem("userId");
    (selectedMessage.thread || [selectedMessage])
      .filter((m) => !m.read && m.expediteur?.id !== myId)
      .forEach((m) => handleMarkAsRead(m.id, true));
  }, [selectedMessage?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleReplyClick = () => {
    setShowReplyField(true);
    const originalSubject = selectedMessage.objet || "Sans objet";
    setReplySubject(
      originalSubject.startsWith("Re: ")
        ? originalSubject
        : `Re: ${originalSubject}`,
    );
    setReplyContent("");
    setReplyError("");
  };
  const buildReplyBody = () => {
    const sender = selectedMessage?.expediteur;
    const senderName = sender
      ? `${sender.prenom || ""} ${sender.nom || ""}`.trim()
      : "Inconnu";
    const parsed = parseMessageDate(selectedMessage?.dateCreation);
    const date = parsed ? parsed.toLocaleString("fr-FR") : "";
    const originalBody = selectedMessage?.contenu || "";
    if (!replyContent.trim()) return "";
    return `${replyContent}\n\n--- Message original ---\nDe : ${senderName}\nDate : ${date}\n\n${originalBody}`;
  };
  const handleDiscardReply = () => {
    attachments.clear();
    setShowReplyField(false);
    setReplyContent("");
    setReplySubject("");
    setReplyError("");
  };
  const handleSendReply = async () => {
    if (!replyContent.trim() && attachments.medias.length === 0) {
      setReplyError("Veuillez saisir un message ou joindre un fichier");
      return;
    }
    setIsReplying(true);
    setReplyError("");
    try {
      const sent = await messageService.sendMessage({
        objet: replySubject?.trim() || undefined,
        contenu: buildReplyBody(),
        // A broadcast you sent has no single partner: reply to all its recipients.
        destinataires: (selectedMessage?.isBroadcast
          ? selectedMessage.destinataires || []
          : [replyTarget]
        ).map(toUtilisateurPayload),
        ...(attachments.medias.length > 0 && { medias: attachments.medias }),
      });
      handleDiscardReply();
      // The WebSocket NEW_MESSAGE push also delivers it (upsert dedupes by id).
      onMessageSent?.(sent);
    } catch (error) {
      console.error("Error sending reply:", error);
      setReplyError(error?.message || "Erreur lors de l'envoi de la réponse");
    } finally {
      setIsReplying(false);
    }
  };

  // The conversation partner (other person) — falls back to the latest
  // message's sender for broadcasts that have no single other party.
  const replyTarget = selectedMessage?.partner || selectedMessage?.expediteur;
  const canSendReply =
    !isReplying &&
    !attachments.uploading &&
    !attachments.hasErrors &&
    (!!replyContent.trim() || attachments.medias.length > 0);
  const isNotSender =
    !!selectedMessage?.isBroadcast ||
    (!!replyTarget?.id &&
      replyTarget.id !== (currentUser?.id || localStorage.getItem("userId")));
  return (
    <div
      className={`flex flex-col h-full ${isDark ? "bg-gray-800" : "bg-white"}`}
    >
      <div
        className={`p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            onClick={() => setSelectedMessage(null)}
          >
            <FontAwesomeIcon
              icon={faXmark}
              style={{
                fontSize: 16,
              }}
            />
          </button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
          >
            {replyTarget && getUserInitials(replyTarget)}
          </div>
          <div>
            <div
              className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {replyTarget && getUserDisplay(replyTarget)}
            </div>
            <div
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {selectedMessage?.dateCreation &&
                formatDate(selectedMessage.dateCreation)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isNotSender && (
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              onClick={handleReplyClick}
              disabled={showReplyField}
            >
              <FontAwesomeIcon
                icon={faReply}
                style={{
                  fontSize: 16,
                }}
              />
              Répondre
            </button>
          )}
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            <FontAwesomeIcon
              icon={faForward}
              style={{
                fontSize: 16,
              }}
            />
            Transférer
          </button>
          {onDeleteConversation && (
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-red-600 ${isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-red-50"}`}
              onClick={() => onDeleteConversation(selectedMessage)}
              title="Supprimer la conversation"
            >
              <FontAwesomeIcon icon={faTrashCan} style={{ fontSize: 16 }} />
            </button>
          )}
        </div>
      </div>
      <div
        className={`p-6 flex-1 overflow-y-auto ${isDark ? "text-gray-300" : "text-gray-800"}`}
      >
        <div className="mb-4">
          <div
            className={`text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Objet:
          </div>
          <div
            className={`font-medium text-lg mb-4 ${isDark ? "text-gray-200" : "text-gray-800"}`}
          >
            {selectedMessage?.objet || "Sans objet"}
          </div>
        </div>

        {selectedMessage?.thread && selectedMessage.thread.length > 1 ? (
          <div className="space-y-4">
            {selectedMessage.thread.map((msg) => (
              <div
                key={msg.id}
                className={`border rounded-lg p-4 ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${isDark ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-700"}`}
                  >
                    {getUserInitials(msg.expediteur)}
                  </div>
                  <div>
                    <div
                      className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {getUserDisplay(msg.expediteur)}
                    </div>
                    <div
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {formatDate(msg.dateCreation)}
                    </div>
                  </div>
                  {onDeleteMessage && !String(msg.id).startsWith("temp-") && (
                    <button
                      className={`ml-auto p-2 rounded-full opacity-60 hover:opacity-100 hover:text-red-600 ${isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
                      onClick={() => onDeleteMessage(msg)}
                      title="Supprimer ce message"
                    >
                      <FontAwesomeIcon icon={faTrashCan} style={{ fontSize: 13 }} />
                    </button>
                  )}
                </div>
                <MessageContent contenu={msg.contenu} isDark={isDark} />
                <MessageAttachments
                  medias={msg.medias}
                  isDark={isDark}
                  className="mt-3"
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            <MessageContent contenu={selectedMessage?.contenu} isDark={isDark} />
            <MessageAttachments
              medias={selectedMessage?.medias}
              isDark={isDark}
              className="mt-3"
            />
          </>
        )}
      </div>
      {showReplyField && (
        <div
          className={`border-t p-4 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
        >
          {replyError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {replyError}
            </div>
          )}
          <div className="mb-3">
            <label
              className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              Objet
            </label>
            <input
              type="text"
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"}`}
              placeholder="Objet de la réponse"
            />
          </div>
          {/* Quoted original message */}
          <div
            className={`mb-3 px-3 py-2 rounded border-l-4 text-xs ${isDark ? "border-blue-500 bg-gray-700 text-gray-400" : "border-blue-400 bg-gray-50 text-gray-500"}`}
          >
            <div className="font-semibold mb-1">
              {selectedMessage?.expediteur
                ? `${selectedMessage.expediteur.prenom || ""} ${selectedMessage.expediteur.nom || ""}`.trim()
                : "Inconnu"}
              {selectedMessage?.dateCreation && (
                <span className="font-normal ml-2">
                  {new Date(selectedMessage.dateCreation).toLocaleString(
                    "fr-FR",
                  )}
                </span>
              )}
            </div>
            <div className="whitespace-pre-wrap line-clamp-4 opacity-75">
              {selectedMessage?.contenu}
            </div>
          </div>

          <div className="mb-3">
            <label
              className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              Réponse
            </label>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"}`}
              placeholder="Tapez votre réponse..."
            />
          </div>
          <div className="mb-3 space-y-2">
            <AttachButton
              onFiles={(files) => {
                if (attachments.addFiles(files) > 0) {
                  setReplyError(
                    `Maximum ${MAX_ATTACHMENTS} pièces jointes par message.`,
                  );
                }
              }}
              disabled={
                isReplying || attachments.items.length >= MAX_ATTACHMENTS
              }
              isDark={isDark}
              label="Joindre"
            />
            <AttachmentPreviewList
              items={attachments.items}
              onRemove={attachments.removeItem}
              onRetry={attachments.retryItem}
              isDark={isDark}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className={`px-4 py-2 text-sm rounded border ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              onClick={handleDiscardReply}
              disabled={isReplying}
            >
              <FontAwesomeIcon
                icon={faTrashCan}
                className="inline mr-1"
                style={{
                  fontSize: 14,
                }}
              />
              Annuler
            </button>
            <button
              className={`px-4 py-2 text-sm rounded text-white flex items-center gap-2 ${!canSendReply ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
              onClick={handleSendReply}
              disabled={!canSendReply}
            >
              {isReplying || attachments.uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={faPaperPlane}
                    style={{
                      fontSize: 14,
                    }}
                  />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default MessageDetailPanel;
