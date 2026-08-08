import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Tag, Building2, School, X, CheckCircle, AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { offerService, TypeCibleOffre } from "../../../../../services/OfferService";

const DEFAULT_FORM = {
  nom: "",
  description: "",
  cible: TypeCibleOffre.CLASSE,
  prixMensuel: "",
  dureeMensuelleMinutes: "",
  prixAnnuel: "",
  dureeAnnuelleMinutes: "",
  nombreClassesInclues: "",
  classesBonus: "",
  estTest: false,
  actif: true,
  delaiRappelSuppressionMinutes: "",
  delaiSuppressionMinutes: "",
  elevesMax: "",
  stockageMaxGo: "",
  messagerieIncluse: false,
};

// Raccourcis usuels de duree pour eviter d'avoir a calculer les minutes a la main.
const DUREE_PRESETS = [
  { label: "1 mois (30 jours)", minutes: 30 * 24 * 60 },
  { label: "1 an (365 jours)", minutes: 365 * 24 * 60 },
  { label: "2 ans", minutes: 2 * 365 * 24 * 60 },
  { label: "Test - 3 minutes", minutes: 3 },
];

// Raccourcis pour les delais de purge post-expiration (rappel puis suppression definitive).
const DELAI_RAPPEL_PRESETS = [
  { label: "2 jours", minutes: 2 * 24 * 60 },
  { label: "7 jours", minutes: 7 * 24 * 60 },
  { label: "Test - 1 minute", minutes: 1 },
];
const DELAI_SUPPRESSION_PRESETS = [
  { label: "3 jours", minutes: 3 * 24 * 60 },
  { label: "14 jours", minutes: 14 * 24 * 60 },
  { label: "Test - 2 minutes", minutes: 2 },
];

