import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faGlobe, faMoon, faSun, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "../../hooks/useTranslation";
import { InstallButton } from "../PWAInstallPrompt";
import { BrandLogo, Button } from "../frontoffice/ui";

// Header nav of the landing page (design sheet): Accueil, Fonctionnalités, Tarifs, À propos.
// Fonctionnalités / Tarifs / À propos are sections of the landing page (anchors).
const NAV_ITEMS = [
  { label: "Accueil", section: null },
  { label: "Fonctionnalités", section: "fonctionnalites" },
  { label: "Tarifs", section: "tarifs" },
  { label: "À propos", section: "a-propos" },
];

export const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: "smooth" });
  return true;
};

export const Header = ({ theme, setTheme }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, changeLanguage } = useTranslation();
  const isDark = theme === "dark";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const goTo = (section) => {
    setOpen(false);
    if (location.pathname === "/") {
      if (!section) window.scrollTo({ top: 0, behavior: "smooth" });
      else scrollToSection(section);
      window.history.replaceState(null, "", section ? `/#${section}` : "/");
    } else {
      navigate(section ? `/#${section}` : "/");
    }
  };

  const isActive = (section) =>
    location.pathname === "/" && (section ? location.hash === `#${section}` : !location.hash);

  const iconBtn =
    "w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-[#4F46E5] hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors";

  return (
    <header className={isDark ? "dark" : ""}>
      <div
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled || open
            ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm border-b border-slate-100 dark:border-slate-800"
            : "bg-white/70 dark:bg-slate-900/60 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-[72px] flex items-center justify-between gap-4">
          <Link to="/" onClick={() => goTo(null)} aria-label="ScholChat — accueil">
            <BrandLogo />
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => goTo(item.section)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.section)
                    ? "text-[#4F46E5] dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10"
                    : "text-slate-600 dark:text-slate-300 hover:text-[#4F46E5] dark:hover:text-indigo-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              className={iconBtn}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Mode clair" : "Mode sombre"}
              title={isDark ? "Mode clair" : "Mode sombre"}
            >
              <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
            </button>
            <button
              type="button"
              className={`${iconBtn} w-auto px-3 gap-1.5 text-xs font-semibold`}
              onClick={() => changeLanguage(language === "fr" ? "en" : "fr")}
              title="Langue"
            >
              <FontAwesomeIcon icon={faGlobe} />
              {language === "fr" ? "EN" : "FR"}
            </button>
            <InstallButton variant="icon" />
            <NavLink
              to="/schoolchat/login"
              className={({ isActive: a }) =>
                `ml-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  a ? "text-[#4F46E5] dark:text-indigo-300" : "text-slate-700 dark:text-slate-200 hover:text-[#4F46E5]"
                }`
              }
            >
              Se connecter
            </NavLink>
            <Button to="/schoolchat/signup" className="!px-5 !py-2.5 !text-sm">
              Créer un compte
            </Button>
          </div>

          <div className="flex lg:hidden items-center gap-1">
            <button
              type="button"
              className={iconBtn}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Mode clair" : "Mode sombre"}
            >
              <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
            </button>
            <button
              type="button"
              className={iconBtn}
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
            >
              <FontAwesomeIcon icon={open ? faXmark : faBars} className="text-lg" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t border-slate-100 dark:border-slate-800"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goTo(item.section)}
                    className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex items-center gap-2 px-2 pt-2">
                  <button
                    type="button"
                    className={`${iconBtn} w-auto px-3 gap-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700`}
                    onClick={() => changeLanguage(language === "fr" ? "en" : "fr")}
                  >
                    <FontAwesomeIcon icon={faGlobe} />
                    {language === "fr" ? "EN" : "FR"}
                  </button>
                  <InstallButton variant="with-label" className="flex-1 justify-center px-4 py-2.5 border border-indigo-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <Button to="/schoolchat/login" variant="secondary" className="!py-2.5">
                    Se connecter
                  </Button>
                  <Button to="/schoolchat/signup" className="!py-2.5">
                    Créer un compte
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
