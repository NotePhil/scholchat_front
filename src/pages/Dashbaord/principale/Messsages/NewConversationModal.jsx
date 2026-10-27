import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faCheck,
  faCircleExclamation,
  faMagnifyingGlass,
  faUser,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { messageService } from "../../../../services/MessageService";
import { fullName, initialsOf, roleLabel } from "./chatUtils";
import { useTranslation } from "../../../../hooks/useTranslation";

/**
 * "Nouvelle discussion": one contact => direct chat (find-or-create);
 * group mode => several contacts + a group title.
 */
const NewConversationModal = ({ isDark, themeColors, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [groupMode, setGroupMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [titre, setTitre] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    messageService
      .getContacts()
      .then((list) => alive && setContacts(list))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((c) =>
      `${c.prenom || ""} ${c.nom || ""} ${c.email || ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [contacts, search]);

  const submit = async (ids, title) => {
    setBusy(true);
    setError(null);
    try {
      await onCreate(ids, title);
    } catch (e) {
      setError(
        e.message || t("messaging.newConversation.createFailed", "Impossible de créer la discussion."),
      );
      setBusy(false);
    }
  };

  const pick = (contact) => {
    if (busy) return;
    if (!groupMode) {
      submit([contact.id]);
      return;
    }
    setSelected((prev) =>
      prev.includes(contact.id)
        ? prev.filter((id) => id !== contact.id)
        : [...prev, contact.id],
    );
  };

  const canCreateGroup = selected.length >= 2 && titre.trim().length > 0;
  const muted = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className={`w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <h3 className="font-semibold">
            {t("messaging.conversations.newChat", "Nouvelle discussion")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            aria-label={t("messaging.common.close", "Fermer")}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="px-4 pt-3 flex gap-2">
          {[
            {
              group: false,
              label: t("messaging.newConversation.direct", "Discussion"),
              icon: faUser,
            },
            { group: true, label: t("messaging.common.group", "Groupe"), icon: faUsers },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                setGroupMode(opt.group);
                setSelected([]);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium border ${
                groupMode === opt.group
                  ? "text-white border-transparent"
                  : isDark
                    ? "border-gray-600 text-gray-300"
                    : "border-gray-300 text-gray-700"
              }`}
              style={
                groupMode === opt.group
                  ? { backgroundColor: themeColors.primary }
                  : undefined
              }
            >
              <FontAwesomeIcon icon={opt.icon} />
              {opt.label}
            </button>
          ))}
        </div>

        {groupMode && (
          <div className="px-4 pt-3">
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              maxLength={255}
              placeholder={t("messaging.newConversation.groupName", "Nom du groupe")}
              className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
            />
            <p className={`text-xs mt-1 ${muted}`}>
              {selected.length > 1
                ? t(
                    "messaging.newConversation.groupHintMany",
                    "Choisissez au moins 2 participants ({{count}} sélectionnés).",
                    { count: selected.length },
                  )
                : t(
                    "messaging.newConversation.groupHintOne",
                    "Choisissez au moins 2 participants ({{count}} sélectionné).",
                    { count: selected.length },
                  )}
            </p>
          </div>
        )}

        <div className="px-4 py-3">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className={muted} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("messaging.newConversation.searchContact", "Rechercher un contact")}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mb-2 p-2 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleExclamation} />
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className={`p-6 text-center text-sm ${muted}`}>
              <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin mr-2" />
              {t("messaging.newConversation.loadingContacts", "Chargement des contacts…")}
            </div>
          ) : filtered.length === 0 ? (
            <div className={`p-6 text-center text-sm ${muted}`}>
              {t("messaging.newConversation.noContacts", "Aucun contact trouvé.")}
            </div>
          ) : (
            filtered.map((c) => {
              const checked = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c)}
                  disabled={busy}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    {initialsOf(c)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{fullName(c, t)}</div>
                    <div className={`text-xs truncate ${muted}`}>
                      {roleLabel(c.typeUtilisateur, t) ||
                        c.email ||
                        ""}
                    </div>
                  </div>
                  {groupMode && (
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${checked ? "text-white border-transparent" : isDark ? "border-gray-500" : "border-gray-300"}`}
                      style={
                        checked
                          ? { backgroundColor: themeColors.primary }
                          : undefined
                      }
                    >
                      {checked && (
                        <FontAwesomeIcon icon={faCheck} style={{ fontSize: 11 }} />
                      )}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {groupMode && (
          <div
            className={`px-4 py-3 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
          >
            <button
              type="button"
              disabled={!canCreateGroup || busy}
              onClick={() => submit(selected, titre.trim())}
              className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
              style={{ backgroundColor: themeColors.primary }}
            >
              {busy
                ? t("messaging.newConversation.creating", "Création…")
                : t("messaging.newConversation.createGroup", "Créer le groupe")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewConversationModal;
