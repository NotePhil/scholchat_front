import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  Save,
  Edit3,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { matiereService } from "../../../../../services/MatiereService";
import { useAuth } from "../../../../../hooks/useAuth";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useSelector } from "react-redux";

const MatiereContent = ({ isDark, currentTheme, themes, colorSchemes }) => {
  const { t } = useTranslation();
  const language = useSelector((state) => state.language?.currentLanguage || 'fr');
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
  });

  const { isAdmin, isProfessor } = useAuth();
  const canManage = isAdmin || isProfessor;

  const bgClass = isDark ? "bg-gray-900" : "bg-gray-50";
  const cardBgClass = isDark ? "bg-gray-800" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const textSecondaryClass = isDark ? "text-gray-300" : "text-gray-600";
  const borderClass = isDark ? "border-gray-700" : "border-gray-200";
  const inputBgClass = isDark ? "bg-gray-700" : "bg-gray-50";
  const inputTextClass = isDark ? "text-white" : "text-gray-900";

  useEffect(() => {
    if (canManage) {
      loadMatieres();
    }
  }, [canManage]);

  const loadMatieres = async () => {
    try {
      setLoading(true);
      const data = await matiereService.getAllMatieres();
      setMatieres(Array.isArray(data) ? data : []);
      setMessage({ text: "", type: "" });
    } catch (error) {
      console.error("Error loading matieres:", error);
      setMessage({ text: t('subjects.messages.loadError'), type: "error" });
      setMatieres([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.nom.trim()) {
      setMessage({ text: "Le nom de la matière est requis", type: "error" });
      return;
    }

    try {
      setSaving(true);
      await matiereService.createMatiere(formData);
      setMessage({ text: "Matière créée avec succès", type: "success" });
      setShowCreateModal(false);
      resetForm();
      await loadMatieres();
    } catch (error) {
      console.error("Error creating matiere:", error);
      setMessage({ text: error.message || "Erreur lors de la création", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (matiere) => {
    setSelectedMatiere(matiere);
    setFormData({
      nom: matiere.nom || "",
      description: matiere.description || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!formData.nom.trim()) {
      setMessage({ text: "Le nom de la matière est requis", type: "error" });
      return;
    }

    try {
      setSaving(true);
      await matiereService.updateMatiere(selectedMatiere.id, formData);
      setMessage({ text: "Matière modifiée avec succès", type: "success" });
      setShowEditModal(false);
      resetForm();
      await loadMatieres();
    } catch (error) {
      console.error("Error updating matiere:", error);
      setMessage({ text: error.message || "Erreur lors de la modification", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (matiere) => {
    setSelectedMatiere(matiere);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setSaving(true);
      await matiereService.deleteMatiere(selectedMatiere.id);
      setMessage({ text: "Matière supprimée avec succès", type: "success" });
      setShowDeleteModal(false);
      await loadMatieres();
    } catch (error) {
      console.error("Error deleting matiere:", error);
      setMessage({ text: error.message || "Erreur lors de la suppression", type: "error" });
    } finally {
      setSaving(false);
    }
  };



  const resetForm = () => {
    setFormData({
      nom: "",
      description: "",
    });
    setSelectedMatiere(null);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    resetForm();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  const filteredMatieres = matieres.filter(matiere =>
    matiere.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matiere.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredMatieres.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMatieres = filteredMatieres.slice(startIndex, endIndex);
  const showPagination = filteredMatieres.length > itemsPerPage;

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!canManage) {
    return (
      <div className="flex items-center justify-center py-20 p-6">
        <div className={`${cardBgClass} rounded-2xl shadow-lg border ${borderClass} p-8 text-center max-w-md`}>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${textClass} mb-2`}>Accès Restreint</h2>
          <p className={textSecondaryClass}>
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
            Seuls les administrateurs et professeurs peuvent gérer les matières.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed-page">
      <div className="w-full px-3 sm:px-6 py-3 sm:py-6">
        {/* Header */}
        <div className={`${cardBgClass} rounded-2xl shadow-sm border ${borderClass} p-4 sm:p-6 mb-4 sm:mb-6`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colorSchemes[currentTheme]?.gradient || "from-blue-500 to-blue-600"} flex items-center justify-center shadow-md flex-shrink-0`}>
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-lg sm:text-2xl font-bold ${textClass} leading-tight`}>{t('subjects.title')}</h1>
                <p className={`text-xs sm:text-sm ${textSecondaryClass} truncate`}>{t('subjects.subtitle')}</p>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r ${colorSchemes[currentTheme]?.gradient || "from-blue-500 to-blue-600"} text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex-shrink-0 text-sm`}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('subjects.actions.new')}</span>
                <span className="sm:hidden">Nouveau</span>
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-sm ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {message.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage({ text: "", type: "" })}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Search + Refresh */}
        <div className={`${cardBgClass} rounded-2xl shadow-sm border ${borderClass} p-3 sm:p-4 mb-4 sm:mb-6`}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondaryClass}`} />
              <input
                type="text"
                placeholder={t('subjects.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl border ${borderClass} ${inputBgClass} ${inputTextClass} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm`}
              />
            </div>
            <button
              onClick={loadMatieres}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-2 border ${borderClass} rounded-xl ${textClass} text-sm hover:bg-gray-50 transition-colors flex-shrink-0`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t('subjects.actions.refresh')}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`${cardBgClass} rounded-2xl shadow-sm border ${borderClass} overflow-hidden`}>
          {loading ? (
            <div className="p-12 text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className={`text-sm ${textSecondaryClass}`}>{t('common.actions.loading')}</p>
            </div>
          ) : currentMatieres.length === 0 ? (
            <div className="p-10 text-center">
              <BookOpen className={`w-12 h-12 ${textSecondaryClass} mx-auto mb-3`} />
              <h3 className={`text-base font-semibold ${textClass} mb-1`}>
                {searchTerm ? t('subjects.search.noResults') : t('subjects.search.empty')}
              </h3>
              <p className={`text-sm ${textSecondaryClass}`}>
                {searchTerm ? t('subjects.search.noResultsDesc') : t('subjects.search.emptyDesc')}
              </p>
            </div>
          ) : (
            <>
              {/* ── Mobile: card view ── */}
              <div className="sm:hidden divide-y divide-gray-100">
                {currentMatieres.map((matiere, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${textClass} truncate`}>{matiere.nom}</p>
                        {matiere.description && (
                          <p className={`text-xs ${textSecondaryClass} mt-0.5 line-clamp-2`}>{matiere.description}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                        matiere.etat === "ACTIF"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {matiere.etat || "ACTIF"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className={`flex items-center gap-1 text-xs ${textSecondaryClass}`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(matiere.dateCreation)}
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(matiere)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(matiere)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Desktop: table view ── */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"} border-b ${borderClass}`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${textClass} uppercase tracking-wide`}>{t('subjects.table.subject')}</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${textClass} uppercase tracking-wide`}>{t('subjects.table.description')}</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${textClass} uppercase tracking-wide`}>{t('subjects.table.creationDate')}</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${textClass} uppercase tracking-wide`}>{t('subjects.table.status')}</th>
                      {canManage && (
                        <th className={`px-6 py-4 text-right text-xs font-semibold ${textClass} uppercase tracking-wide`}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderClass}`}>
                    {currentMatieres.map((matiere, index) => (
                      <tr key={index} className={`hover:${isDark ? "bg-gray-700/50" : "bg-gray-50/60"} transition-colors`}>
                        <td className="px-6 py-4">
                          <span className={`font-medium text-sm ${textClass}`}>{matiere.nom}</span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <span className={`text-sm ${textSecondaryClass} line-clamp-2`}>{matiere.description || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className={`w-3.5 h-3.5 ${textSecondaryClass}`} />
                            <span className={`text-sm ${textSecondaryClass}`}>{formatDate(matiere.dateCreation)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            matiere.etat === "ACTIF"
                              ? `${isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-700"}`
                              : `${isDark ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700"}`
                          }`}>
                            {matiere.etat || "ACTIF"}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(matiere)}
                                className={`p-2 rounded-lg ${textSecondaryClass} hover:text-blue-600 hover:bg-blue-50 transition-colors`}
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(matiere)}
                                className={`p-2 rounded-lg ${textSecondaryClass} hover:text-red-600 hover:bg-red-50 transition-colors`}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination — shared for both views */}
          {showPagination && !loading && currentMatieres.length > 0 && (
            <div className={`px-4 py-3 border-t ${borderClass} flex items-center justify-between gap-2`}>
              <span className={`text-xs ${textSecondaryClass}`}>
                {startIndex + 1}–{Math.min(endIndex, filteredMatieres.length)} / {filteredMatieres.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded-lg border ${borderClass} ${textClass} hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "…" ? (
                      <span key={`e-${idx}`} className={`px-1 text-xs ${textSecondaryClass}`}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          currentPage === p
                            ? `bg-gradient-to-r ${colorSchemes[currentTheme]?.gradient || "from-blue-500 to-blue-600"} text-white`
                            : `border ${borderClass} ${textClass} hover:bg-gray-50`
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`p-1.5 rounded-lg border ${borderClass} ${textClass} hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className={`${cardBgClass} rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${borderClass}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${textClass}`}>{t('subjects.modals.create')}</h2>
                <button
                  onClick={closeModals}
                  className={`p-2 rounded-lg ${textSecondaryClass} hover:${isDark ? "bg-gray-700" : "bg-gray-100"} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-semibold ${textClass} mb-2`}>
                  {t('subjects.form.name')} *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${borderClass} ${inputBgClass} ${inputTextClass} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                  placeholder={t('subjects.form.namePlaceholder')}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold ${textClass} mb-2`}>
                  {t('subjects.form.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border ${borderClass} ${inputBgClass} ${inputTextClass} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none`}
                  placeholder={t('subjects.form.descriptionPlaceholder')}
                />
              </div>
            </div>
            <div className={`p-6 border-t ${borderClass} flex justify-end gap-3`}>
              <button
                onClick={closeModals}
                className={`px-6 py-3 border ${borderClass} rounded-xl ${textClass} hover:${isDark ? "bg-gray-700" : "bg-gray-50"} transition-colors`}
              >
                {t('common.actions.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !formData.nom.trim()}
                className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${colorSchemes[currentTheme]?.gradient || "from-blue-500 to-blue-600"} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50`}
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? t('subjects.modals.creating') : t('common.actions.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMatiere && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className={`${cardBgClass} rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${borderClass}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${textClass}`}>Modifier la Matière</h2>
                <button
                  onClick={closeModals}
                  className={`p-2 rounded-lg ${textSecondaryClass} hover:${isDark ? "bg-gray-700" : "bg-gray-100"} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-semibold ${textClass} mb-2`}>
                  Nom de la matière *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${borderClass} ${inputBgClass} ${inputTextClass} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                  placeholder="Ex: Mathématiques"
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold ${textClass} mb-2`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border ${borderClass} ${inputBgClass} ${inputTextClass} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none`}
                  placeholder="Description de la matière..."
                />
              </div>
            </div>
            <div className={`p-6 border-t ${borderClass} flex justify-end gap-3`}>
              <button
                onClick={closeModals}
                className={`px-6 py-3 border ${borderClass} rounded-xl ${textClass} hover:${isDark ? "bg-gray-700" : "bg-gray-50"} transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving || !formData.nom.trim()}
                className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${colorSchemes[currentTheme]?.gradient || "from-blue-500 to-blue-600"} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50`}
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Modification..." : "Modifier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMatiere && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className={`${cardBgClass} rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${borderClass}`}>
              <h2 className={`text-xl font-bold ${textClass}`}>Confirmer la suppression</h2>
            </div>
            <div className="p-6">
              <p className={textClass}>
                Êtes-vous sûr de vouloir supprimer la matière <strong>{selectedMatiere.nom}</strong> ?
              </p>
              <p className={`text-sm ${textSecondaryClass} mt-2`}>
                Cette action est irréversible.
              </p>
            </div>
            <div className={`p-6 border-t ${borderClass} flex justify-end gap-3`}>
              <button
                onClick={closeModals}
                className={`px-6 py-3 border ${borderClass} rounded-xl ${textClass} hover:${isDark ? "bg-gray-700" : "bg-gray-50"} transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {saving ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default MatiereContent;