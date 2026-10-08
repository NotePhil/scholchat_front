import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faCircleCheck,
  faCreditCard,
  faEnvelope,
  faEnvelopeCircleCheck,
  faHashtag,
  faPaperPlane,
  faSchool,
  faChalkboardUser,
} from "@fortawesome/free-solid-svg-icons";
import { contratService } from "../services/ContratService";
import { PeriodiciteContrat } from "../services/OfferService";
import PaymentModal from "../components/modals/PaymentModal";
import { Alert, AuthShell, BrandLogo, BRAND_GRADIENT, Button, TextField } from "../components/frontoffice/ui";

/**
 * Page de renouvellement d'offre, accessible SANS connexion (lien "Renouveler mon compte" de la
 * page de connexion quand l'offre a expiré). Deux modes :
 *  - Sans ?token= : formulaire (email + ID classe/établissement) -> envoie un email contenant un
 *    lien sécurisé (voir ContratBusiness.demanderLienRenouvellement côté backend).
 *  - Avec ?token= (lien reçu par email) : affiche l'offre courante et permet de la prolonger ou
 *    d'en changer, avec un paiement simulé.
 */

/** Two-option segmented control in the front-office style. */
const Segmented = ({ options, value, onChange, label }) => (
  <div>
    {label && <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</p>}
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1" role="radiogroup" aria-label={label}>
      {options.map(([val, text, icon]) => {
        const active = value === val;
        return (
          <button
            key={val}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(val)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
              active
                ? "bg-white dark:bg-slate-700 text-[#4F46E5] dark:text-indigo-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {icon && <FontAwesomeIcon icon={icon} />}
            {text}
          </button>
        );
      })}
    </div>
  </div>
);

const HeaderIcon = ({ icon }) => (
  <div className="flex justify-center mb-6">
    <span className={`w-20 h-20 rounded-full ${BRAND_GRADIENT} text-white flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/30`}>
      <FontAwesomeIcon icon={icon} />
    </span>
  </div>
);

const BackToLogin = () => (
  <div className="mt-8 text-center">
    <Link
      to="/schoolchat/login"
      className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] dark:text-indigo-300 hover:underline"
    >
      <FontAwesomeIcon icon={faArrowLeft} /> Retour à la connexion
    </Link>
  </div>
);

const RenewalPage = ({ theme }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  return (
    <AuthShell theme={theme}>
      <div className="max-w-md mx-auto">
        <BrandLogo className="mb-8" />
        {token ? <RenewalWithToken token={token} theme={theme} /> : <RenewalRequestForm />}
        <BackToLogin />
      </div>
    </AuthShell>
  );
};

