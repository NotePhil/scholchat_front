import React, { useState } from "react";
import { Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "scholchat-secure-key-2024-v1-32b";

const ReAuthModal = ({ isOpen, email, onConfirm, onClose, loading }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }
    setError("");
    try {
      const encryptedPassword = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
      await onConfirm(encryptedPassword);
      setPassword("");
    } catch (err) {
      setError(err.message || "Mot de passe incorrect");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Confirmer votre identite</h2>
            <p className="text-sm text-gray-500 mt-1">
              Entrez votre mot de passe pour changer de role
            </p>
            {email && (
              <p className="text-xs text-indigo-600 font-medium mt-2 bg-indigo-50 rounded-lg px-3 py-1 inline-block">
                {email}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verification...
                </>
              ) : (
                "Confirmer"
              )}
            </button>

            <button
              type="button"
              onClick={() => { setPassword(""); setError(""); onClose(); }}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Annuler
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReAuthModal;
