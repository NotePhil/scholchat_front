import React, { useState, useEffect } from "react";
import { X, Send, RefreshCw, Check, Users } from "lucide-react";

const ComposeModal = ({
  isDark,
  themeColors,
  newMessage,
  setNewMessage,
  loading,
  recipientSearch,
  setRecipientSearch,
  filteredUsers,
  addRecipient,
  removeRecipient,
  handleEmailInput,
  setShowCompose,
  selectedClasses,
  setSelectedClasses,
  isGeneralMessage,
  setIsGeneralMessage,
  currentUser,
  ccRecipients,
  setCcRecipients,
  setShowRecipientSelector
}) => {
  const [classesList, setClassesList] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');

        if (!userId) {
          throw new Error('User ID not found in localStorage');
        }

        const response = await fetch(`http://localhost:8486/scholchat/acceder/utilisateurs/${userId}/classes`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch classes');
        }

        const data = await response.json();
        setClassesList(data);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, []);

  const toggleClassSelection = (classeId) => {
    if (selectedClasses.includes(classeId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classeId));
    } else {
      setSelectedClasses([...selectedClasses, classeId]);
    }
  };

  const toggleGeneralMessage = () => {
    setIsGeneralMessage(!isGeneralMessage);
    if (!isGeneralMessage) {
      setNewMessage(prev => ({
        ...prev,
        destinataires: [],
      }));
    }
  };

  const handleAddCcRecipients = () => {
    setShowRecipientSelector(true);
  };

  const handleSendMessage = async () => {
    if (isGeneralMessage) {
      const messageContent = `[${newMessage.objet}] ${newMessage.contenu}`;
      const accessToken = localStorage.getItem('accessToken');
      const senderId = localStorage.getItem('userId');

      for (const classId of selectedClasses) {
        try {
          const response = await fetch('http://localhost:8486/scholchat/messages/group', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              classId: classId,
              content: messageContent,
              senderId: senderId
            })
          });

          if (!response.ok) {
            throw new Error('Failed to send message');
          }

          console.log('Message sent successfully');
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    } else {
      // Handle the case for non-general messages
      // Your existing code for sending messages to individual recipients
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Nouveau message</h3>
          <button
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            onClick={() => setShowCompose(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Classes Selection */}
          {currentUser.role === "TEACHER" && classesList.length > 0 && (
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Classes</label>
              <div className={`border rounded-lg p-3 ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"}`}>
                <div className="flex flex-wrap gap-2 mb-3">
                  {classesList.map((classe) => (
                    <button
                      key={classe.id}
                      onClick={() => toggleClassSelection(classe.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${
                        selectedClasses.includes(classe.id)
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : isDark
                          ? "border-gray-500 text-gray-300 hover:bg-gray-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {selectedClasses.includes(classe.id) && <Check size={14} />}
                      {classe.nom} ({classe.niveau})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="generalMessage"
                    checked={isGeneralMessage}
                    onChange={toggleGeneralMessage}
                    disabled={selectedClasses.length === 0}
                    className="rounded"
                  />
                  <label
                    htmlFor="generalMessage"
                    className={`text-sm ${selectedClasses.length === 0 ? 'opacity-50' : ''} ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Message général (envoyé à tous les membres de la classe)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* CC Recipients */}
          {currentUser.role === "TEACHER" && selectedClasses.length > 0 && (
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                CC (Autres professeurs des classes sélectionnées)
              </label>
              <div className={`border rounded-lg p-3 ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"}`}>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ccRecipients.map((user, index) => (
                    <span key={index} className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {user.nom}
                      <button onClick={() => {
                        setCcRecipients(ccRecipients.filter((_, i) => i !== index));
                      }}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  className={`w-full px-3 py-2 rounded border ${
                    isDark ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"
                  }`}
                  onClick={handleAddCcRecipients}
                >
                  Ajouter des destinataires CC
                </button>
              </div>
            </div>
          )}

          {/* Recipients - disabled if general message selected */}
          <div className={isGeneralMessage ? "opacity-50 pointer-events-none" : ""}>
            <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {isGeneralMessage ? "Destinataires (définis par les classes sélectionnées)" : "À"}
            </label>
            <div className={`border rounded-lg p-3 ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"}`}>
              <div className="flex flex-wrap gap-2 mb-2">
                {newMessage.destinataires.map((dest, index) => (
                  <span key={index} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {dest.email || dest.nom}
                    <button onClick={() => removeRecipient(index)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              {!isGeneralMessage && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher ou entrer une adresse email"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && recipientSearch.includes("@")) {
                        handleEmailInput(recipientSearch);
                        setRecipientSearch("");
                      }
                    }}
                    className={`w-full px-3 py-2 rounded border ${
                      isDark ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                  {recipientSearch && (
                    <div className={`absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto z-10 ${
                      isDark ? "bg-gray-700" : "bg-white"
                    } shadow-lg rounded-md border ${
                      isDark ? "border-gray-600" : "border-gray-300"
                    }`}>
                      {filteredUsers.length > 0 ? (
                        filteredUsers
                          .filter(user =>
                            user.nom.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                            user.email.toLowerCase().includes(recipientSearch.toLowerCase())
                          )
                          .map((user) => (
                            <div
                              key={user.id}
                              className={`p-2 hover:bg-blue-100 cursor-pointer ${
                                isDark ? "hover:bg-gray-600" : ""
                              }`}
                              onClick={() => addRecipient(user)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                  isDark ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-700"
                                }`}>
                                  {user.nom
                                    .split(" ")
                                    .map((name) => name[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm">{user.nom} {user.prenom}</div>
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">Aucun utilisateur trouvé</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Objet</label>
            <input
              type="text"
              placeholder="Saisissez l'objet du message"
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              value={newMessage.objet}
              onChange={(e) => setNewMessage((prev) => ({ ...prev, objet: e.target.value }))}
            />
          </div>

          {/* Message Content */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Message</label>
            <textarea
              placeholder="Tapez votre message ici..."
              rows={8}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              value={newMessage.contenu}
              onChange={(e) => setNewMessage((prev) => ({ ...prev, contenu: e.target.value }))}
            />
          </div>
        </div>

        <div className={`p-6 border-t flex items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center gap-2">
            {isGeneralMessage ? (
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                <Users size={16} className="inline mr-1" />
                {selectedClasses.length} classe(s) sélectionnée(s)
              </span>
            ) : (
              newMessage.destinataires.length > 0 && (
                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  {newMessage.destinataires.length} destinataire(s) sélectionné(s)
                </span>
              )
            )}
          </div>
          <div className="flex gap-3">
            <button
              className={`px-6 py-2 rounded-lg border transition-colors ${
                isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setShowCompose(false)}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              className={`px-6 py-2 rounded-lg text-white transition-all flex items-center gap-2 ${
                loading || !newMessage.contenu.trim() ||
                (selectedClasses.length === 0 && newMessage.destinataires.length === 0)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "hover:shadow-lg"
              }`}
              style={{
                backgroundColor:
                  loading || !newMessage.contenu.trim() ||
                  (selectedClasses.length === 0 && newMessage.destinataires.length === 0)
                    ? undefined
                    : themeColors.primary,
              }}
              onClick={handleSendMessage}
              disabled={
                loading ||
                !newMessage.contenu.trim() ||
                (selectedClasses.length === 0 && newMessage.destinataires.length === 0)
              }
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
