import React from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChalkboardUser,
  faEnvelopeOpenText,
  faHouse,
  faLaptop,
  faMobileScreenButton,
  faUnlockKeyhole,
} from "@fortawesome/free-solid-svg-icons";
import { AuthShell, BrandLogo, Button } from "../components/frontoffice/ui";
import { StoreBadges } from "../components/frontoffice/StoreBadges";
import accountCreated from "../assets/illustrations/account-created.png";
import accountCreatedDark from "../assets/illustrations/account-created-dark.png";

/**
 * "Compte créé avec succès / en attente d'approbation" — shown after a parent / élève sign-up with
 * a class code (POST /utilisateurs → statutInscription EN_ATTENTE_APPROBATION_CLASSE).
 * Router state: { email, classeNom, role }.
 */
const AccountCreated = ({ theme }) => {
  const { state } = useLocation();
  const email = state?.email;
  const classeNom = state?.classeNom;
  const isParent = state?.role === "parent";

  const steps = [
    {
      icon: faChalkboardUser,
      title: "Approbation du professeur",
      text: classeNom
        ? `Le professeur de la classe « ${classeNom} » doit approuver votre demande.`
        : "Le professeur de la classe doit approuver votre demande.",
    },
    {
      icon: faEnvelopeOpenText,
      title: "E-mail avec vos identifiants",
      text: `Dès l'approbation, vous recevrez un e-mail${email ? ` à ${email}` : ""} avec votre identifiant (votre adresse e-mail) et un mot de passe temporaire.`,
    },
    {
      icon: faUnlockKeyhole,
      title: "Première connexion",
      text: isParent
        ? "Connectez-vous, choisissez votre mot de passe personnel, puis ajoutez votre ou vos enfants pour suivre leur scolarité."
        : "Connectez-vous avec ce mot de passe temporaire : vous choisirez alors votre mot de passe personnel.",
    },
  ];

  return (
    <AuthShell
      theme={theme}
      illustration={theme === "dark" ? accountCreatedDark : accountCreated}
      illustrationAlt="Compte créé avec succès"
    >
      <div className="max-w-lg mx-auto">
        <BrandLogo className="mb-6" />
        <img
          src={theme === "dark" ? accountCreatedDark : accountCreated}
          alt=""
          className="lg:hidden w-48 mx-auto mb-4"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Compte créé avec succès !</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Votre compte a été créé et est maintenant <strong className="text-[#F59E0B]">en attente d'approbation</strong>
          {classeNom ? (
            <>
              {" "}
              pour la classe <strong className="text-slate-800 dark:text-slate-100">{classeNom}</strong>
            </>
          ) : null}
          .
        </p>

        <ol className="mt-8 space-y-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-[#4F46E5] dark:text-indigo-300 flex items-center justify-center">
                <FontAwesomeIcon icon={s.icon} />
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {i + 1}. {s.title}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <FontAwesomeIcon icon={faLaptop} className="text-[#4F46E5]" />
            <FontAwesomeIcon icon={faMobileScreenButton} className="text-[#4F46E5]" />
            Vos identifiants fonctionnent sur le site web et sur l'application mobile ScholChat.
          </p>
          <StoreBadges compact className="mt-3" />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Vous ne trouvez pas l'e-mail après l'approbation ? Vérifiez votre dossier Spam.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button to="/schoolchat/login" icon={faArrowRight} className="sm:flex-1">
            Aller à la connexion
          </Button>
          <Button to="/" variant="secondary" className="sm:flex-1">
            <FontAwesomeIcon icon={faHouse} /> Retour à l'accueil
          </Button>
        </div>
      </div>
    </AuthShell>
  );
};

export default AccountCreated;
