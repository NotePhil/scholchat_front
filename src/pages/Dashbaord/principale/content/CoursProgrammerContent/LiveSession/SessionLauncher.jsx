import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Video, Mic, BookOpen, X, Loader2 } from "lucide-react";

const MODES = [
  {
    key: "VIDEO",
    icon: Video,
    label: "Vidéo",
    desc: "Caméra + micro + contenu du cours",
    color: "from-blue-500 to-indigo-600",
    border: "border-blue-300",
    bg: "bg-blue-50",
  },
  {
    key: "AUDIO",
    icon: Mic,
    label: "Audio",
    desc: "Micro uniquement + contenu du cours",
    color: "from-green-500 to-emerald-600",
    border: "border-green-300",
    bg: "bg-green-50",
  },
  {
    key: "CONTENT_ONLY",
    icon: BookOpen,
    label: "Contenu seul",
    desc: "Partage de contenu sans audio/vidéo",
    color: "from-purple-500 to-violet-600",
    border: "border-purple-300",
    bg: "bg-purple-50",
  },
];

const SessionLauncher = ({ cours, onStart, onClose, loading }) => {
  const [selected, setSelected] = useState("VIDEO");

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Démarrer la session</h2>
            <p className="text-indigo-200 text-sm mt-0.5 truncate max-w-[260px]">
              {cours?.titre || "Cours"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choisissez le mode de la session en direct :
          </p>
          {MODES.map(({ key, icon: Icon, label, desc, color, border, bg }) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                selected === key
                  ? `${border} ${bg}`
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </div>
              {selected === key && (
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onStart(selected)}
            disabled={loading}
            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Démarrage..." : "Lancer la session"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SessionLauncher;
