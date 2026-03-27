import React, { useState } from "react";
import { X, UserPlus, Loader2, AlertCircle, CheckCircle } from "lucide-react";

const AddChildModal = ({ isOpen, onClose, onChildAdded }) => {
  const [formData, setFormData] = useState({ nom: "", prenom: "", niveau: "", email: "", telephone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const niveaux = ["CP", "CE1", "CE2", "CM1", "CM2", "6eme", "5eme", "4eme", "3eme", "2nde", "1ere", "Terminale"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.niveau) {
      setError("Nom, prenom et niveau sont obligatoires");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const parentId = localStorage.getItem("userId");
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");

      // Generate UUID for the student
      const genId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });

      // 1. Create the student
      const eleveResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/profil-eleves`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: genId(),
          type: "eleve",
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          niveau: formData.niveau,
          email: formData.email.trim() || null,
          telephone: formData.telephone.trim() || null,
          etat: "ACTIVE",
        }),
      });

      if (!eleveResponse.ok) {
        const errData = await eleveResponse.json();
        throw new Error(errData.message || "Erreur lors de la creation de l'eleve");
      }

      const newEleve = await eleveResponse.json();

      // 2. Link parent to child via parent_eleve
      try {
        await fetch(`${process.env.REACT_APP_API_BASE_URL}/parents/${parentId}/enfants/${newEleve.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (linkErr) {
        console.warn("Could not auto-link parent-child, may need manual linking:", linkErr);
      }

      setSuccess(`${formData.prenom} ${formData.nom} a ete ajoute avec succes !`);
      setFormData({ nom: "", prenom: "", niveau: "", email: "", telephone: "" });

      if (onChildAdded) onChildAdded(newEleve);
      setTimeout(() => { setSuccess(""); onClose(); }, 2000);
    } catch (err) {
      setError(err.message || "Erreur lors de l'ajout de l'enfant");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Ajouter un enfant</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prenom *</label>
              <input
                type="text" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                placeholder="Prenom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                placeholder="Nom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
            <select
              value={formData.niveau} onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="">Choisir le niveau</option>
              {niveaux.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optionnel)</label>
            <input
              type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone (optionnel)</label>
            <input
              type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              placeholder="6XXXXXXXX"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-gray-600 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Ajout...</> : <><UserPlus className="w-4 h-4" />Ajouter</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChildModal;
