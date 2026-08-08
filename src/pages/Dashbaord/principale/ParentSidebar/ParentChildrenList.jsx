import React, { useState, useEffect } from "react";
import { UserPlus, Users, GraduationCap, Loader2, RefreshCw, Trash2, AlertCircle, X } from "lucide-react";
import AddChildModal from "./AddChildModal";

const ParentChildrenList = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      setError("");
      const parentId = localStorage.getItem("userId");
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
      if (!parentId || !token) {
        setError("Non connecte");
        return;
      }
      const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/parents/${parentId}/enfants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        setChildren(await resp.json());
      } else {
        setChildren([]);
      }
    } catch (err) {
      setError("Erreur lors du chargement");
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleRemoveChild = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeleteLoading(true);
      const parentId = localStorage.getItem("userId");
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/parents/${parentId}/enfants/${confirmDeleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmDeleteId(null);
      window.dispatchEvent(new CustomEvent("childrenUpdated"));
      loadChildren();
    } catch (err) {
      setError("Erreur lors de la suppression");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-2 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes enfants</h1>
            <p className="text-sm text-gray-500">{children.length} enfant(s) associe(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadChildren} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Actualiser">
            <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : children.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-purple-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun enfant</h3>
          <p className="text-gray-500 mb-6 text-sm">Ajoutez vos enfants pour pouvoir les inscrire dans des classes.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <UserPlus className="w-5 h-5" />
            Ajouter un enfant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div key={child.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {child.prenom} {child.nom}
                    </h3>
                    {child.niveau && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {child.niveau}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDeleteId(child.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  title="Retirer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {child.email && <p className="text-xs text-gray-500 truncate">{child.email}</p>}
              {child.telephone && <p className="text-xs text-gray-500">{child.telephone}</p>}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className={`text-xs px-2 py-0.5 rounded-full ${child.etat === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {child.etat === "ACTIVE" ? "Actif" : child.etat || "En attente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddChildModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onChildAdded={() => { setShowAddModal(false); loadChildren(); }}
      />

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Retirer cet enfant ?</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Cet enfant sera retiré de votre compte. Cette action ne supprime pas son profil.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 text-gray-600 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleRemoveChild}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentChildrenList;
