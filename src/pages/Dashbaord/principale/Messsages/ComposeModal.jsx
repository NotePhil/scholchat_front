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
import { useTranslation } from "../../../../hooks/useTranslation";


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
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sending, setSending] = useState(false);
  // Members (and moderator) of each selected class: recipients are picked
  // among them, as in the original flow (class first, then the person).
  const [classUsers, setClassUsers] = useState({});
  const attachments = useMessageAttachments();

  // "Message général" (whole class) is not offered to parents and students.
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();
  const canGeneralMessage = !(
    userRole.includes("PARENT") ||
    userRole.includes("ELEVE") ||
    userRole.includes("STUDENT")
  );

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

  // Load the members of each newly selected class (once per class).
  useEffect(() => {
    let cancelled = false;
    selectedClasses
      .filter((id) => !(id in classUsers))
      .forEach(async (classeId) => {
        const [members, classe] = await Promise.all([
          messageService.getClassMembers(classeId).catch(() => null),
          messageService.getClassDetails(classeId).catch(() => null),
        ]);
        if (cancelled) return;
        const list = Array.isArray(members) ? [...members] : null;
        const moderator = classe?.moderator;
        if (list && moderator?.id && !list.some((u) => u.id === moderator.id)) {
          list.push(moderator);
        }
        setClassUsers((prev) => ({ ...prev, [classeId]: list }));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClasses]); // eslint-disable-line react-hooks/exhaustive-deps

  // People the caller may write to: all contacts, or only the members of the
  // selected classes. If a class's member list can't be read, all contacts.
  const classPeople = useMemo(() => {
    if (selectedClasses.length === 0) return contacts;
    const loaded = selectedClasses.map((id) => classUsers[id]);
    if (loaded.some((l) => l === null)) return contacts;
    const allowed = new Map(contacts.map((u) => [u.id, u]));
    const me = localStorage.getItem("userId");
    const seen = new Set();
    return loaded
      .flatMap((l) => l || [])
      .filter((u) => u?.id && u.id !== me && allowed.has(u.id))
      .filter((u) => (seen.has(u.id) ? false : seen.add(u.id)))
      .map((u) => allowed.get(u.id));
  }, [selectedClasses, classUsers, contacts]);

  const toggleClassSelection = (classeId) => {
    if (selectedClasses.includes(classeId)) {
      setSelectedClasses(selectedClasses.filter((id) => id !== classeId));
    } else {
      setSelectedClasses([...selectedClasses, classeId]);
    }
  };

  const toggleGeneralMessage = () => {
    const general = !isGeneralMessage;
    setIsGeneralMessage(general);
    setErrorMessage("");
    if (general) {
      setNewMessage((prev) => ({ ...prev, destinataires: [] }));
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
  // Général: every class the caller can write to. Otherwise the chosen people,
  // or — when no one is named — every member of the selected classes.
  const hasRecipients = isGeneralMessage
    ? classesList.length > 0
    : newMessage.destinataires.length > 0 || selectedClasses.length > 0;
  const sendToClasses =
    isGeneralMessage || newMessage.destinataires.length === 0;
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
      if (sendToClasses) {
        sent = await messageService.sendGroupMessage({
          classIds: isGeneralMessage
            ? classesList.map((classe) => classe.id)
            : selectedClasses,
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
        error?.message ||
          t("messaging.compose.sendFailed", "Échec de l'envoi du message. Veuillez réessayer."),
      );
    } finally {
      setSending(false);
    }
  };

  const onFiles = (files) => {
    const rejected = attachments.addFiles(files);
    if (rejected > 0) {
      setErrorMessage(
        t("messaging.compose.maxAttachments", "Maximum {{max}} pièces jointes par message.", {
          max: MAX_ATTACHMENTS,
        }),
      );
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
            {t("messaging.common.newMessage", "Nouveau message")}
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
          {/* Message général: everyone in every class the caller can write to */}
          {canGeneralMessage && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="generalMessage"
                checked={isGeneralMessage}
                onChange={toggleGeneralMessage}
                className="rounded"
              />
              <label
                htmlFor="generalMessage"
                className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                {t(
                  "messaging.compose.generalCheckbox",
                  "Message général (envoyé à tous les utilisateurs de toutes vos classes)",
                )}
              </label>
            </div>
          )}

          {/* Classes Selection (hidden for a general message) */}
          {!isGeneralMessage && (
            <div>
              <label className={labelCls}>
                {t("messaging.compose.classes", "Classes")}
              </label>
              <div className={fieldBox}>
                <div className="flex flex-wrap gap-2">
                  {loadingContacts ? (
                    <FontAwesomeIcon
                      icon={faArrowsRotate}
                      className={`animate-spin ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    />
                  ) : classesList.length === 0 ? (
                    <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {t("messaging.compose.noClasses", "Aucune classe disponible.")}
                    </span>
                  ) : (
                    classesList.map((classe) => (
                      <button
                        key={classe.id}
                        type="button"
                        onClick={() => toggleClassSelection(classe.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${selectedClasses.includes(classe.id) ? "bg-blue-100 text-blue-800 border-blue-300" : isDark ? "border-gray-500 text-gray-300 hover:bg-gray-600" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                      >
                        {selectedClasses.includes(classe.id) && (
                          <FontAwesomeIcon icon={faCheck} style={{ fontSize: 14 }} />
                        )}
                        {classe.nom}
                        {classe.niveau ? ` (${classe.niveau})` : ""}
                      </button>
                    ))
                  )}
                </div>
                <p className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {t(
                    "messaging.compose.classesOrPeopleHint",
                    "Sans destinataire précis, le message est envoyé à tous les membres des classes sélectionnées.",
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Main Recipients (greyed out for a general message) */}
          <div
            className={isGeneralMessage ? "opacity-50 pointer-events-none select-none" : ""}
            aria-disabled={isGeneralMessage}
          >
              <label className={labelCls} htmlFor="compose-to">
                {t("messaging.compose.to", "À")}
              </label>
              <div className={fieldBox}>
                <ContactAutocomplete
                  inputId="compose-to"
                  contacts={classPeople}
                  selected={newMessage.destinataires}
                  excludeIds={selectedIds}
                  onAdd={handleAddRecipient}
                  onRemove={handleRemoveRecipient}
                  isDark={isDark}
                  loading={
                    loadingContacts ||
                    selectedClasses.some((id) => !(id in classUsers))
                  }
                  placeholder={t("messaging.compose.toPlaceholder", "Tapez un nom ou un e-mail")}
                />
              </div>
          </div>

          {/* CC Recipients */}
          <div>
            <label className={labelCls} htmlFor="compose-cc">
              {t("messaging.compose.cc", "Copie (CC)")}
            </label>
            <div className={fieldBox}>
              <ContactAutocomplete
                inputId="compose-cc"
                contacts={classPeople}
                selected={ccRecipients}
                excludeIds={selectedIds}
                onAdd={handleAddCcRecipient}
                onRemove={handleRemoveCcRecipient}
                isDark={isDark}
                loading={loadingContacts}
                accent="purple"
                placeholder={t(
                  "messaging.compose.ccPlaceholder",
                  "Ajouter en copie : nom ou e-mail",
                )}
              />
            </div>
          </div>

          {/* Subject (optional) */}
          <div>
            <label className={labelCls}>
              {t("messaging.compose.subjectOptional", "Objet (facultatif)")}
            </label>
            <input
              type="text"
              placeholder={t("messaging.compose.subjectPlaceholder", "Saisissez l'objet du message")}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
              value={newMessage.objet}
              onChange={(e) =>
                setNewMessage((prev) => ({ ...prev, objet: e.target.value }))
              }
            />
          </div>

          {/* Message Content */}
          <div>
            <label className={labelCls}>{t("messaging.common.message", "Message")}</label>
            <textarea
              placeholder={t("messaging.compose.messagePlaceholder", "Tapez votre message ici...")}
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
                label={t("messaging.compose.attach", "Joindre")}
              />
              <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {t("messaging.compose.attachHint", "Images, vidéos, PDF et documents")}
                {attachments.uploading &&
                  t("messaging.compose.uploadingSuffix", " — téléversement en cours...")}
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
            {t("messaging.common.cancel", "Annuler")}
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
                {sending
                  ? t("messaging.compose.sending", "Envoi...")
                  : t("messaging.compose.uploading", "Téléversement...")}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: 16 }} />
                {t("messaging.common.send", "Envoyer")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ComposeModal;
