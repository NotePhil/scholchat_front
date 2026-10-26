import React from "react";
import { faArrowRight, faCompass, faHouse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthShell, BrandLogo, Button, StatusIcon } from "../components/frontoffice/ui";

/** 404 — any unknown URL. */
const NotFound = ({ theme }) => (
  <AuthShell theme={theme}>
    <div className="max-w-md mx-auto text-center">
      <BrandLogo className="mb-8" />
      <StatusIcon icon={faCompass} tone="neutral" />
      <p className="mt-6 text-5xl font-extrabold bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] bg-clip-text text-transparent">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Page introuvable</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        La page demandée n'existe pas ou a été déplacée. Vérifiez l'adresse ou revenez à l'accueil.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button to="/" className="sm:flex-1">
          <FontAwesomeIcon icon={faHouse} /> Accueil
        </Button>
        <Button to="/schoolchat/login" variant="secondary" icon={faArrowRight} className="sm:flex-1">
          Se connecter
        </Button>
      </div>
    </div>
  </AuthShell>
);

export default NotFound;
