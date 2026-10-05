import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faCheck,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { toUtilisateurPayload } from "./messageUtils";
import { messageService } from "../../../../services/MessageService";
import { useMessageAttachments, MAX_ATTACHMENTS } from "./messageMedia";
import { AttachButton, AttachmentPreviewList } from "./MessageAttachments";
import { ContactAutocomplete } from "./RecipientSelectorModal";


const ComposeModal = ({
  isDark,
  themeColors,
  newMessage,
  setNewMessage,
  setRecipientSearch,
  setShowCompose,
  selectedClasses,
  setSelectedClasses,
  isGeneralMessage,
  setIsGeneralMessage,
  currentUser,
  ccRecipients,
  setCcRecipients,
  onMessageSent,
}) => {
  const [contacts, setContacts] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sending, setSending] = useState(false);
  const attachments = useMessageAttachments();

  // Group messaging is offered whenever GET /messages/contacts/classes returns
  // classes — the server decides (member/moderator/creator/publication rights).
  const canGroupMessage = true;

  // Who the caller may message (server-enforced: anything else is a 403).
  useEffect(() => {
    let cancelled = false;
    setLoadingContacts(true);
    Promise.all([
      messageService.getContacts().catch((e) => {
        if (!cancelled) setErrorMessage(e.message);
        return [];
      }),
      messageService.getContactClasses().catch(() => []),
    ]).then(([people, classes]) => {
      if (cancelled) return;
      const me = localStorage.getItem("userId");
      setContacts(people.filter((u) => u?.id && u.id !== me));
      setClassesList(classes.filter((c) => c?.id));
      setLoadingContacts(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const toggleClassSelection = (classeId) => {
    if (selectedClasses.includes(classeId)) {
      const next = selectedClasses.filter((id) => id !== classeId);
      setSelectedClasses(next);
      if (next.length === 0) setIsGeneralMessage(false);
    } else {
      setSelectedClasses([...selectedClasses, classeId]);
    }
  };

  const setMode = (general) => {
    setIsGeneralMessage(general);
    setErrorMessage("");
    if (general) {
      setNewMessage((prev) => ({ ...prev, destinataires: [] }));
    } else {
      setSelectedClasses([]);
    }
  };

  // Anyone already in À or CC is never suggested again in either field.
  const selectedIds = useMemo(
    () => [...newMessage.destinataires, ...ccRecipients].map((u) => u.id),
    [newMessage.destinataires, ccRecipients],
  );

  const handleAddRecipient = (user) => {
    setNewMessage((prev) =>
      prev.destinataires.some((dest) => dest.id === user.id)
        ? prev
        : { ...prev, destinataires: [...prev.destinataires, user] },
    );
    setRecipientSearch?.("");
  };
  const handleRemoveRecipient = (user) => {
    setNewMessage((prev) => ({
      ...prev,
      destinataires: prev.destinataires.filter((dest) => dest.id !== user.id),
    }));
  };
  const handleAddCcRecipient = (user) => {
    setCcRecipients((prev) =>
      prev.some((cc) => cc.id === user.id) ? prev : [...prev, user],
    );
  };
  const handleRemoveCcRecipient = (user) => {
    setCcRecipients((prev) => prev.filter((cc) => cc.id !== user.id));
  };

  const hasText = !!newMessage.contenu?.trim();
  const hasMedia = attachments.medias.length > 0;
  const hasRecipients = isGeneralMessage
    ? selectedClasses.length > 0
    : newMessage.destinataires.length > 0 || ccRecipients.length > 0;
  const canSend =
    !sending &&
    !attachments.uploading &&
    !attachments.hasErrors &&
    (hasText || hasMedia) &&
    hasRecipients;

  const handleSendMessage = async () => {
    setErrorMessage("");
    if (!canSend) return;
    setSending(true);
    try {
      const objet = newMessage.objet?.trim() || undefined;
      const medias = attachments.medias.length ? attachments.medias : undefined;
      let sent;
      if (isGeneralMessage) {
        sent = await messageService.sendGroupMessage({
          classIds: selectedClasses,
          objet,
          content: newMessage.contenu || "",
          ...(ccRecipients.length > 0 && {
            copieRecipientIds: ccRecipients.map((cc) => cc.id),
          }),
          ...(medias && { medias }),
        });
      } else {
        const allRecipients = [...newMessage.destinataires];
        ccRecipients.forEach((cc) => {
          if (!allRecipients.some((r) => r.id === cc.id)) allRecipients.push(cc);
        });
        sent = await messageService.sendMessage({
          objet,
          contenu: newMessage.contenu || "",
          // nom/prenom must never be null (@NonNull on Utilisateurs).
          destinataires: allRecipients.map(toUtilisateurPayload),
          ...(medias && { medias }),
        });
      }

      setNewMessage({
        destinataires: [],
        contenu: "",
        objet: "",
        expediteur: currentUser,
      });
      setSelectedClasses([]);
      setIsGeneralMessage(false);
      setCcRecipients([]);
      attachments.clear();
      setShowCompose(false);
      onMessageSent?.(sent);
    } catch (error) {
      console.error("Error sending message:", error);
      // 403/400 carry a French message from the server.
      setErrorMessage(
        error?.message || "Échec de l'envoi du message. Veuillez réessayer.",
      );
    } finally {
      setSending(false);
    }
  };

  const onFiles = (files) => {
    const rejected = attachments.addFiles(files);
    if (rejected > 0) {
      setErrorMessage(`Maximum ${MAX_ATTACHMENTS} pièces jointes par message.`);
    }
  };

  const fieldBox = `border rounded-lg p-3 ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"}`;
  const labelCls = `block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 pt-20">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto my-auto ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <div
          className={`p-4 border-b flex items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <h3
            className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Nouveau message
          </h3>
          <button
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            onClick={() => setShowCompose(false)}
          >
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 20 }} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 text-red-600 text-sm bg-red-100 border border-red-300">
            {errorMessage}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Individual vs class (group) message */}
          {canGroupMessage && classesList.length > 0 && (
            <div className="flex gap-2">
              {[
                { general: false, label: "Message individuel" },
                { general: true, label: "Message à une classe" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setMode(opt.general)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${isGeneralMessage === opt.general ? "bg-blue-100 text-blue-800 border-blue-300" : isDark ? "border-gray-500 text-gray-300 hover:bg-gray-600" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {isGeneralMessage && (
            <div>
              <label className={labelCls}>Classes</label>
              <div className={fieldBox}>
                <div className="flex flex-wrap gap-2">
                  {classesList.map((classe) => (
                    <button
                      key={classe.id}
                      onClick={() => toggleClassSelection(classe.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${selectedClasses.includes(classe.id) ? "bg-blue-100 text-blue-800 border-blue-300" : isDark ? "border-gray-500 text-gray-300 hover:bg-gray-600" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                    >
                      {selectedClasses.includes(classe.id) && (
                        <FontAwesomeIcon icon={faCheck} style={{ fontSize: 14 }} />
                      )}
                      {classe.nom}
                      {classe.niveau ? ` (${classe.niveau})` : ""}
                    </button>
                  ))}
                </div>
                <p className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Le message sera envoyé à tous les membres des classes
                  sélectionnées.
                </p>
              </div>
            </div>
          )}

          {/* Main Recipients */}
          {!isGeneralMessage && (
            <div>
              <label className={labelCls} htmlFor="compose-to">
                À
              </label>
              <div className={fieldBox}>
                <ContactAutocomplete
                  inputId="compose-to"
                  contacts={contacts}
                  selected={newMessage.destinataires}
                  excludeIds={selectedIds}
                  onAdd={handleAddRecipient}
                  onRemove={handleRemoveRecipient}
                  isDark={isDark}
                  loading={loadingContacts}
                  placeholder="Tapez un nom ou un e-mail"
                />
              </div>
            </div>
          )}

          {/* CC Recipients */}
          <div>
            <label className={labelCls} htmlFor="compose-cc">
              Copie (CC)
            </label>
            <div className={fieldBox}>
              <ContactAutocomplete
                inputId="compose-cc"
                contacts={contacts}
                selected={ccRecipients}
                excludeIds={selectedIds}
                onAdd={handleAddCcRecipient}
                onRemove={handleRemoveCcRecipient}
                isDark={isDark}
                loading={loadingContacts}
                accent="purple"
                placeholder="Ajouter en copie : nom ou e-mail"
              />
            </div>
          </div>

          {/* Subject (optional) */}
          <div>
            <label className={labelCls}>Objet (facultatif)</label>
            <input
              type="text"
              placeholder="Saisissez l'objet du message"
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
              value={newMessage.objet}
              onChange={(e) =>
                setNewMessage((prev) => ({ ...prev, objet: e.target.value }))
              }
            />
          </div>

          {/* Message Content */}
          <div>
            <label className={labelCls}>Message</label>
            <textarea
              placeholder="Tapez votre message ici..."
              rows={6}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
              value={newMessage.contenu}
              onChange={(e) =>
                setNewMessage((prev) => ({ ...prev, contenu: e.target.value }))
              }
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <AttachButton
                onFiles={onFiles}
                disabled={sending || attachments.items.length >= MAX_ATTACHMENTS}
                isDark={isDark}
                label="Joindre"
              />
              <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Images, vidéos, PDF et documents
                {attachments.uploading && " — téléversement en cours..."}
              </span>
            </div>
            <AttachmentPreviewList
              items={attachments.items}
              onRemove={attachments.removeItem}
              onRetry={attachments.retryItem}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <button
            className={`px-4 py-2 rounded-lg border transition-colors mb-2 sm:mb-0 w-full sm:w-auto ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setShowCompose(false)}
            disabled={sending}
          >
            Annuler
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-white transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${canSend ? "hover:shadow-lg" : "bg-gray-400 cursor-not-allowed"}`}
            style={{
              backgroundColor: canSend ? themeColors.primary : undefined,
            }}
            onClick={handleSendMessage}
            disabled={!canSend}
          >
            {sending || attachments.uploading ? (
              <>
                <FontAwesomeIcon
                  icon={faArrowsRotate}
                  className="animate-spin"
                  style={{ fontSize: 16 }}
                />
                {sending ? "Envoi..." : "Téléversement..."}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: 16 }} />
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
