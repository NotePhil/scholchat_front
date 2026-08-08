import React from "react";
import { X, Shield, BookOpen, Users, GraduationCap, Building2, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ROLE_CONFIG = {
  ADMIN: { label: "Administrateur", icon: Shield, color: "bg-red-500", lightBg: "bg-red-50", textColor: "text-red-700", borderColor: "border-red-200" },
  PROFESSOR: { label: "Professeur", icon: BookOpen, color: "bg-blue-500", lightBg: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-200" },
  STUDENT: { label: "Eleve", icon: GraduationCap, color: "bg-green-500", lightBg: "bg-green-50", textColor: "text-green-700", borderColor: "border-green-200" },
  PARENT: { label: "Parent", icon: Users, color: "bg-purple-500", lightBg: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-200" },
  TUTOR: { label: "Repetiteur", icon: UserCheck, color: "bg-amber-500", lightBg: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-200" },
  GESTIONNAIRE: { label: "Gestionnaire", icon: Building2, color: "bg-teal-500", lightBg: "bg-teal-50", textColor: "text-teal-700", borderColor: "border-teal-200" },
};

const RoleSelectorModal = ({ isOpen, roles = [], onSelect, onClose, title, subtitle }) => {
  if (!isOpen || roles.length === 0) return null;

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
          transition={{ type: "spring", damping: 25 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-4 text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {title || "Choisir un profil"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {subtitle || "Vous avez plusieurs roles. Choisissez celui que vous souhaitez utiliser."}
            </p>
          </div>

          {/* Role options */}
          <div className="px-6 pb-6 space-y-3">
            {roles.map((role) => {
              const config = ROLE_CONFIG[role.toUpperCase()] || ROLE_CONFIG.ADMIN;
              const Icon = config.icon;
              return (
                <button
                  key={role}
                  onClick={() => onSelect(role)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 ${config.borderColor} ${config.lightBg} hover:shadow-md transition-all active:scale-[0.98]`}
                >
                  <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-semibold ${config.textColor}`}>{config.label}</p>
                    <p className="text-xs text-gray-500">Se connecter en tant que {config.label.toLowerCase()}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Close */}
          {onClose && (
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export { ROLE_CONFIG };
export default RoleSelectorModal;
