import React, { useState, useEffect } from "react";
import { X, Send, RefreshCw, Check, Plus } from "lucide-react";

const ComposeModal = ({
  isDark,
  themeColors,
  newMessage,
  setNewMessage,
  loading,
  recipientSearch,
  setRecipientSearch,
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
  setShowRecipientSelector,
  onMessageSent,
  setError,
  setLoading,
  fetchMessages,
}) => {
  const [classesList, setClassesList] = useState([]);
  const [classUsers, setClassUsers] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [showCcField, setShowCcField] = useState(false);
  const [ccSearch, setCcSearch] = useState("");
  const [allUsers, setAllUsers] = useState([]);

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

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:8486/scholchat/acceder/utilisateurs`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        // Filter out current user
        setAllUsers(data.filter(user => user.id !== currentUser.id));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchAllUsers();
  }, [currentUser.id]);

  useEffect(() => {
    const fetchUsersForClasses = async () => {
      if (selectedClasses.length === 0) return;
      try {
        const accessToken = localStorage.getItem('accessToken');
        const queryParams = new URLSearchParams({
          classeIds: selectedClasses.join(',')
        }).toString();
        const response = await fetch(`http://localhost:8486/scholchat/acceder/classes/utilisateurs?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users for classes');
        }
        const data = await response.json();
        const users = {};
        selectedClasses.forEach(classeId => {
          users[classeId] = data;
        });
        setClassUsers(users);
      } catch (error) {
        console.error('Error fetching users for classes:', error);
      }
    };
    fetchUsersForClasses();
  }, [selectedClasses]);

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

  const handleSendMessage = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      if (isGeneralMessage) {
        const accessToken = localStorage.getItem('accessToken');
        const senderId = localStorage.getItem('userId');
        
        // For general messages, include CC recipients in the request
        const requestBody = {
          objet: newMessage.objet,
          content: newMessage.contenu,
          senderId: senderId,
          classIds: selectedClasses
        };

        // Add CC recipients if any
        if (ccRecipients.length > 0) {
          requestBody.ccRecipients = ccRecipients.map(cc => cc.id);
        }

        const response = await fetch('http://localhost:8486/scholchat/messages/group', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
      } else {
        const accessToken = localStorage.getItem('accessToken');
        const senderId = localStorage.getItem('userId');
        
        // Combine regular recipients and CC recipients
        const allRecipients = [...newMessage.destinataires];
        
        // Add CC recipients to the recipients list with a CC flag
        ccRecipients.forEach(ccRecipient => {
          if (!allRecipients.some(recipient => recipient.id === ccRecipient.id)) {
            allRecipients.push({
              ...ccRecipient,
              isCC: true
            });
          }
        });

        const response = await fetch('http://localhost:8486/scholchat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            objet: newMessage.objet,
            contenu: newMessage.contenu,
            dateCreation: new Date().toISOString(),
            etat: "envoyé",
            expediteur: {
              type: "utilisateur",
              id: senderId,
              nom: currentUser.nom,
              prenom: currentUser.prenom,
              email: currentUser.email,
              telephone: currentUser.telephone,
              adresse: currentUser.adresse,
              etat: "ACTIVE",
              creationDate: currentUser.creationDate,
              admin: currentUser.admin
            },
            destinataires: allRecipients.map(dest => ({
              type: "utilisateur",
              id: dest.id,
              nom: dest.nom,
              prenom: dest.prenom,
              email: dest.email,
              telephone: dest.telephone,
              adresse: dest.adresse,
              etat: "ACTIVE",
              creationDate: dest.creationDate,
              admin: dest.admin,
              isCC: dest.isCC || false
            }))
          })
        });
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
      }
      
      // Reset form
      setNewMessage({
        destinataires: [],
        contenu: "",
        objet: "",
        expediteur: currentUser,
      });
      setSelectedClasses([]);
      setIsGeneralMessage(false);
      setCcRecipients([]);
      setShowCcField(false);
      setCcSearch("");
      setShowCompose(false);
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = Object.values(classUsers).flat().filter(user =>
    user.nom.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(recipientSearch.toLowerCase())
  ).filter(user => user.id !== currentUser.id);

  const handleAddRecipient = (user) => {
    if (!newMessage.destinataires.some(dest => dest.id === user.id)) {
      setNewMessage(prev => ({
        ...prev,
        destinataires: [...prev.destinataires, user]
      }));
    }
    setRecipientSearch("");
  };

  // Filter users for CC field
  const filteredCcUsers = allUsers.filter(user =>
    (user.nom.toLowerCase().includes(ccSearch.toLowerCase()) ||
     user.email.toLowerCase().includes(ccSearch.toLowerCase()) ||
     (user.prenom && user.prenom.toLowerCase().includes(ccSearch.toLowerCase()))) &&
    !ccRecipients.some(cc => cc.id === user.id) &&
    !newMessage.destinataires.some(dest => dest.id === user.id)
  );

  const handleAddCcRecipient = (user) => {
    setCcRecipients(prev => [...prev, user]);
    setCcSearch("");
  };

  const handleRemoveCcRecipient = (userId) => {
    setCcRecipients(prev => prev.filter(cc => cc.id !== userId));
  };

  const handleCcEmailInput = (email) => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const emailUser = {
        id: `email_cc_${Date.now()}`,
        nom: email.split("@")[0],
        prenom: "",
        email: email,
        role: "EXTERNAL",
        type: "external",
      };
      setCcRecipients(prev => [...prev, emailUser]);
      setCcSearch("");
      return true;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Nouveau message</h3>
          <button
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            onClick={() => setShowCompose(false)}
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 text-red-500 text-sm bg-red-100 border border-red-400">
            {errorMessage}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Classes Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Classes</label>
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

          {/* Main Recipients */}
          <div className={isGeneralMessage ? "opacity-50 pointer-events-none" : ""}>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
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
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`p-2 hover:bg-blue-100 cursor-pointer ${
                              isDark ? "hover:bg-gray-600" : ""
                            }`}
                            onClick={() => handleAddRecipient(user)}
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

          {/* CC Recipients */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Copie (CC)
              </label>
              {!showCcField && (
                <button
                  onClick={() => setShowCcField(true)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Plus size={12} />
                  Ajouter CC
                </button>
              )}
            </div>
            
            {(showCcField || ccRecipients.length > 0) && (
              <div className={`border rounded-lg p-3 ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"}`}>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ccRecipients.map((ccRecipient) => (
                    <span key={ccRecipient.id} className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {ccRecipient.email || `${ccRecipient.prenom} ${ccRecipient.nom}`}
                      <button onClick={() => handleRemoveCcRecipient(ccRecipient.id)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher ou entrer une adresse email pour CC"
                    value={ccSearch}
                    onChange={(e) => setCcSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && ccSearch.includes("@")) {
                        handleCcEmailInput(ccSearch);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded border ${
                      isDark ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-300 placeholder-gray-500"
                    }`}
                  />
                  {ccSearch && (
                    <div className={`absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto z-10 ${
                      isDark ? "bg-gray-700" : "bg-white"
                    } shadow-lg rounded-md border ${
                      isDark ? "border-gray-600" : "border-gray-300"
                    }`}>
                      {filteredCcUsers.length > 0 ? (
                        filteredCcUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`p-2 hover:bg-purple-100 cursor-pointer ${
                              isDark ? "hover:bg-gray-600" : ""
                            }`}
                            onClick={() => handleAddCcRecipient(user)}
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
              </div>
            )}
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
              rows={6}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              value={newMessage.contenu}
              onChange={(e) => setNewMessage((prev) => ({ ...prev, contenu: e.target.value }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <button
            className={`px-4 py-2 rounded-lg border transition-colors mb-2 sm:mb-0 w-full sm:w-auto ${
              isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setShowCompose(false)}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-white transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
              loading || !newMessage.contenu.trim() || (selectedClasses.length === 0 && newMessage.destinataires.length === 0)
                ? "bg-gray-400 cursor-not-allowed"
                : "hover:shadow-lg"
            }`}
            style={{
              backgroundColor: loading || !newMessage.contenu.trim() || (selectedClasses.length === 0 && newMessage.destinataires.length === 0)
                ? undefined
                : themeColors.primary,
            }}
            onClick={handleSendMessage}
            disabled={loading || !newMessage.contenu.trim() || (selectedClasses.length === 0 && newMessage.destinataires.length === 0)}
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
  );
};

export default ComposeModal;

// make it such that when we click on the class, in the same way as the request to find the utilisateurs having access to the class, we should also fetch the professeurs who have droit de publication to a class through the link http://localhost:8486/scholchat/droits-publication/classes/{classeId}/utilisateurs and for the add in copy, it should be only the professeur data gotten from this link that can be displaying in autocompilation. 