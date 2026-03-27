import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

// Global capture - catches the event even before React mounts
let globalDeferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  globalDeferredPrompt = e;
  window.dispatchEvent(new Event("pwaInstallReady"));
});

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwaInstallDismissed");
    const alreadyInstalled = window.matchMedia("(display-mode: standalone)").matches;
    if (alreadyInstalled || dismissed === "true") return;

    // Show popup when install is ready
    const showIfReady = () => {
      if (globalDeferredPrompt) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    showIfReady();
    window.addEventListener("pwaInstallReady", showIfReady);
    return () => window.removeEventListener("pwaInstallReady", showIfReady);
  }, []);

  const handleInstall = async () => {
    if (!globalDeferredPrompt) return;
    globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      localStorage.setItem("pwaInstallDismissed", "true");
      globalDeferredPrompt = null;
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwaInstallDismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[9999] animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 relative">
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
              Installer ScholChat
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Installez l'application sur votre appareil pour un acces rapide et une meilleure experience.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export install button for header use - uses global captured prompt
export const useInstallApp = () => {
  const [canInstall, setCanInstall] = useState(!!globalDeferredPrompt);

  useEffect(() => {
    const alreadyInstalled = window.matchMedia("(display-mode: standalone)").matches;
    if (alreadyInstalled) return;

    // Check if already captured globally
    if (globalDeferredPrompt) {
      setCanInstall(true);
    }

    // Listen for future events
    const handler = () => setCanInstall(!!globalDeferredPrompt);
    window.addEventListener("pwaInstallReady", handler);
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setCanInstall(true);
    });
    return () => window.removeEventListener("pwaInstallReady", handler);
  }, []);

  const install = async () => {
    if (!globalDeferredPrompt) return;
    globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    if (outcome === "accepted") {
      globalDeferredPrompt = null;
      setCanInstall(false);
    }
  };

  return { canInstall, install };
};

export default PWAInstallPrompt;
