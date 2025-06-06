import React from "react";
import { X } from "lucide-react";

const RecipientSelectorModal = ({
  isDark,
  filteredUsers,
  ccRecipients,
  setCcRecipients,
  setShowRecipientSelector,
  getUserInitials,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Sélectionner des destinataires</h3>
          <button
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            onClick={() => setShowRecipientSelector(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <input
            type="text"
            placeholder="Rechercher des utilisateurs..."
            className={`w-full px-4 py-2 mb-4 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
          />
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  checked={ccRecipients.some((r) => r.id === user.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCcRecipients((prev) => [...prev, user]);
                    } else {
                      setCcRecipients((prev) => prev.filter((r) => r.id !== user.id));
                    }
                  }}
                />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                  {getUserInitials(user)}
                </div>
                <div>
                  <div className="font-medium">
                    {user.nom} {user.prenom}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`p-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <button
            className={`px-4 py-2 rounded-lg ${isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}
            onClick={() => setShowRecipientSelector(false)}
          >
            Valider la sélection
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipientSelectorModal;
