import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, CreditCard, ArrowLeft } from "lucide-react";
import { contratService } from "../services/ContratService";
import { PeriodiciteContrat } from "../services/OfferService";
import PaymentModal from "../components/modals/PaymentModal";

/**
 * Page de renouvellement d'offre, accessible SANS connexion (voir SignUp.jsx : lien "Renouveler
 * mon compte"). Deux modes :
 *  - Sans ?token= : formulaire (email + ID classe/établissement) -> envoie un email contenant un
 *    lien sécurisé (voir ContratBusiness.demanderLienRenouvellement côté backend).
 *  - Avec ?token= (lien reçu par email) : affiche l'offre courante et permet de la prolonger ou
 *    d'en changer, avec un paiement simulé.
 */
const RenewalPage = ({ theme }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className={`min-h-screen flex items-center justify-center py-8 sm:py-12 px-4 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate("/schoolchat/login")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-4"
        >
          <ArrowLeft size={16} /> Retour à la connexion
        </button>
        {token ? <RenewalWithToken token={token} theme={theme} /> : <RenewalRequestForm />}
      </div>
    </div>
  );
};

const RenewalRequestForm = () => {
  const [form, setForm] = useState({ email: "", classeId: "", etablissementId: "" });
  const [entityType, setEntityType] = useState("CLASSE");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || (!form.classeId.trim() && !form.etablissementId.trim())) {
      setError("Merci de renseigner votre email et l'identifiant de votre classe ou établissement.");
      return;
    }
    setLoading(true);
    try {
      await contratService.demanderLienRenouvellement({
        email: form.email.trim(),
        classeId: entityType === "CLASSE" ? form.classeId.trim() : undefined,
        etablissementId: entityType === "ETABLISSEMENT" ? form.etablissementId.trim() : undefined,
      });
      setSent(true);
    } catch {
      setSent(true); // anti-enumeration
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Demande envoyée</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Si les informations correspondent à un compte existant, un email contenant un lien de renouvellement
          vient de vous être envoyé.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">Renouveler mon compte</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Renseignez votre email et l'identifiant de votre classe ou établissement. Vous recevrez un lien sécurisé.
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input type="email" value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full px-4 py-3 text-[16px] border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
          <div className="flex gap-2">
            {[["CLASSE", "ID de classe"], ["ETABLISSEMENT", "ID d'établissement"]].map(([val, label]) => (
              <button key={val} type="button" onClick={() => setEntityType(val)}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  entityType === val ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {entityType === "CLASSE" ? "Identifiant de la classe" : "Identifiant de l'établissement"}
          </label>
          <input type="text"
            value={entityType === "CLASSE" ? form.classeId : form.etablissementId}
            onChange={(e) => setForm((p) => (entityType === "CLASSE" ? { ...p, classeId: e.target.value } : { ...p, etablissementId: e.target.value }))}
            className="w-full px-4 py-3 text-[16px] border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold disabled:opacity-60 active:scale-[0.98] transition-all">
          {loading ? "Envoi en cours..." : "Envoyer le lien de renouvellement"}
        </button>
      </form>
    </motion.div>
  );
};

const RenewalWithToken = ({ token, theme }) => {
  const [statut, setStatut] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("prolonger");
  const [nouvelleOffreId, setNouvelleOffreId] = useState("");
  const [periodicite, setPeriodicite] = useState(PeriodiciteContrat.MENSUEL);
  const [success, setSuccess] = useState(false);
  const [payError, setPayError] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const charger = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await contratService.obtenirStatutRenouvellement(token);
        setStatut(data);
        if (data?.contratCourant?.periodicite) setPeriodicite(data.contratCourant.periodicite);
      } catch {
        setError("Ce lien de renouvellement est invalide ou a expiré. Merci de refaire une demande.");
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [token]);

  const offreCible = (statut?.offresDisponibles || []).find((o) => o.id === nouvelleOffreId) || null;
  const montant = action === "changer" && offreCible
    ? Number(periodicite === PeriodiciteContrat.ANNUEL ? offreCible.prixAnnuel : offreCible.prixMensuel) || 0
    : statut?.contratCourant
    ? Number(periodicite === PeriodiciteContrat.ANNUEL ? statut.contratCourant.prixAnnuel : statut.contratCourant.prixMensuel) || 0
    : 0;

  const handlePaymentSuccess = async (paymentInfo) => {
    setPayError("");
    try {
      const payload = {
        nouvelleOffreId: action === "changer" ? nouvelleOffreId : null,
        periodicite,
        paymentInfo,
      };
      if (action === "changer") await contratService.changerOffreParToken(token, payload);
      else await contratService.prolongerParToken(token, payload);
      setShowPayment(false);
      setSuccess(true);
    } catch (err) {
      setShowPayment(false);
      setPayError(err.response?.data?.message || "Une erreur est survenue lors du renouvellement.");
    }
  };

  if (loading) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center text-gray-500 animate-pulse">Chargement...</div>
  );

  if (error && !statut) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-9 h-9 text-red-600" />
      </div>
      <p className="text-gray-700 dark:text-gray-300">{error}</p>
    </div>
  );

  if (success) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-9 h-9 text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Offre activée !</h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Votre offre a été renouvelée avec succès. Vous pouvez maintenant vous connecter.
      </p>
    </div>
  );

  const contrat = statut?.contratCourant;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Renouvellement — {statut?.nom}</h2>
      </div>

      {contrat && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2 text-sm">
          <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Offre actuelle</p>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Forfait</span><strong className="text-gray-800 dark:text-gray-100">{contrat.offreNom}</strong>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Statut</span>
            <span className={`font-semibold ${contrat.statut === "ACTIF" ? "text-green-600" : "text-red-600"}`}>{contrat.statut}</span>
          </div>
          {contrat.dateFin && (
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Expire le</span><span>{new Date(contrat.dateFin).toLocaleDateString("fr-FR")}</span>
            </div>
          )}
          {contrat.classesMax != null && (
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Classes</span><span>{contrat.classesUtilisees ?? 0} / {contrat.classesMax}</span>
            </div>
          )}
        </div>
      )}

      {payError && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={16} className="flex-shrink-0" /> {payError}
        </div>
      )}

      <div className="flex gap-2">
        {[["prolonger", "Prolonger la même offre"], ["changer", "Changer d'offre"]].map(([val, label]) => (
          <button key={val} type="button" onClick={() => { setAction(val); setNouvelleOffreId(""); }}
            className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              action === val ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {action === "changer" && (
        <select value={nouvelleOffreId} onChange={(e) => setNouvelleOffreId(e.target.value)}
          className="w-full px-3.5 py-3 text-[16px] border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Choisir une offre...</option>
          {(statut?.offresDisponibles || []).map((o) => {
            const prix = o.prixMensuel != null
              ? `${Number(o.prixMensuel).toLocaleString("fr-FR")} FCFA/mois`
              : o.prixAnnuel != null ? `${Number(o.prixAnnuel).toLocaleString("fr-FR")} FCFA/an` : "";
            return <option key={o.id} value={o.id}>{o.nom}{prix ? ` — ${prix}` : ""}</option>;
          })}
        </select>
      )}

      <div className="flex gap-2">
        {[["MENSUEL", "Mensuel"], ["ANNUEL", "Annuel"]].map(([val, label]) => (
          <button key={val} type="button" onClick={() => setPeriodicite(val)}
            className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              periodicite === val ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {montant > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Montant : <strong className="text-gray-900 dark:text-white">{montant.toLocaleString("fr-FR")} FCFA</strong>
        </p>
      )}

      <button
        onClick={() => {
          if (action === "changer" && !nouvelleOffreId) { setPayError("Veuillez sélectionner une offre."); return; }
          setPayError("");
          setShowPayment(true);
        }}
        disabled={montant <= 0}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        <CreditCard size={18} />
        Procéder au paiement
      </button>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        montant={montant}
        label={action === "changer" ? (offreCible?.nom || "Nouvelle offre") : (contrat?.offreNom || "Renouvellement")}
        subLabel={periodicite === "ANNUEL" ? "Périodicité annuelle" : "Périodicité mensuelle"}
        isDark={theme === "dark"}
      />
    </div>
  );
};

export default RenewalPage;
