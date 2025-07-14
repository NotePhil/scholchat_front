import React, { useState } from "react";
import { X, Reply, Forward, Send, Trash2 } from "lucide-react";

const MessageDetailPanel = ({
  isDark,
  selectedMessage,
  setSelectedMessage,
  formatDate,
  getUserInitials,
  getUserDisplay,
  currentUser,
  onRefreshMessages,
}) => {
  const [showReplyField, setShowReplyField] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState("");

  const handleReplyClick = () => {
    setShowReplyField(true);
    const originalSubject = selectedMessage.objet || "Sans objet";
    setReplySubject(originalSubject.startsWith("Re: ") ? originalSubject : `Re: ${originalSubject}`);
    setReplyContent("");
    setReplyError("");
  };

  const handleDiscardReply = () => {
    setShowReplyField(false);
    setReplyContent("");
    setReplySubject("");
    setReplyError("");
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      setReplyError("Veuillez saisir un message");
      return;
    }
    setIsReplying(true);
    setReplyError("");
    try {
      const accessToken = localStorage.getItem('accessToken');
      const senderId = localStorage.getItem('userId');
      const messageContent = `[${replySubject}] ${replyContent}`;
      const recipient = selectedMessage.expediteur;
      const response = await fetch('http://localhost:8486/scholchat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          contenu: messageContent,
          dateCreation: new Date().toISOString(),
          etat: "envoyé",
          expediteur: {
            type: "utilisateur",
            id: currentUser.id,
            nom: currentUser.nom,
            prenom: currentUser.prenom,
            email: currentUser.email,
            telephone: currentUser.telephone,
            adresse: currentUser.adresse,
            etat: "ACTIVE",
            creationDate: currentUser.creationDate,
            admin: currentUser.admin
          },
          destinataires: [{
            type: "utilisateur",
            id: recipient.id,
            nom: recipient.nom,
            prenom: recipient.prenom,
            email: recipient.email,
            telephone: recipient.telephone,
            adresse: recipient.adresse,
            etat: "ACTIVE",
            creationDate: recipient.creationDate,
            admin: recipient.admin
          }]
        })
      });
      if (!response.ok) {
        throw new Error('Failed to send reply');
      }
      console.log('Reply sent successfully');
      handleDiscardReply();
      if (onRefreshMessages) {
        onRefreshMessages();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      setReplyError("Erreur lors de l'envoi de la réponse");
    } finally {
      setIsReplying(false);
    }
  };

  // Check if the current user is not the sender of the message
  const isNotSender = selectedMessage?.expediteur?.id !== currentUser?.id;

  return (
    <div className={`w-96 border-l flex flex-col ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
      <div className={`p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
<div className={`p-6 flex-1 overflow-y-auto ${isDark ? "text-gray-300" : "text-gray-800"}`}>
  <div className="whitespace-pre-wrap">
    <h4 className={`font-medium text-lg mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
      {selectedMessage?.objet || "Sans objet"}
    </h4>
    <p>{selectedMessage?.contenu}</p>
  </div>
</div>

          <button
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            onClick={() => setSelectedMessage(null)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}>
            {selectedMessage?.expediteur && getUserInitials(selectedMessage.expediteur)}
          </div>
          <div>
            <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
              {selectedMessage?.expediteur && getUserDisplay(selectedMessage.expediteur)}
            </div>
            <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {selectedMessage?.dateCreation && formatDate(selectedMessage.dateCreation)}
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
              <Reply size={16} />
              Répondre
            </button>
          )}
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            <Forward size={16} />
            Transférer
          </button>
        </div>
      </div>
      <div className={`p-6 flex-1 overflow-y-auto ${isDark ? "text-gray-300" : "text-gray-800"}`}>
        <div className="whitespace-pre-wrap">{selectedMessage?.contenu}</div>
      </div>
      {showReplyField && (
        <div className={`border-t p-4 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
          {replyError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {replyError}
            </div>
          )}
          <div className="mb-3">
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
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
          <div className="mb-3">
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
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
          <div className="flex gap-2 justify-end">
            <button
              className={`px-4 py-2 text-sm rounded border ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              onClick={handleDiscardReply}
              disabled={isReplying}
            >
              <Trash2 size={14} className="inline mr-1" />
              Annuler
            </button>
            <button
              className={`px-4 py-2 text-sm rounded text-white flex items-center gap-2 ${isReplying || !replyContent.trim() ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
              onClick={handleSendReply}
              disabled={isReplying || !replyContent.trim()}
            >
              {isReplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Send size={14} />
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