const RenewalRequestForm = () => {
  const [form, setForm] = useState({ email: "", classeId: "", etablissementId: "" });
  const [entityType, setEntityType] = useState("CLASSE");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const isClasse = entityType === "CLASSE";
  const identifiant = isClasse ? form.classeId : form.etablissementId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }
    if (!identifiant.trim()) {
      setError(isClasse ? "Veuillez saisir l'identifiant de votre classe." : "Veuillez saisir l'identifiant de votre établissement.");
      return;
    }
    setLoading(true);
    try {
      await contratService.demanderLienRenouvellement({
        email: form.email.trim(),
        classeId: isClasse ? form.classeId.trim() : undefined,
        etablissementId: !isClasse ? form.etablissementId.trim() : undefined,
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
      <>
        <HeaderIcon icon={faEnvelopeCircleCheck} />
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">Demande envoyée</h1>
        <p className="mt-3 text-center text-slate-500 dark:text-slate-400">
          Si les informations correspondent à un compte existant, un e-mail contenant un lien sécurisé de
          renouvellement vient d'être envoyé à <strong className="text-slate-700 dark:text-slate-200">{form.email.trim()}</strong>.
        </p>
        <Alert type="info" className="mt-6">
          Pensez à vérifier vos courriers indésirables. Le lien vous permettra de prolonger votre offre ou d'en choisir une autre.
        </Alert>
        <Button variant="secondary" className="w-full mt-6" onClick={() => setSent(false)}>
          Utiliser d'autres informations
        </Button>
      </>
    );
  }

  return (
    <>
      <HeaderIcon icon={faArrowsRotate} />
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">Renouveler mon compte</h1>
      <p className="mt-2 text-center text-slate-500 dark:text-slate-400">
        Votre offre a expiré ? Renseignez votre e-mail et l'identifiant de votre classe ou établissement : vous
        recevrez un lien sécurisé pour la renouveler.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        <TextField
          label="Adresse e-mail"
          required
          type="email"
          name="email"
          icon={faEnvelope}
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="exemple@email.com"
          autoComplete="email"
        />
        <Segmented
          label="Renouveler pour"
          value={entityType}
          onChange={setEntityType}
          options={[
            ["CLASSE", "Une classe", faChalkboardUser],
            ["ETABLISSEMENT", "Un établissement", faSchool],
          ]}
        />
        <TextField
          label={isClasse ? "Identifiant de la classe" : "Identifiant de l'établissement"}
          required
          name="identifiant"
          icon={faHashtag}
          value={identifiant}
          onChange={(e) =>
            setForm((p) => (isClasse ? { ...p, classeId: e.target.value } : { ...p, etablissementId: e.target.value }))
          }
          placeholder={isClasse ? "Identifiant indiqué dans l'e-mail d'expiration" : "Identifiant de votre établissement"}
          hint="Vous le trouverez dans l'e-mail vous informant de l'expiration de l'offre."
        />
        <Button type="submit" className="w-full" loading={loading} loadingLabel="Envoi en cours…" icon={faPaperPlane}>
          Envoyer le lien de renouvellement
        </Button>
      </form>
    </>
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
  const montant =
    action === "changer" && offreCible
      ? Number(periodicite === PeriodiciteContrat.ANNUEL ? offreCible.prixAnnuel : offreCible.prixMensuel) || 0
      : statut?.contratCourant
        ? Number(
            periodicite === PeriodiciteContrat.ANNUEL ? statut.contratCourant.prixAnnuel : statut.contratCourant.prixMensuel,
          ) || 0
        : 0;

  const handlePaymentSuccess = async (paymentInfo) => {
    setPayError("");
    try {
      const payload = { nouvelleOffreId: action === "changer" ? nouvelleOffreId : null, periodicite, paymentInfo };
      if (action === "changer") await contratService.changerOffreParToken(token, payload);
      else await contratService.prolongerParToken(token, payload);
      setShowPayment(false);
      setSuccess(true);
    } catch (err) {
      setShowPayment(false);
      setPayError(err.response?.data?.message || "Une erreur est survenue lors du renouvellement.");
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-slate-400">
        <span className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-[#4F46E5] rounded-full animate-spin" />
        <p className="mt-3 text-sm">Chargement de votre offre…</p>
      </div>
    );
  }

  if (error && !statut) {
    return (
      <>
        <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-4">Lien invalide</h1>
        <Alert type="error">{error}</Alert>
        <Button to="/schoolchat/renouveler-offre" className="w-full mt-6" icon={faArrowsRotate}>
          Refaire une demande
        </Button>
      </>
    );
  }

  if (success) {
    return (
      <>
        <HeaderIcon icon={faCircleCheck} />
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">Offre activée !</h1>
        <p className="mt-3 text-center text-slate-500 dark:text-slate-400">
          Votre offre a été renouvelée avec succès. Vous pouvez maintenant vous connecter.
        </p>
        <Button to="/schoolchat/login" className="w-full mt-6">
          Se connecter
        </Button>
      </>
    );
  }

  const contrat = statut?.contratCourant;
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">Renouvellement</h1>
      {statut?.nom && <p className="mt-1 text-center text-slate-500 dark:text-slate-400">{statut.nom}</p>}

      <div className="mt-8 space-y-5">
        {contrat && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5 space-y-2.5 text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">Offre actuelle</p>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Forfait</span>
              <strong className="text-slate-800 dark:text-slate-100">{contrat.offreNom}</strong>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Statut</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  contrat.statut === "ACTIF"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                }`}
              >
                {contrat.statut}
              </span>
            </div>
            {contrat.dateFin && (
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Expire le</span>
                <span className="text-slate-800 dark:text-slate-100">{new Date(contrat.dateFin).toLocaleDateString("fr-FR")}</span>
              </div>
            )}
            {contrat.classesMax != null && (
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Classes</span>
                <span className="text-slate-800 dark:text-slate-100">
                  {contrat.classesUtilisees ?? 0} / {contrat.classesMax}
                </span>
              </div>
            )}
          </div>
        )}

        {payError && <Alert type="error">{payError}</Alert>}

        <Segmented
          label="Que souhaitez-vous faire ?"
          value={action}
          onChange={(val) => {
            setAction(val);
            setNouvelleOffreId("");
          }}
          options={[
            ["prolonger", "Prolonger"],
            ["changer", "Changer d'offre"],
          ]}
        />

        {action === "changer" && (
          <div>
            <label htmlFor="nouvelleOffre" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nouvelle offre <span className="text-[#EF4444]">*</span>
            </label>
            <select
              id="nouvelleOffre"
              value={nouvelleOffreId}
              onChange={(e) => setNouvelleOffreId(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm sm:text-base text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-[#4F46E5]"
            >
              <option value="">Choisir une offre…</option>
              {(statut?.offresDisponibles || []).map((o) => {
                const prix =
                  o.prixMensuel != null
                    ? `${Number(o.prixMensuel).toLocaleString("fr-FR")} FCFA/mois`
                    : o.prixAnnuel != null
                      ? `${Number(o.prixAnnuel).toLocaleString("fr-FR")} FCFA/an`
                      : "";
                return (
                  <option key={o.id} value={o.id}>
                    {o.nom}
                    {prix ? ` — ${prix}` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <Segmented
          label="Périodicité"
          value={periodicite}
          onChange={setPeriodicite}
          options={[
            ["MENSUEL", "Mensuel"],
            ["ANNUEL", "Annuel"],
          ]}
        />

        {montant > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3">
            <span className="text-sm text-slate-600 dark:text-slate-300">Montant à payer</span>
            <strong className="text-lg text-slate-900 dark:text-white">{montant.toLocaleString("fr-FR")} FCFA</strong>
          </div>
        )}

        <Button
          className="w-full"
          icon={faCreditCard}
          disabled={montant <= 0}
          onClick={() => {
            if (action === "changer" && !nouvelleOffreId) {
              setPayError("Veuillez sélectionner une offre.");
              return;
            }
            setPayError("");
            setShowPayment(true);
          }}
        >
          Procéder au paiement
        </Button>
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        montant={montant}
        label={action === "changer" ? offreCible?.nom || "Nouvelle offre" : contrat?.offreNom || "Renouvellement"}
        subLabel={periodicite === "ANNUEL" ? "Périodicité annuelle" : "Périodicité mensuelle"}
        isDark={theme === "dark"}
      />
    </>
  );
};

export default RenewalPage;
