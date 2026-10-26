import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { messageService } from "../../../../services/MessageService";

/** Lower-case, accent-free form for search ("Élève" → "eleve"). */
const normalize = (value) =>
  (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/**
 * prénom, nom, full name in either order, or e-mail — case/accent-insensitive.
 * Multi-word queries also match when every word hits one of the fields.
 */
const contactMatches = (user, query) => {
  const q = normalize(query).replace(/\s+/g, " ");
  if (!q) return false;
  const prenom = normalize(user.prenom);
  const nom = normalize(user.nom);
  const email = normalize(user.email);
  const fields = [prenom, nom, `${prenom} ${nom}`, `${nom} ${prenom}`, email];
  if (fields.some((f) => f.includes(q))) return true;
  const words = q.split(" ");
  return (
    words.length > 1 &&
    words.every((w) => prenom.includes(w) || nom.includes(w) || email.includes(w))
  );
};

const ROLE_LABELS = {
  PROFESSEUR: "Professeur",
  PROFESSOR: "Professeur",
  ELEVE: "Élève",
  STUDENT: "Élève",
  PARENT: "Parent",
  PARENTS: "Parent",
  REPETITEUR: "Répétiteur",
  TUTOR: "Répétiteur",
  GESTIONNAIRE: "Gestionnaire",
  ADMIN: "Administrateur",
};

const roleLabel = (user) =>
  ROLE_LABELS[
    normalize(user?.typeUtilisateur || user?.type || user?.role).toUpperCase()
  ] || "";

const initialsOf = (user) =>
  `${(user?.prenom || "").charAt(0)}${(user?.nom || "").charAt(0)}`.toUpperCase() ||
  (user?.email || "?").charAt(0).toUpperCase();

const displayName = (user) =>
  `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.email || "Utilisateur";

const MAX_SUGGESTIONS = 30;

/**
 * Type-to-search recipient field: suggestions appear after 1+ character,
 * filtered client-side from GET /messages/contacts. Chips are removable;
 * anyone in `excludeIds` (already picked in À or CC) is never suggested.
 * Keyboard: ↑/↓ to move, Enter to add, Escape to close, Backspace on an
 * empty field removes the last chip.
 */
export const ContactAutocomplete = ({
  contacts,
  selected,
  excludeIds,
  onAdd,
  onRemove,
  isDark,
  loading = false,
  accent = "blue",
  placeholder = "Tapez un nom ou un e-mail",
  inputId,
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef(null);
  const listId = `contact-suggestions-${useId().replace(/:/g, "")}`;

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const excluded = new Set([
      ...(excludeIds || []),
      ...selected.map((u) => u.id),
    ]);
    return contacts
      .filter((u) => u?.id && !excluded.has(u.id) && contactMatches(u, query))
      .slice(0, MAX_SUGGESTIONS);
  }, [contacts, query, selected, excludeIds]);

  useEffect(() => setHighlight(0), [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${highlight}"]`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [highlight]);

  const showList = open && query.trim().length > 0;

  const pick = (user) => {
    onAdd(user);
    setQuery("");
    setHighlight(0);
  };

  const onKeyDown = (e) => {
    if (e.key === "Backspace" && !query && selected.length > 0) {
      onRemove(selected[selected.length - 1]);
      return;
    }
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length) setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length)
        setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlight]) pick(suggestions[highlight]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const chipCls =
    accent === "purple"
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800";
  const activeCls = isDark
    ? "bg-gray-600"
    : accent === "purple"
      ? "bg-purple-100"
      : "bg-blue-100";

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((user) => (
            <span
              key={user.id}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${chipCls}`}
            >
              {displayName(user)}
              <button
                type="button"
                aria-label={`Retirer ${displayName(user)}`}
                onClick={() => onRemove(user)}
              >
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-gray-400" : "text-gray-500"}`}
          style={{ fontSize: 13 }}
        />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            showList && suggestions[highlight]
              ? `${listId}-${suggestions[highlight].id}`
              : undefined
          }
          autoComplete="off"
          placeholder={loading ? "Chargement des contacts..." : placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={`w-full pl-9 pr-3 py-2 rounded border ${isDark ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-300 placeholder-gray-500"}`}
        />
        {showList && (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            className={`absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto z-20 shadow-lg rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          >
            {loading ? (
              <li className="p-2 text-sm text-gray-500">Chargement...</li>
            ) : suggestions.length > 0 ? (
              suggestions.map((user, index) => {
                const role = roleLabel(user);
                return (
                  <li
                    key={user.id}
                    id={`${listId}-${user.id}`}
                    data-index={index}
                    role="option"
                    aria-selected={index === highlight}
                    className={`p-2 cursor-pointer ${index === highlight ? activeCls : ""}`}
                    // mousedown (not click) so the input's blur doesn't close the list first
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(user);
                    }}
                    onMouseEnter={() => setHighlight(index)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${isDark ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"}`}
                      >
                        {initialsOf(user)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {displayName(user)}
                        </div>
                        {user.email && (
                          <div className="text-xs text-gray-500 truncate">
                            {user.email}
                          </div>
                        )}
                      </div>
                      {role && (
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-xs ${isDark ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-600"}`}
                        >
                          {role}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="p-2 text-sm text-gray-500">Aucun contact trouvé</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

/** Add people in copy (CC) — type-to-search over GET /messages/contacts. */
const RecipientSelectorModal = ({
  isDark,
  filteredUsers,
  ccRecipients,
  setCcRecipients,
  setShowRecipientSelector,
}) => {
  // Recipients always come from GET /messages/contacts (server-enforced list).
  const [contacts, setContacts] = useState(filteredUsers || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    messageService
      .getContacts()
      .then((list) => {
        if (cancelled) return;
        const me = localStorage.getItem("userId");
        setContacts(list.filter((u) => u?.id && u.id !== me));
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <div
          className={`p-6 border-b flex items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <h3
            className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Sélectionner des destinataires
          </h3>
          <button
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            onClick={() => setShowRecipientSelector(false)}
          >
            <FontAwesomeIcon
              icon={faXmark}
              style={{
                fontSize: 20,
              }}
            />
          </button>
        </div>
        <div className="p-6 min-h-[22rem] overflow-visible">
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          <ContactAutocomplete
            contacts={contacts}
            selected={ccRecipients}
            onAdd={(user) =>
              setCcRecipients((prev) =>
                prev.some((r) => r.id === user.id) ? prev : [...prev, user],
              )
            }
            onRemove={(user) =>
              setCcRecipients((prev) => prev.filter((r) => r.id !== user.id))
            }
            isDark={isDark}
            loading={loading}
            placeholder="Rechercher par nom ou e-mail..."
          />
        </div>
        <div
          className={`p-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <button
            className={`px-4 py-2 rounded-lg ${isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}
            onClick={() => setShowRecipientSelector(false)}
          >
            Valider la sélection
          </button>
        </div>
      </div>
    </div>
  );
};
export default RecipientSelectorModal;
