import React from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Eye,
  X,
  Check,
  Calendar,
  Key,
  Mail,
  CreditCard,
  Power,
  PowerOff,
  History,
  Trash2,
  GraduationCap,
  School,
  Users,
  MapPin,
  Phone,
  User,
  Clock,
  Shield,
  Star,
  Building2,
  Globe,
} from "lucide-react";
import {
  classService,
  EtatClasse,
  DroitPublication,
} from "../../../services/ClassService";
import ClassEditModal from "./ClassEditPage";

const ClassModals = ({
  selectedClass,
  setSelectedClass,
  editingClass,
  setEditingClass,
  handleEditSave,
  actionLoading,
  showDeleteModal,
  setShowDeleteModal,
  showApprovalModal,
  setShowApprovalModal,
  showDeactivationModal,
  setShowDeactivationModal,
  showAccessRequestModal,
  setShowAccessRequestModal,
  setActionLoading,
  error,
  setError,
  accessToken,
  setAccessToken,
  deactivationReason,
  setDeactivationReason,
  deactivationComment,
  setDeactivationComment,
  handleApprove,
  handleReject,
  handleDeactivation,
  handleAccessRequest,
  handleDelete,
  loadClasses,
  getStatusColor,
  userRole,
}) => {
  // Mock function to get moderator name from ID
  const getModeratorName = (moderatorId) => {
    const moderators = {
      "550e8400-e29b-41d4-a716-446655440007": "Dr. Marie Dubois",
      "550e8400-e29b-41d4-a716-446655440009": "Prof. Jean Kamga",
      "660e8400-e29b-41d4-a716-446655440999": "M. Paul Nguema",
    };
    return moderators[moderatorId] || "Modérateur inconnu";
  };

  return (
    <>
      {/* Modern View Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-1">
                      {selectedClass.nom}
                    </h2>
                    <p className="text-blue-100 text-lg">
                      {selectedClass.niveau}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="p-3 hover:bg-white/20 rounded-full transition-all duration-200 backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mt-6">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                    selectedClass.etat === "ACTIF"
                      ? "bg-green-500/20 text-green-100 border border-green-400/30"
                      : selectedClass.etat === "EN_ATTENTE_APPROBATION"
                      ? "bg-yellow-500/20 text-yellow-100 border border-yellow-400/30"
                      : "bg-red-500/20 text-red-100 border border-red-400/30"
                  }`}
                >
                  {selectedClass.etat === "ACTIF" && (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {selectedClass.etat === "EN_ATTENTE_APPROBATION" && (
                    <Clock className="w-4 h-4" />
                  )}
                  {selectedClass.etat === "INACTIF" && (
                    <XCircle className="w-4 h-4" />
                  )}
                  {classService.getEtatDisplayName(selectedClass.etat)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Class Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <School className="w-5 h-5 text-blue-600" />
                      Informations de base
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Nom de la classe
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedClass.nom}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Star className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Niveau</p>
                          <p className="font-semibold text-gray-900">
                            {selectedClass.niveau}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Date de création
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedClass.dateCreation
                              ? new Date(
                                  selectedClass.dateCreation
                                ).toLocaleDateString("fr-FR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "Non définie"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Key className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Code d'activation
                          </p>
                          <p className="font-mono font-bold text-lg text-gray-900 bg-gray-50 px-3 py-1 rounded-lg inline-block">
                            {selectedClass.codeActivation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Moderator Section */}
                  {selectedClass.moderator && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        Modérateur
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {getModeratorName(selectedClass.moderator)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Responsable de classe
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Establishment & Stats */}
                <div className="space-y-6">
                  {selectedClass.etablissement && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        Établissement
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="font-semibold text-xl text-gray-900 mb-2">
                            {selectedClass.etablissement.nom}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedClass.etablissement.localisation}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Globe className="w-4 h-4" />
                              {selectedClass.etablissement.pays}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedClass.etablissement.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              Email de contact
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedClass.etablissement.telephone}
                            </p>
                            <p className="text-sm text-gray-600">Téléphone</p>
                          </div>
                        </div>

                        {/* Settings indicators */}
                        <div className="mt-4 p-4 bg-white/50 rounded-xl">
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            Configuration
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Envoi mail vers classe
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  selectedClass.etablissement
                                    .optionEnvoiMailVersClasse
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {selectedClass.etablissement
                                  .optionEnvoiMailVersClasse
                                  ? "Activé"
                                  : "Désactivé"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Token général
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  selectedClass.etablissement.optionTokenGeneral
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {selectedClass.etablissement.optionTokenGeneral
                                  ? "Activé"
                                  : "Désactivé"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Code unique
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  selectedClass.etablissement.codeUnique
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {selectedClass.etablissement.codeUnique
                                  ? "Activé"
                                  : "Désactivé"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-600" />
                      Statistiques
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white/50 rounded-xl">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedClass.eleves?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Élèves</p>
                      </div>
                      <div className="text-center p-4 bg-white/50 rounded-xl">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedClass.parents?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Parents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Approbation de classe
                  </h3>
                  <p className="text-gray-600">{showApprovalModal.nom}</p>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowApprovalModal(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() =>
                    handleReject(showApprovalModal.id, "Demande rejetée")
                  }
                  disabled={actionLoading === showApprovalModal.id}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Rejeter
                </button>
                <button
                  onClick={() => handleApprove(showApprovalModal.id)}
                  disabled={actionLoading === showApprovalModal.id}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {actionLoading === showApprovalModal.id && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Approuver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Modal */}
      {showDeactivationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <PowerOff className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Désactiver la classe
                  </h3>
                  <p className="text-gray-600">{showDeactivationModal.nom}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif de désactivation
                  </label>
                  <input
                    type="text"
                    value={deactivationReason}
                    onChange={(e) => setDeactivationReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Motif..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire
                  </label>
                  <textarea
                    value={deactivationComment}
                    onChange={(e) => setDeactivationComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Commentaire additionnel..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowDeactivationModal(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() =>
                    handleDeactivation(
                      showDeactivationModal.id,
                      deactivationReason,
                      deactivationComment
                    )
                  }
                  disabled={
                    actionLoading === showDeactivationModal.id ||
                    !deactivationReason
                  }
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {actionLoading === showDeactivationModal.id && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Désactiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Request Modal */}
      {showAccessRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Key className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Demande d'accès à une classe
                  </h3>
                  <p className="text-gray-600">Entrez votre token d'accès</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token d'accès
                  </label>
                  <input
                    type="text"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Entrez votre token..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowAccessRequestModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAccessRequest}
                  disabled={actionLoading === "access-request" || !accessToken}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {actionLoading === "access-request" && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Supprimer la classe
                  </h3>
                  <p className="text-gray-600">Cette action est irréversible</p>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <p className="text-red-800 font-medium">
                  Êtes-vous sûr de vouloir supprimer la classe "
                  {showDeleteModal.nom}" ?
                </p>
                <p className="text-red-700 text-sm mt-1">
                  Toutes les données associées seront perdues définitivement.
                </p>
              </div>
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
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Using the ClassEditModal component */}
      {editingClass && (
        <ClassEditModal
          classe={editingClass}
          onClose={() => setEditingClass(null)}
          onSave={handleEditSave}
          userRole={userRole}
          loading={actionLoading === "edit"}
        />
      )}
    </>
  );
};

export default ClassModals;
