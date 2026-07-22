import React, { useEffect, useRef, useState } from "react";
import { RefreshCw, ArrowUpCircle, AlertCircle, CheckCircle, X, ShieldAlert, Wrench } from "lucide-react";
import { contratService } from "../../../../services/ContratService";
import { offerService, PeriodiciteContrat, TypeCibleOffre } from "../../../../services/OfferService";
import PaymentModal from "../../../../components/modals/PaymentModal";
import { useAuth } from "../../../../hooks/useAuth";

/**
 * Panneau "Offre / Forfait actuel" — Classe ou Établissement.
 * @param {"CLASSE"|"ETABLISSEMENT"} type
 * @param {string} entityId
 * @param {boolean} isDark
 */
const OffreInfoPanel = ({ type, entityId, isDark }) => {
  const { isAdmin } = useAuth();
  const [contrat, setContrat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAction, setShowAction] = useState(null); // "prolonger" | "changer" | "admin"
  const [showPayment, setShowPayment] = useState(false);
  const [offresDisponibles, setOffresDisponibles] = useState([]);
  const [nouvelleOffreId, setNouvelleOffreId] = useState("");
  const [periodicite, setPeriodicite] = useState(PeriodiciteContrat.MENSUEL);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [showExpiredPopup, setShowExpiredPopup] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const alertedRef = useRef(false);

  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textMain = isDark ? "text-gray-100" : "text-gray-900";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const border = isDark ? "border-gray-700" : "border-gray-200";
  const inputBg = isDark ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900";
  const modalBg = isDark ? "bg-gray-800" : "bg-white";

  const chargerContrat = async () => {
    if (!entityId) return;
    setLoading(true);
    setError("");
    try {
      const data = type === "ETABLISSEMENT"
        ? await contratService.obtenirContratEtablissement(entityId)
        : await contratService.obtenirContratClasse(entityId);
      setContrat(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setContrat(null);
      } else {
        setError("Impossible de charger les informations de l'offre.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    alertedRef.current = false;
    chargerContrat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, entityId]);

  // Popup contextuel : affiché une seule fois, au moment où l'utilisateur ouvre CETTE classe/cet
  // établissement précis(e) si son offre est expirée — pas au login (voir Login.jsx / AuthBusiness).
  // Si la suppression définitive est imminente (délai configuré par l'admin sur l'offre), on
  // affiche la variante urgente plutôt que le simple avertissement d'expiration.
  useEffect(() => {
    if (contrat && contrat.statut === "EXPIRE" && !alertedRef.current) {
      alertedRef.current = true;
      setShowExpiredPopup(true);
    }
  }, [contrat]);

  const ouvrirAction = async (action) => {
    setShowAction(action);
    setActionError("");
    setActionSuccess("");
    setNouvelleOffreId("");
    setPeriodicite(contrat?.periodicite || PeriodiciteContrat.MENSUEL);
    if (action === "changer" || action === "admin") {
      try {
        const cible = type === "ETABLISSEMENT" ? TypeCibleOffre.ETABLISSEMENT : TypeCibleOffre.CLASSE;
        const data = await offerService.obtenirOffresActives(cible);
        setOffresDisponibles(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    }
  };

  const handleAssignerParAdmin = async () => {
    if (!nouvelleOffreId) { setActionError("Veuillez sélectionner une offre."); return; }
    setActionError("");
    setAdminSaving(true);
    try {
      const payload = { nouvelleOffreId, periodicite };
      if (type === "ETABLISSEMENT") await contratService.assignerOffreEtablissementParAdmin(entityId, payload);
      else await contratService.assignerOffreClasseParAdmin(entityId, payload);
      setActionSuccess("Offre attribuée avec succès !");
      await chargerContrat();
      setTimeout(() => { setShowAction(null); setActionSuccess(""); }, 1800);
    } catch (err) {
      setActionError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setAdminSaving(false);
    }
  };

  const offreCible = offresDisponibles.find((o) => o.id === nouvelleOffreId) || null;
  const montant = (showAction === "changer" || showAction === "admin") && offreCible
    ? Number(periodicite === PeriodiciteContrat.ANNUEL ? offreCible.prixAnnuel : offreCible.prixMensuel) || 0
    : contrat
    ? Number(periodicite === PeriodiciteContrat.ANNUEL ? contrat.prixAnnuel : contrat.prixMensuel) || 0
    : 0;

  const offreLabelPaiement = (showAction === "changer" || showAction === "admin") ? (offreCible?.nom || "Nouvelle offre") : (contrat?.offreNom || "Offre");

  const handlePaymentSuccess = async (paymentInfo) => {
    setActionError("");
    try {
      const payload = {
        nouvelleOffreId: showAction === "changer" ? nouvelleOffreId : null,
        periodicite,
        paymentInfo,
      };
      if (type === "ETABLISSEMENT") {
        if (showAction === "changer") await contratService.changerOffreEtablissement(entityId, payload);
        else await contratService.prolongerContratEtablissement(entityId, payload);
      } else if (showAction === "changer") {
        await contratService.changerOffreClasse(entityId, payload);
      } else {
        await contratService.prolongerContratClasse(entityId, payload);
      }
      setShowPayment(false);
      setActionSuccess("Offre activée avec succès !");
      await chargerContrat();
      setTimeout(() => { setShowAction(null); setActionSuccess(""); }, 1800);
    } catch (err) {
      setShowPayment(false);
      setActionError(err.response?.data?.message || "Une erreur est survenue.");
    }
  };

  if (loading) return (
    <div className={`rounded-2xl border p-4 ${cardBg} ${textMuted} text-sm animate-pulse`}>Chargement de l'offre...</div>
  );

  const estExpire = contrat?.statut === "EXPIRE";
  const estActif = contrat?.statut === "ACTIF";

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${cardBg}`}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className={`font-semibold text-sm sm:text-base ${textMain}`}>Offre / Forfait actuel</h3>
        {contrat && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            estActif ? "bg-green-100 text-green-700" : estExpire ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"
          }`}>
            {contrat.statut}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {!contrat && !error && (
        <p className={`text-sm ${textMuted}`}>Aucune offre associée pour le moment.</p>
      )}

      {contrat && (
        <div className={`text-sm space-y-1.5 ${textMuted}`}>
          <div className="flex justify-between gap-2">
            <span>Offre</span>
            <span className={`font-medium text-right ${textMain}`}>{contrat.offreNom}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Périodicité</span>
            <span className={`font-medium ${textMain}`}>{contrat.periodicite === "MENSUEL" ? "Mensuelle" : "Annuelle"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Montant</span>
            <span className={`font-medium ${textMain}`}>{Number(contrat.prixPaye || 0).toLocaleString("fr-FR")} FCFA</span>
          </div>
          {contrat.dateFin && (
            <div className="flex justify-between gap-2">
              <span>Valide jusqu'au</span>
              <span className={`font-medium ${textMain}`}>{new Date(contrat.dateFin).toLocaleDateString("fr-FR")}</span>
            </div>
          )}
          {contrat.classesMax != null && (
            <div className="flex justify-between gap-2">
              <span>Classes</span>
              <span className={`font-medium ${contrat.classesUtilisees >= contrat.classesMax ? "text-red-600" : textMain}`}>
                {contrat.classesUtilisees ?? 0} / {contrat.classesMax}
              </span>
            </div>
          )}
          {contrat.elevesMax != null && (
            <div className="flex justify-between gap-2">
              <span>Élèves max</span>
              <span className={`font-medium ${textMain}`}>{contrat.elevesMax}</span>
            </div>
          )}
          {contrat.stockageMax != null && (
            <div className="flex justify-between gap-2">
              <span>Stockage</span>
              <span className={`font-medium ${textMain}`}>{contrat.stockageMax} Go</span>
            </div>
          )}
          {contrat.messagerie != null && (
            <div className="flex justify-between gap-2">
              <span>Messagerie</span>
              <span className={`font-medium ${textMain}`}>{contrat.messagerie ? "Incluse" : "Non incluse"}</span>
            </div>
          )}
        </div>
      )}

      {contrat?.suppressionImminente && contrat.dateSuppressionPrevue && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-800 bg-red-100 border border-red-300 rounded-lg p-2.5">
          <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            Suppression définitive prévue le{" "}
            <strong>{new Date(contrat.dateSuppressionPrevue).toLocaleString("fr-FR")}</strong> si l'offre n'est pas renouvelée.
          </span>
        </div>
      )}

      {estExpire && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
          <AlertCircle size={15} className="flex-shrink-0" /> Offre expirée — renouvelez pour réactiver.
        </div>
      )}

      {contrat && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button onClick={() => ouvrirAction("prolonger")}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white font-medium">
            <RefreshCw size={14} /> Prolonger
          </button>
          <button onClick={() => ouvrirAction("changer")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 text-sm rounded-xl border font-medium active:scale-[0.98] transition-all ${
              isDark ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}>
            <ArrowUpCircle size={14} /> Changer d'offre
          </button>
        </div>
      )}

      {isAdmin && (
        <button onClick={() => ouvrirAction("admin")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 text-sm rounded-xl border border-dashed font-medium mt-2 w-full active:scale-[0.98] transition-all ${
            isDark ? "border-purple-500 text-purple-300 hover:bg-purple-500/10" : "border-purple-400 text-purple-700 hover:bg-purple-50"
          }`}>
          <Wrench size={14} /> Attribuer une offre (admin, sans paiement)
        </button>
      )}

      {/* Popup contextuel d'offre expirée, affiché à l'ouverture de cette classe/cet établissement */}
      {showExpiredPopup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full sm:max-w-sm max-h-[85vh] overflow-y-auto ${modalBg} rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 text-center`}>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h4 className={`font-bold ${textMain} mb-1`}>Offre expirée</h4>
            <p className={`text-sm ${textMuted} mb-5`}>
              Le forfait de {type === "ETABLISSEMENT" ? "cet établissement" : "cette classe"} a expiré
              {contrat?.offreNom ? ` (${contrat.offreNom})` : ""}. Renouvelez-le pour réactiver l'accès.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExpiredPopup(false)}
                className={`flex-1 py-2.5 rounded-xl border font-medium ${isDark ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                Fermer
              </button>
              <button
                onClick={() => { setShowExpiredPopup(false); ouvrirAction("prolonger"); }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Renouveler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sélection offre / périodicité (étape 1) */}
      {showAction && !showPayment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full sm:max-w-sm max-h-[92vh] overflow-y-auto ${modalBg} rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6`}>
            <div className="sm:hidden flex justify-center -mt-1 mb-2">
              <div className={`h-1.5 w-10 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
            </div>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`font-semibold ${textMain}`}>
                {showAction === "changer" ? "Changer d'offre" : showAction === "admin" ? "Attribuer une offre (admin)" : "Prolonger l'offre"}
              </h4>
              <button onClick={() => setShowAction(null)} className={textMuted}>
                <X size={18} />
              </button>
            </div>

            {showAction === "admin" && (
              <div className="mb-4 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-xl p-2.5">
                <Wrench size={14} className="flex-shrink-0" /> Attribution directe, sans passer par le paiement — réservé aux admins.
              </div>
            )}

            {actionError && (
              <div className="mb-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5">
                <AlertCircle size={15} className="flex-shrink-0" /> {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="mb-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-2.5">
                <CheckCircle size={15} className="flex-shrink-0" /> {actionSuccess}
              </div>
            )}

            {(showAction === "changer" || showAction === "admin") && (
              <div className="mb-4">
                <label className={`block text-sm font-medium ${textMuted} mb-1.5`}>{showAction === "admin" ? "Offre à attribuer" : "Nouvelle offre"}</label>
                <select value={nouvelleOffreId} onChange={(e) => setNouvelleOffreId(e.target.value)}
                  className={`w-full px-3.5 py-3 text-[16px] border rounded-xl ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                  <option value="">Choisir une offre...</option>
                  {offresDisponibles.map((o) => {
                    const prix = o.prixMensuel != null
                      ? `${Number(o.prixMensuel).toLocaleString("fr-FR")} FCFA/mois`
                      : o.prixAnnuel != null ? `${Number(o.prixAnnuel).toLocaleString("fr-FR")} FCFA/an` : "";
                    return (
                      <option key={o.id} value={o.id}>{o.nom}{prix ? ` — ${prix}` : ""}</option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="mb-5">
              <label className={`block text-sm font-medium ${textMuted} mb-1.5`}>Périodicité</label>
              <div className="flex gap-2">
                {[["MENSUEL", "Mensuel"], ["ANNUEL", "Annuel"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setPeriodicite(val)}
                    className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      periodicite === val
                        ? "bg-blue-600 border-blue-600 text-white"
                        : isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              {montant > 0 && (
                <p className={`mt-2 text-sm ${textMuted}`}>Montant : <strong className={textMain}>{montant.toLocaleString("fr-FR")} FCFA</strong></p>
              )}
            </div>

            {showAction === "admin" ? (
              <button
                type="button"
                onClick={handleAssignerParAdmin}
                disabled={adminSaving || !nouvelleOffreId}
                className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Wrench size={16} />
                {adminSaving ? "Attribution..." : "Attribuer l'offre (sans paiement)"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (showAction === "changer" && !nouvelleOffreId) { setActionError("Veuillez sélectionner une offre."); return; }
                  setActionError("");
                  setShowPayment(true);
                }}
                disabled={montant <= 0}
                className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                Continuer vers le paiement
              </button>
            )}
          </div>
        </div>
      )}

      {/* Paiement (étape 2) */}
      <PaymentModal
        isOpen={showAction != null && showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        montant={montant}
        label={offreLabelPaiement}
        subLabel={periodicite === "ANNUEL" ? "Périodicité annuelle" : "Périodicité mensuelle"}
        isDark={isDark}
      />
    </div>
  );
};

export default OffreInfoPanel;
