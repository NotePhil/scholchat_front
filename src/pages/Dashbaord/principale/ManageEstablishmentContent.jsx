import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Edit,
  Trash2,
  Plus,
  MapPin,
  Globe,
  Mail,
  Phone,
  Settings,
  Eye,
  AlertCircle,
  Loader,
} from "lucide-react";
import establishmentService from "../../../services/EstablishmentService";
import EstablishmentModal from "./EstablishmentModal.jsx";

const ManageEstablishmentContent = ({ onNavigateToCreate }) => {
  const [establishments, setEstablishments] = useState([]);
  const [filteredEstablishments, setFilteredEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // "view", "edit", "create"
  const [modalLoading, setModalLoading] = useState(false);

  // Load establishments
  useEffect(() => {
    loadEstablishments();
  }, []);

  // Filter establishments based on search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEstablishments(establishments);
    } else {
      const filtered = establishments.filter(
        (est) =>
          est.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          est.localisation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          est.pays.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEstablishments(filtered);
    }
  }, [searchTerm, establishments]);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      const data = await establishmentService.getAllEstablishments();
      setEstablishments(data);
      setError("");
    } catch (error) {
      console.error("Error loading establishments:", error);
      setError("Erreur lors du chargement des établissements");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (establishmentId) => {
    try {
      setActionLoading(establishmentId);
      await establishmentService.deleteEstablishment(establishmentId);
      await loadEstablishments();
      setShowDeleteModal(null);
      setError("");
    } catch (error) {
      console.error("Error deleting establishment:", error);
      setError("Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (establishment) => {
    setSelectedEstablishment(establishment);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEdit = (establishment) => {
    setSelectedEstablishment(establishment);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedEstablishment(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleModalSave = async (establishmentData) => {
    try {
      setModalLoading(true);

      if (modalMode === "create") {
        await establishmentService.createEstablishment(establishmentData);
      } else if (modalMode === "edit") {
        await establishmentService.updateEstablishment(
          selectedEstablishment.id,
          establishmentData
        );
      }

      await loadEstablishments();
      setShowModal(false);
      setSelectedEstablishment(null);
      setError("");
    } catch (error) {
      console.error("Error saving establishment:", error);
      setError(
        modalMode === "create"
          ? "Erreur lors de la création"
          : "Erreur lors de la mise à jour"
      );
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des établissements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Gérer les Établissements
                  </h1>
                  <p className="text-blue-100">
                    {establishments.length} établissement
                    {establishments.length !== 1 ? "s" : ""} trouvé
                    {establishments.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreate}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nouveau
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un établissement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Establishments Grid */}
        {filteredEstablishments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? "Aucun résultat trouvé" : "Aucun établissement"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Essayez avec d'autres termes de recherche"
                : "Commencez par créer votre premier établissement"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Créer un établissement
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEstablishments.map((establishment) => (
              <div
                key={establishment.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {establishment.nom}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{establishment.localisation}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span>{establishment.pays}</span>
                        </div>
                        {establishment.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{establishment.email}</span>
                          </div>
                        )}
                        {establishment.telephone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{establishment.telephone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Options
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {establishment.optionEnvoiMailVersClasse && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Email classes
                        </span>
                      )}
                      {establishment.optionTokenGeneral && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Token général
                        </span>
                      )}
                      {establishment.codeUnique && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Code unique
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(establishment)}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </button>
                    <button
                      onClick={() => handleEdit(establishment)}
                      className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(establishment)}
                      className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Establishment Modal */}
        <EstablishmentModal
          showModal={showModal}
          setShowModal={setShowModal}
          modalMode={modalMode}
          selectedEstablishment={selectedEstablishment}
          onSave={handleModalSave}
          loading={modalLoading}
        />

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Confirmer la suppression
                    </h3>
                    <p className="text-gray-600">
                      Cette action est irréversible
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Êtes-vous sûr de vouloir supprimer l'établissement{" "}
                  <strong>{showDeleteModal.nom}</strong> ?
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteModal.id)}
                    disabled={actionLoading === showDeleteModal.id}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {actionLoading === showDeleteModal.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {actionLoading === showDeleteModal.id
                      ? "Suppression..."
                      : "Supprimer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEstablishmentContent;
