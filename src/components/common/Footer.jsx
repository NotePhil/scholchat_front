import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faLinkedinIn, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { BrandLogo } from "../frontoffice/ui";
import { StoreBadges } from "../frontoffice/StoreBadges";

const COLUMNS = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", to: "/#fonctionnalites" },
      { label: "Tarifs", to: "/#tarifs" },
      { label: "Offres et formules", to: "/schoolchat/functionalities" },
      { label: "Cours", to: "/schoolchat/courses" },
    ],
  },
  {
    title: "Niveaux",
    links: [
      { label: "Crèches", to: "/schoolchat/nursery" },
      { label: "Maternelles", to: "/schoolchat/kindergarten" },
      { label: "Écoles primaires", to: "/schoolchat/primary-school" },
      { label: "Lycées et collèges", to: "/schoolchat/high-school" },
      { label: "Universités", to: "/schoolchat/university" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "À propos", to: "/schoolchat/about" },
      { label: "FAQ", to: "/schoolchat/blog" },
      { label: "Contact", to: "/schoolchat/contact" },
      { label: "Renouveler mon offre", to: "/schoolchat/renouveler-offre" },
    ],
  },
  {
    title: "Compte",
    links: [
      { label: "Se connecter", to: "/schoolchat/login" },
      { label: "Créer un compte", to: "/schoolchat/signup" },
      { label: "Mot de passe oublié", to: "/schoolchat/forgot-password" },
    ],
  },
];

const SOCIALS = [
  { icon: faFacebookF, href: "https://facebook.com", label: "Facebook" },
  { icon: faXTwitter, href: "https://twitter.com", label: "X" },
  { icon: faInstagram, href: "https://instagram.com", label: "Instagram" },
  { icon: faLinkedinIn, href: "https://linkedin.com", label: "LinkedIn" },
];

export const Footer = ({ theme }) => (
  <footer className={theme === "dark" ? "dark" : ""}>
    <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-4">
            <BrandLogo tagline />
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              ScholChat simplifie la communication, l'apprentissage et la gestion scolaire. Une seule plateforme pour tous.
            </p>
            <StoreBadges compact />
            <div className="flex gap-2 pt-1">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-white hover:bg-[#4F46E5] hover:border-[#4F46E5] transition-colors"
                >
                  <FontAwesomeIcon icon={s.icon} />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:contents gap-8">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-300">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} ScholChat. Tous droits réservés.</p>
          <p>L'école connectée, partout.</p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
