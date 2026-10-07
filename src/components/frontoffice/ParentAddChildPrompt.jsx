import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChildReaching, faUserPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import AddChildModal from "../../pages/Dashbaord/principale/ParentSidebar/AddChildModal";
import onboarding4 from "../../assets/illustrations/onboarding-4.png";

const dismissKey = (userId) => `sc_addChildPromptDismissed_${userId}`;

/**
 * "Ajoutez votre enfant" — shown to a parent who has no child linked yet (GET /parents/{id}/enfants
 * returns an empty list), typically right after the first connection / forced password change.
 * Never shown once a child exists; "Plus tard" hides it for the rest of the browser session.
 * The button opens the existing AddChildModal (POST /profil-eleves + POST /parents/{id}/enfants/{eleveId}).
 */
const ParentAddChildPrompt = ({ isDark = false }) => {
  const [visible, setVisible] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return undefined;
    try {
      if (sessionStorage.getItem(dismissKey(userId)) === "1") return undefined;
    } catch {
      // sessionStorage unavailable: keep going
    }
    let cancelled = false;
    const check = async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
        const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/parents/${userId}/enfants`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resp.ok) return; // can't tell: don't nag
        const children = await resp.json().catch(() => null);
        if (!cancelled && Array.isArray(children) && children.length === 0) setVisible(true);
      } catch {
        // network error: don't nag
      }
    };
    // let the dashboard render first
    const timer = setTimeout(check, 800);
    const onChildrenUpdated = () => setVisible(false);
    window.addEventListener("childrenUpdated", onChildrenUpdated);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("childrenUpdated", onChildrenUpdated);
    };
  }, [userId]);

  const later = () => {
    try {
      sessionStorage.setItem(dismissKey(userId), "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible && !showAddChild) return null;

  return (
    <>
      {visible && !showAddChild && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-child-prompt-title"
        >
          <div
            className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${
              isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"
            }`}
          >
            <button
              type="button"
              onClick={later}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Fermer"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <div className="bg-gradient-to-br from-indigo-50 to-violet-100 px-6 pt-8 pb-4">
              <img src={onboarding4} alt="" className="w-full max-h-44 object-contain" />
            </div>
            <div className="p-6 text-center">
              <span className="inline-flex w-12 h-12 -mt-12 mb-3 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] text-white items-center justify-center text-xl shadow-lg">
                <FontAwesomeIcon icon={faChildReaching} />
              </span>
              <h2 id="add-child-prompt-title" className="text-xl font-bold">
                Ajoutez votre enfant
              </h2>
              <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                Pour suivre la scolarité de votre enfant (classes, cours, devoirs, notes et messages), ajoutez-le à votre
                compte. Vous pourrez en ajouter plusieurs.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddChild(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] shadow-lg shadow-indigo-500/25 hover:brightness-110"
                >
                  <FontAwesomeIcon icon={faUserPlus} /> Ajouter mon enfant
                </button>
                <button
                  type="button"
                  onClick={later}
                  className={`w-full rounded-xl px-6 py-3 font-semibold ${
                    isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AddChildModal
        isOpen={showAddChild}
        onClose={() => setShowAddChild(false)}
        onChildAdded={() => setVisible(false)}
      />
    </>
  );
};

export default ParentAddChildPrompt;