const OfferAdminContent = ({ isDark }) => {
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textMain = isDark ? "text-gray-100" : "text-gray-900";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const inputCls = `w-full px-3 py-2 rounded-lg border ${
    isDark ? "bg-gray-900 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"
  } focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const chargerOffres = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await offerService.listerOffres(null, true);
      setOffres(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement offres:", err);
      setError("Impossible de charger les offres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerOffres();
  }, []);

  const ouvrirCreation = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setShowForm(true);
  };

  const ouvrirEdition = (offre) => {
    setEditingId(offre.id);
    setFormData({
      nom: offre.nom || "",
      description: offre.description || "",
      cible: offre.cible || TypeCibleOffre.CLASSE,
      prixMensuel: offre.prixMensuel ?? "",
      dureeMensuelleMinutes: offre.dureeMensuelleMinutes ?? "",
      prixAnnuel: offre.prixAnnuel ?? "",
      dureeAnnuelleMinutes: offre.dureeAnnuelleMinutes ?? "",
      nombreClassesInclues: offre.nombreClassesInclues ?? "",
      classesBonus: offre.classesBonus ?? "",
      estTest: !!offre.estTest,
      actif: !!offre.actif,
      delaiRappelSuppressionMinutes: offre.delaiRappelSuppressionMinutes ?? "",
      delaiSuppressionMinutes: offre.delaiSuppressionMinutes ?? "",
      elevesMax: offre.elevesMax ?? "",
      stockageMaxGo: offre.stockageMaxGo ?? "",
      messagerieIncluse: !!offre.messagerieIncluse,
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toNumberOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nom: formData.nom.trim(),
        description: formData.description.trim() || null,
        cible: formData.cible,
        prixMensuel: toNumberOrNull(formData.prixMensuel),
        dureeMensuelleMinutes: toNumberOrNull(formData.dureeMensuelleMinutes),
        prixAnnuel: toNumberOrNull(formData.prixAnnuel),
        dureeAnnuelleMinutes: toNumberOrNull(formData.dureeAnnuelleMinutes),
        nombreClassesInclues:
          formData.cible === TypeCibleOffre.ETABLISSEMENT ? toNumberOrNull(formData.nombreClassesInclues) : null,
        classesBonus: formData.cible === TypeCibleOffre.ETABLISSEMENT ? toNumberOrNull(formData.classesBonus) : null,
        estTest: formData.estTest,
        actif: formData.actif,
        delaiRappelSuppressionMinutes: toNumberOrNull(formData.delaiRappelSuppressionMinutes),
        delaiSuppressionMinutes: toNumberOrNull(formData.delaiSuppressionMinutes),
        elevesMax: toNumberOrNull(formData.elevesMax),
        stockageMaxGo: toNumberOrNull(formData.stockageMaxGo),
        messagerieIncluse: formData.messagerieIncluse,
      };
      if (editingId) {
        await offerService.modifierOffre(editingId, payload);
        setSuccess("Offre modifiée avec succès.");
      } else {
        await offerService.creerOffre(payload);
        setSuccess("Offre créée avec succès.");
      }
      setShowForm(false);
      await chargerOffres();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Erreur enregistrement offre:", err);
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement de l'offre.");
    } finally {
      setSaving(false);
    }
  };

  const handleDesactiver = async (offre) => {
    if (!window.confirm(`Désactiver l'offre "${offre.nom}" ? Elle ne sera plus proposée aux nouveaux abonnements.`)) {
      return;
    }
    try {
      await offerService.desactiverOffre(offre.id);
      await chargerOffres();
    } catch (err) {
      console.error("Erreur désactivation offre:", err);
      setError("Impossible de désactiver cette offre.");
    }
  };

  const appliquerPreset = (champDuree, minutes) => {
    setFormData((prev) => ({ ...prev, [champDuree]: minutes }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>Offres &amp; Forfaits</h1>
          <p className={textMuted}>
            Gérez les offres proposées pour les classes indépendantes et les établissements. Visible uniquement par
            les administrateurs.
          </p>
        </div>
        <button
          onClick={ouvrirCreation}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} /> Nouvelle offre
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {showForm && (
        <div className={`rounded-xl border p-5 ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${textMain}`}>{editingId ? "Modifier l'offre" : "Nouvelle offre"}</h2>
            <button onClick={() => setShowForm(false)} className={textMuted}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={`block text-sm mb-1 ${textMuted}`}>Nom de l'offre</label>
              <input className={inputCls} name="nom" value={formData.nom} onChange={handleChange} required />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm mb-1 ${textMuted}`}>Description</label>
              <textarea className={inputCls} name="description" value={formData.description} onChange={handleChange} rows={2} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${textMuted}`}>Cible</label>
              <select className={inputCls} name="cible" value={formData.cible} onChange={handleChange}>
                <option value={TypeCibleOffre.CLASSE}>Classe indépendante</option>
                <option value={TypeCibleOffre.ETABLISSEMENT}>Établissement</option>
              </select>
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="estTest" checked={formData.estTest} onChange={handleChange} />
                <span className={textMuted}>Offre de test (visible avec badge "TEST")</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="actif" checked={formData.actif} onChange={handleChange} />
                <span className={textMuted}>Active</span>
              </label>
            </div>

            <div className={`md:col-span-2 border-t pt-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`font-medium mb-2 ${textMain}`}>Périodicité mensuelle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${textMuted}`}>Prix mensuel (FCFA)</label>
                  <input className={inputCls} type="number" step="0.01" name="prixMensuel" value={formData.prixMensuel} onChange={handleChange} />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${textMuted}`}>Durée (minutes)</label>
                  <input className={inputCls} type="number" name="dureeMensuelleMinutes" value={formData.dureeMensuelleMinutes} onChange={handleChange} />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DUREE_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p.label}
                        onClick={() => appliquerPreset("dureeMensuelleMinutes", p.minutes)}
                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className={`font-medium mb-2 ${textMain}`}>Périodicité annuelle (optionnelle)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${textMuted}`}>Prix annuel (FCFA)</label>
                  <input className={inputCls} type="number" step="0.01" name="prixAnnuel" value={formData.prixAnnuel} onChange={handleChange} />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${textMuted}`}>Durée (minutes)</label>
                  <input className={inputCls} type="number" name="dureeAnnuelleMinutes" value={formData.dureeAnnuelleMinutes} onChange={handleChange} />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DUREE_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p.label}
                        onClick={() => appliquerPreset("dureeAnnuelleMinutes", p.minutes)}
                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {formData.prixMensuel && formData.prixAnnuel && formData.dureeMensuelleMinutes && formData.dureeAnnuelleMinutes && (
                <p className="text-sm text-green-600 mt-2">
                  {(() => {
                    const reduction = offerService.calculerReduction({
                      prixMensuel: Number(formData.prixMensuel),
                      prixAnnuel: Number(formData.prixAnnuel),
                      dureeMensuelleMinutes: Number(formData.dureeMensuelleMinutes),
                      dureeAnnuelleMinutes: Number(formData.dureeAnnuelleMinutes),
                    });
                    return reduction != null
                      ? `Réduction annuelle affichée au client : ${Math.round(reduction * 100)}%`
                      : null;
                  })()}
                </p>
              )}
            </div>

            <div className={`md:col-span-2 border-t pt-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`font-medium mb-2 flex items-center gap-2 ${textMain}`}>
                <Clock size={16} /> Purge automatique après expiration
              </h3>
              <p className={`text-xs mb-3 ${textMuted}`}>
                Défini par vous, modifiable à tout moment. Laissez vide pour désactiver la purge automatique sur
                cette offre.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${textMuted}`}>Rappel de suppression (minutes après expiration)</label>
                  <input className={inputCls} type="number" name="delaiRappelSuppressionMinutes" value={formData.delaiRappelSuppressionMinutes} onChange={handleChange} />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DELAI_RAPPEL_PRESETS.map((p) => (
                      <button type="button" key={p.label} onClick={() => appliquerPreset("delaiRappelSuppressionMinutes", p.minutes)}
                        className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${textMuted}`}>Suppression définitive (minutes après expiration)</label>
                  <input className={inputCls} type="number" name="delaiSuppressionMinutes" value={formData.delaiSuppressionMinutes} onChange={handleChange} />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DELAI_SUPPRESSION_PRESETS.map((p) => (
                      <button type="button" key={p.label} onClick={() => appliquerPreset("delaiSuppressionMinutes", p.minutes)}
                        className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`md:col-span-2 border-t pt-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`font-medium mb-2 flex items-center gap-2 ${textMain}`}>
                <ShieldAlert size={16} /> Restrictions (informatif)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${textMuted}`}>Élèves max</label>
                  <input className={inputCls} type="number" name="elevesMax" value={formData.elevesMax} onChange={handleChange} />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${textMuted}`}>Stockage max (Go)</label>
                  <input className={inputCls} type="number" name="stockageMaxGo" value={formData.stockageMaxGo} onChange={handleChange} />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="messagerieIncluse" checked={formData.messagerieIncluse} onChange={handleChange} />
                    <span className={textMuted}>Messagerie incluse</span>
                  </label>
                </div>
              </div>
            </div>

            {formData.cible === TypeCibleOffre.ETABLISSEMENT && (
              <div className={`md:col-span-2 border-t pt-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`font-medium mb-2 ${textMain}`}>Quota de classes (établissement)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-1 ${textMuted}`}>Nombre de classes incluses</label>
                    <input className={inputCls} type="number" name="nombreClassesInclues" value={formData.nombreClassesInclues} onChange={handleChange} />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${textMuted}`}>Classes bonus offertes</label>
                    <input className={inputCls} type="number" name="classesBonus" value={formData.classesBonus} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-lg border ${isDark ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-700"}`}>
                Annuler
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
                {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Créer l'offre"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
        {loading ? (
          <div className={`p-6 text-center ${textMuted}`}>Chargement des offres...</div>
        ) : offres.length === 0 ? (
          <div className={`p-6 text-center ${textMuted}`}>Aucune offre pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={isDark ? "bg-gray-900" : "bg-gray-50"}>
                <tr>
                  <th className={`text-left p-3 ${textMuted}`}>Offre</th>
                  <th className={`text-left p-3 ${textMuted}`}>Cible</th>
                  <th className={`text-left p-3 ${textMuted}`}>Mensuel</th>
                  <th className={`text-left p-3 ${textMuted}`}>Annuel</th>
                  <th className={`text-left p-3 ${textMuted}`}>Quota</th>
                  <th className={`text-left p-3 ${textMuted}`}>Statut</th>
                  <th className={`text-right p-3 ${textMuted}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offres.map((offre) => (
                  <tr key={offre.id} className={`border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                    <td className={`p-3 font-medium ${textMain}`}>
                      <div className="flex items-center gap-2">
                        <Tag size={14} className={textMuted} />
                        {offre.nom}
                        {offre.estTest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">TEST</span>
                        )}
                      </div>
                    </td>
                    <td className={`p-3 ${textMuted}`}>
                      <span className="flex items-center gap-1">
                        {offre.cible === TypeCibleOffre.ETABLISSEMENT ? <School size={14} /> : <Building2 size={14} />}
                        {offre.cible === TypeCibleOffre.ETABLISSEMENT ? "Établissement" : "Classe"}
                      </span>
                    </td>
                    <td className={`p-3 ${textMuted}`}>
                      {offre.prixMensuel != null ? `${offre.prixMensuel} FCFA / ${offre.dureeMensuelleMinutes} min` : "-"}
                    </td>
                    <td className={`p-3 ${textMuted}`}>
                      {offre.prixAnnuel != null ? `${offre.prixAnnuel} FCFA / ${offre.dureeAnnuelleMinutes} min` : "-"}
                    </td>
                    <td className={`p-3 ${textMuted}`}>
                      {offre.nombreClassesInclues != null
                        ? `${offre.nombreClassesInclues}${offre.classesBonus ? ` +${offre.classesBonus}` : ""}`
                        : "-"}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${offre.actif ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                        {offre.actif ? "Active" : "Désactivée"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => ouvrirEdition(offre)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                          <Edit2 size={16} />
                        </button>
                        {offre.actif && (
                          <button onClick={() => handleDesactiver(offre)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferAdminContent;
