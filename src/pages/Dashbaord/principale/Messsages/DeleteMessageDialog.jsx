import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faTrashCan } from "@fortawesome/free-solid-svg-icons";

/**
 * Delete confirmation.
 *  - canEveryone: "Supprimer pour tout le monde" / "Supprimer pour moi" / "Annuler"
 *  - otherwise:   "Supprimer pour moi" / "Annuler"
 */
const DeleteMessageDialog = ({
  isDark,
  title,
  description,
  canEveryone,
  busy,
  error,
  onEveryone,
  onMe,
  onCancel,
}) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const btn =
    "w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faTrashCan} />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {description && (
          <p className={`text-sm mb-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            {description}
          </p>
        )}
        {error && (
          <div className="mb-4 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-2">
          {canEveryone && (
            <button
              className={`${btn} bg-red-600 text-white hover:bg-red-700`}
              onClick={onEveryone}
              disabled={busy}
            >
              Supprimer pour tout le monde
            </button>
          )}
          <button
            className={`${btn} ${canEveryone ? (isDark ? "bg-gray-700 text-red-300 hover:bg-gray-600" : "bg-red-50 text-red-700 hover:bg-red-100") : "bg-red-600 text-white hover:bg-red-700"}`}
            onClick={onMe}
            disabled={busy}
          >
            Supprimer pour moi
          </button>
          <button
            className={`${btn} ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
            onClick={onCancel}
            disabled={busy}
          >
            {busy ? (
              <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin" />
            ) : (
              "Annuler"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageDialog;
