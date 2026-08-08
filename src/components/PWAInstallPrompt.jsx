import React, { useState, useEffect, useRef } from "react";
import { Download, X, Monitor, Chrome, Smartphone } from "lucide-react";

// ── Global deferred-prompt capture (fires before React mounts) ──────────────
let globalDeferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  globalDeferredPrompt = e;
  window.dispatchEvent(new Event("pwaInstallReady"));
});

// Detect browser
const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Chrome") && !ua.includes("Edg/")) return "chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  return "other";
};

const isAlreadyInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useInstallApp = () => {
  const [canInstall, setCanInstall] = useState(!!globalDeferredPrompt && !isAlreadyInstalled());

  useEffect(() => {
    if (isAlreadyInstalled()) { setCanInstall(false); return; }
    if (globalDeferredPrompt) setCanInstall(true);
    const handler = () => setCanInstall(!!globalDeferredPrompt);
    const promptHandler = (e) => { e.preventDefault(); globalDeferredPrompt = e; setCanInstall(true); };
    window.addEventListener("pwaInstallReady", handler);
    window.addEventListener("beforeinstallprompt", promptHandler);
    return () => {
      window.removeEventListener("pwaInstallReady", handler);
      window.removeEventListener("beforeinstallprompt", promptHandler);
    };
  }, []);

  const install = async () => {
    if (!globalDeferredPrompt) return false;
    globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    if (outcome === "accepted") { globalDeferredPrompt = null; setCanInstall(false); }
    return outcome === "accepted";
  };

  return { canInstall, install };
};

// ── Browser-specific install instructions ────────────────────────────────────
const Instructions = ({ browser, onClose }) => {
  const steps = {
    chrome: [
      "Cliquez sur les 3 points ⋮ en haut à droite",
      'Sélectionnez "Installer ScholChat…"',
      'Confirmez en cliquant "Installer"',
    ],
    edge: [
      "Cliquez sur les 3 points … en haut à droite",
      'Sélectionnez "Applications" → "Installer ce site en tant qu\'application"',
      'Confirmez en cliquant "Installer"',
    ],
    firefox: [
      "Cliquez sur les 3 barres ☰ en haut à droite",
      'Sélectionnez "Installer"',
      "Ou ajoutez l'onglet à votre barre d'outils pour un accès rapide",
    ],
    safari: [
      "Appuyez sur le bouton Partager ⎙ en bas de l'écran",
      'Sélectionnez "Sur l\'écran d\'accueil"',
      'Confirmez en appuyant "Ajouter"',
    ],
    other: [
      "Recherchez une option \"Installer\" ou \"Ajouter à l'écran d'accueil\" dans le menu de votre navigateur",
    ],
  };

  const browserName = { chrome: "Chrome", edge: "Edge", firefox: "Firefox", safari: "Safari", other: "votre navigateur" };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-slate-800">
          Installer sur {browserName[browser]}
        </span>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <X size={14} className="text-slate-400" />
        </button>
      </div>
      <ol className="space-y-2">
        {steps[browser].map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-400">
        Accès rapide, fonctionne hors-ligne, expérience native.
      </p>
    </div>
  );
};

// ── Main InstallButton component ──────────────────────────────────────────────
// Always visible — no popup, just a clean icon button that shows a popover on click.
export const InstallButton = ({ variant = "icon", className = "" }) => {
  const { canInstall, install } = useInstallApp();
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const popoverRef = useRef(null);
  const btnRef = useRef(null);
  const browser = getBrowser();
  const alreadyInstalled = isAlreadyInstalled();

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (alreadyInstalled && !installed) return null; // already running as app

  const handleClick = async () => {
    // Chrome / Edge: native prompt available
    if (canInstall) {
      const accepted = await install();
      if (accepted) { setInstalled(true); setOpen(false); }
      return;
    }
    // All other browsers: show manual instructions
    setOpen((v) => !v);
  };

  const label = variant === "icon" ? null : (
    <span className="text-xs font-semibold">Installer</span>
  );

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        onClick={handleClick}
        title="Installer l'application"
        className={`relative flex items-center gap-1.5 p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-all ${className}`}
      >
        <Download size={18} />
        {label}
        {/* Pulse dot to draw attention */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[9999] overflow-hidden"
          style={{ minWidth: 260 }}
        >
          {canInstall ? (
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Monitor size={22} className="text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">Installer ScholChat</p>
              <p className="text-xs text-slate-500 mb-4">
                Application de bureau, accès rapide, fonctionne hors-ligne.
              </p>
              <button
                onClick={handleClick}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Download size={15} /> Installer maintenant
              </button>
            </div>
          ) : (
            <Instructions browser={browser} onClose={() => setOpen(false)} />
          )}
        </div>
      )}
    </div>
  );
};

// ── Null popup (popup disabled) ───────────────────────────────────────────────
// Kept for backward compatibility (imported in App.js) but renders nothing.
const PWAInstallPrompt = () => null;
export default PWAInstallPrompt;
