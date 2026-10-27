import React, { useCallback, useEffect, useRef, useState } from "react";
import AddChildModal from "./AddChildModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBan,
  faCircleCheck,
  faCircleExclamation,
  faCircleXmark,
  faClock,
  faGraduationCap,
  faSchool,
  faSpinner,
  faEnvelope,
  faEye,
  faTrashCan,
  faUserGraduate,
  faUserPlus,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  CHILD_STATUS,
  LINK_STATUS,
  cancelFollowRequest,
  childHasApprovedClass,
  isLinkedChild,
  fetchChildrenStatuses,
  storeSelectedChild,
} from "../../../../services/parentChildrenService";
import { refreshParentAccessFlag, setParentAccessFlag } from "../../../../utils/parentAccess";

const STATUS_BADGE = {
  [CHILD_STATUS.APPROUVEE]: { label: "Acceptée", icon: faCircleCheck, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  [CHILD_STATUS.EN_ATTENTE]: { label: "En attente", icon: faClock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  [CHILD_STATUS.REJETEE]: { label: "Refusée", icon: faCircleXmark, cls: "bg-red-50 text-red-700 border-red-200" },
};

// Adult child not (yet) followed: follow request awaiting his professor's decision, or refused.
const LINK_BADGE = {
  [LINK_STATUS.EN_ATTENTE_VALIDATION_PROFESSEUR]: {
    label: "En attente de validation par le professeur",
    icon: faClock,
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    text: "Votre demande de suivi a été transmise au professeur de chaque classe. Vous suivrez une classe (lecture seule) dès que son professeur l'aura acceptée.",
  },
  [LINK_STATUS.REFUSE]: {
    label: "Demande de suivi refusée",
    icon: faCircleXmark,
    cls: "bg-red-50 text-red-700 border-red-200",
    text: "Le professeur a refusé votre demande de suivi.",
  },
};

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * « Mes enfants » — every child of the parent with the state of each class request
 * (GET /parents/{id}/enfants/statuts). It is the parent's landing page while none of his children is
 * accepted in a class (limited mode). « Ajouter un enfant » / « Rejoindre une autre classe » open AddChildModal.
 * tabData (notification CHILD_ACCESS_APPROVED / REJECTED): { childId, classId, outcome } highlights the child,
 * and selects it when the request was approved.
 */
const ParentChildrenList = ({ tabData }) => {
  const [children, setChildren] = useState([]);
  const [withStatuses, setWithStatuses] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [joinChild, setJoinChild] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const loadSeq = useRef(0);
  const handledNav = useRef(null);

  const loadChildren = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError("");
    try {
      const { children: list, withStatuses: ws } = await fetchChildrenStatuses();
      if (seq !== loadSeq.current) return list;
      setChildren(list);
      setWithStatuses(ws);
      // A child accepted somewhere unlocks the account; otherwise ask the backend (authoritative flag).
      if (ws && list.some(childHasApprovedClass)) setParentAccessFlag(true);
      else refreshParentAccessFlag();
      return list;
    } catch (err) {
      if (seq === loadSeq.current) setError(err?.message || "Erreur lors du chargement");
      return null;
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
    const reload = () => loadChildren();
    window.addEventListener("childrenUpdated", reload);
    return () => window.removeEventListener("childrenUpdated", reload);
  }, [loadChildren]);

  // Opened from a notification: highlight (and, when approved, select) the child concerned.
  useEffect(() => {
    if (!tabData || (!tabData.childId && !tabData.classId)) return;
    const navKey = tabData._nav || `${tabData.childId}-${tabData.classId}-${tabData.outcome}`;
    if (handledNav.current === navKey) return;
    handledNav.current = navKey;
    (async () => {
      const list = await loadChildren();
      if (!list) return;
      const wanted = tabData.outcome === "approved" ? CHILD_STATUS.APPROUVEE : tabData.outcome === "rejected" ? CHILD_STATUS.REJETEE : null;
      const child =
        (tabData.childId && list.find((c) => String(c.id) === String(tabData.childId))) ||
        (tabData.classId &&
          list.find((c) =>
            c.classes.some((k) => String(k.classeId) === String(tabData.classId) && (!wanted || k.statut === wanted)),
          )) ||
        null;
      if (!child) return;
      setHighlight(child.id);
      if ((tabData.outcome === "approved" || tabData.outcome === "linked") && childHasApprovedClass(child)) {
        setParentAccessFlag(true);
        storeSelectedChild(child);
        window.dispatchEvent(new Event("childChanged"));
        // Principal re-reads the children (selector) and keeps this one selected.
        window.dispatchEvent(new CustomEvent("childrenUpdated", { detail: { source: "notification" } }));
      }
      setTimeout(() => {
        document.getElementById(`child-card-${child.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    })();
  }, [tabData, loadChildren]);

  const handleRemoveChild = async () => {
    if (!confirmDelete) return;
    try {
      setDeleteLoading(true);
      const parentId = localStorage.getItem("userId");
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
      const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/parents/${parentId}/enfants/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de la suppression");
      }
      setConfirmDelete(null);
      window.dispatchEvent(new CustomEvent("childrenUpdated"));
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression");
      setConfirmDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // The parent cancels his own pending follow request (adult child).
  const handleCancelRequest = async () => {
    const demandeId = confirmCancel?.classe?.demandeSuiviId || confirmCancel?.child?.demandeLienId;
    if (!demandeId) return;
    try {
      setCancelLoading(true);
      await cancelFollowRequest(demandeId);
      window.dispatchEvent(new CustomEvent("childrenUpdated"));
    } catch (err) {
      setError(err?.message || "Impossible d'annuler la demande.");
      loadChildren();
    } finally {
      setConfirmCancel(null);
      setCancelLoading(false);
    }
  };

  const approvedCount = children.filter(childHasApprovedClass).length;
  const linkedChildren = children.filter(isLinkedChild);

  return (
    <div className="p-2 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
            <FontAwesomeIcon icon={faUsers} className="text-xl" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes enfants</h1>
            <p className="text-sm text-gray-500">
              {linkedChildren.length} enfant{linkedChildren.length > 1 ? "s" : ""}
              {withStatuses && children.length > 0 ? ` · ${approvedCount} accepté${approvedCount > 1 ? "s" : ""} dans une classe` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadChildren()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualiser"
            aria-label="Actualiser"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] hover:brightness-110 text-white rounded-lg font-semibold text-sm shadow"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            <span>Ajouter un enfant</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {error}
        </div>
      )}

      {loading && children.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin text-purple-600" />
        </div>
      ) : children.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-300">
            <FontAwesomeIcon icon={faUsers} className="text-4xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun enfant</h3>
          <p className="text-gray-500 mb-6 text-sm px-4">
            Ajoutez votre enfant avec le code de sa classe : le professeur validera la demande.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] text-white rounded-xl font-semibold flex items-center gap-2 mx-auto"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            Ajouter un enfant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => {
            const accepted = childHasApprovedClass(child);
            const linked = isLinkedChild(child);
            const linkBadge = linked ? null : LINK_BADGE[child.lienStatut] || LINK_BADGE[LINK_STATUS.EN_ATTENTE_VALIDATION_PROFESSEUR];
            return (
              <div
                key={child.id}
                id={`child-card-${child.id}`}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all ${
                  highlight === child.id ? "border-[#8C52FF] ring-4 ring-violet-200" : "border-gray-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                        accepted ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <FontAwesomeIcon icon={faGraduationCap} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {`${child.prenom} ${child.nom}`.trim() || child.email || "Enfant"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {child.niveau && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{child.niveau}</span>
                        )}
                        {child.majeur && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full">
                            <FontAwesomeIcon icon={faUserGraduate} /> Majeur
                          </span>
                        )}
                        {child.majeur && linked && (
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
                            title="Votre enfant a son propre compte : il rend lui-même ses devoirs. Vous suivez sa scolarité."
                          >
                            <FontAwesomeIcon icon={faEye} /> Lecture seule
                          </span>
                        )}
                      </div>
                      {child.majeur && child.email && (
                        <p className="mt-0.5 text-xs text-gray-400 truncate">
                          <FontAwesomeIcon icon={faEnvelope} className="mr-1" />
                          {child.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* An adult child's follow can only be removed by his professor or the administration. */}
                  {linked && !child.majeur && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(child)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    title="Retirer"
                    aria-label={`Retirer ${child.prenom} ${child.nom}`}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                  )}
                </div>

                {linkBadge && (
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${linkBadge.cls}`}>
                      <FontAwesomeIcon icon={linkBadge.icon} />
                      {linkBadge.label}
                    </span>
                    <p className="mt-2 text-xs text-gray-500">{linkBadge.text}</p>
                    {child.lienStatut === LINK_STATUS.REFUSE && child.motifRefusLien && (
                      <p className="mt-1 text-xs text-red-600">
                        <span className="font-semibold">Motif :</span> {child.motifRefusLien}
                      </p>
                    )}
                  </div>
                )}

                {withStatuses && (linked || child.classes.length > 0) && (
                  <ul className="space-y-2">
                    {child.classes.length === 0 && (
                      <li className="text-sm text-gray-500 italic">
                        {child.majeur ? "Aucune classe pour le moment." : "Aucune demande d'inscription en cours."}
                      </li>
                    )}
                    {child.classes.map((k) => {
                      const base = STATUS_BADGE[k.statut] || STATUS_BADGE[CHILD_STATUS.EN_ATTENTE];
                      // Adult child: each class is a follow request validated by that class's professor.
                      const badge =
                        child.majeur && k.statut === CHILD_STATUS.EN_ATTENTE
                          ? { ...base, label: "En attente de validation par le professeur" }
                          : child.majeur && k.statut === CHILD_STATUS.APPROUVEE
                            ? { ...base, label: "Suivi accepté" }
                            : base;
                      const date = formatDate(k.dateDemande);
                      return (
                        <li
                          key={`${k.classeId}-${k.dateDemande || ""}`}
                          className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm font-medium text-gray-800 min-w-0">
                              <FontAwesomeIcon icon={faSchool} className="text-gray-400" />
                              <span className="truncate">{k.classeNom || "Classe"}</span>
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                              <FontAwesomeIcon icon={badge.icon} />
                              {badge.label}
                            </span>
                          </div>
                          {date && <p className="mt-1 text-xs text-gray-400">Demande du {date}</p>}
                          {k.statut === CHILD_STATUS.REJETEE && k.motifRejet && (
                            <p className="mt-1 text-xs text-red-600">
                              <span className="font-semibold">Motif :</span> {k.motifRejet}
                            </p>
                          )}
                          {child.majeur && k.statut === CHILD_STATUS.EN_ATTENTE && k.demandeSuiviId && (
                            <button
                              type="button"
                              onClick={() => setConfirmCancel({ child, classe: k })}
                              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
                            >
                              <FontAwesomeIcon icon={faBan} />
                              Annuler la demande
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {linked && !child.majeur && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setJoinChild(child)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] hover:underline"
                    >
                      <FontAwesomeIcon icon={faSchool} />
                      Rejoindre une autre classe
                    </button>
                  </div>
                )}
                {child.majeur && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setJoinChild(child)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] hover:underline"
                    >
                      <FontAwesomeIcon icon={faSchool} />
                      Suivre une autre classe
                    </button>
                    {linked && (
                      <p className="mt-2 text-xs text-gray-500">
                        Votre enfant a son propre compte : c'est lui qui demande l'accès à une classe et rend ses devoirs.
                        Vous ne voyez que les classes dont le suivi a été accepté ; seuls le professeur ou
                        l'administration peuvent retirer un suivi.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddChildModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <AddChildModal isOpen={!!joinChild} child={joinChild} onClose={() => setJoinChild(null)} />

      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <FontAwesomeIcon icon={faBan} />
              </div>
              <h2 className="text-base font-bold text-gray-900">Annuler la demande de suivi ?</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Votre demande de suivi de{" "}
              {`${confirmCancel.child.prenom} ${confirmCancel.child.nom}`.trim() || confirmCancel.child.email || "votre enfant"}
              {confirmCancel.classe?.classeNom ? ` pour la classe « ${confirmCancel.classe.classeNom} »` : ""} ne sera plus
              proposée au professeur. Vous pourrez en envoyer une nouvelle plus tard.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmCancel(null)}
                disabled={cancelLoading}
                className="flex-1 py-2.5 text-gray-600 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleCancelRequest}
                disabled={cancelLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={cancelLoading ? faSpinner : faBan} spin={cancelLoading} />
                Annuler la demande
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <FontAwesomeIcon icon={faTrashCan} />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Retirer {`${confirmDelete.prenom} ${confirmDelete.nom}`.trim() || "cet enfant"} ?
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Cet enfant sera retiré de votre compte. Cette action ne supprime pas son profil.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 text-gray-600 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleRemoveChild}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={deleteLoading ? faSpinner : faTrashCan} spin={deleteLoading} />
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentChildrenList;
