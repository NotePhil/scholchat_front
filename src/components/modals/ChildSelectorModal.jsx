import React from "react";
import { Users, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ChildSelectorModal = ({ isOpen, children = [], onSelect, onClose }) => {
  if (!isOpen || children.length === 0) return null;

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
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Choisir un enfant</h2>
            <p className="text-sm text-gray-500 mt-1">
              Vous avez plusieurs enfants. Choisissez celui dont vous souhaitez consulter les informations.
            </p>
          </div>

          {/* Children options */}
          <div className="px-6 pb-6 space-y-3">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => onSelect(child)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-green-700">
                    {child.prenom} {child.nom}
                  </p>
                  {child.niveau && (
                    <p className="text-xs text-gray-500">Niveau: {child.niveau}</p>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}

            {/* Option to see all */}
            <button
              onClick={() => onSelect(null)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-all"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Voir tous les enfants</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChildSelectorModal;
