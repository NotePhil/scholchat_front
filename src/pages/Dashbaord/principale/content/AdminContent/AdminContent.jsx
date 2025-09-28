import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  Filter,
  X,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Hash,
  Shield,
  ChevronDown,
  MoreVertical,
  Calendar,
  Activity,
} from "lucide-react";
import { userService } from "../../../../../services/userService";

// Admin Modal Component
const AdminModal = ({
  showModal,
  setShowModal,
  modalMode,
  selectedAdmin,
  loadData,
  setError,
  setLoading,
}) => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    etat: "ACTIVE",
    admin: true,
  });

  useEffect(() => {
    if (modalMode === "edit" && selectedAdmin) {
      setFormData({
        nom: selectedAdmin.nom || "",
        prenom: selectedAdmin.prenom || "",
        email: selectedAdmin.email || "",
        telephone: selectedAdmin.telephone || "",
        adresse: selectedAdmin.adresse || "",
        etat: selectedAdmin.etat || "ACTIVE",
        admin: true,
      });
    } else {
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        adresse: "",
        etat: "ACTIVE",
        admin: true,
      });
    }
  }, [modalMode, selectedAdmin, showModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (modalMode === "create") {
        await userService.createUser(formData);
      } else {
        await userService.updateUser(selectedAdmin.id, formData);
      }
      await loadData();
      setShowModal(false);
    } catch (err) {
      setError(
        `Erreur lors de ${
          modalMode === "create" ? "la création" : "la modification"
        }: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {modalMode === "create"
                    ? "Nouvel Administrateur"
                    : "Modifier l'Administrateur"}
                </h2>
                <p className="text-slate-600">
                  {modalMode === "create"
                    ? "Ajouter un nouvel administrateur au système"
                    : "Modifier les informations de l'administrateur"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="Entrez le nom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) =>
                  setFormData({ ...formData, prenom: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="Entrez le prénom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              placeholder="admin@example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Statut
              </label>
              <select
                value={formData.etat}
                onChange={(e) =>
                  setFormData({ ...formData, etat: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              >
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
                <option value="PENDING">En attente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Adresse
            </label>
            <textarea
              value={formData.adresse}
              onChange={(e) =>
                setFormData({ ...formData, adresse: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
              placeholder="Entrez l'adresse complète"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {modalMode === "create" ? "Créer" : "Modifier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({
  showDeleteConfirm,
  setShowDeleteConfirm,
  selectedAdmin,
  handleDelete,
  loading,
}) => {
  if (!showDeleteConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Confirmer la suppression
              </h3>
              <p className="text-slate-600 mt-1">
                Cette action est irréversible
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">
              Êtes-vous sûr de vouloir supprimer l'administrateur{" "}
              <span className="font-semibold">
                {selectedAdmin?.prenom} {selectedAdmin?.nom}
              </span>{" "}
              ?
            </p>
            <p className="text-red-700 text-sm mt-2">
              Toutes les données associées seront définitivement perdues.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin View Modal
const AdminViewModal = ({ admin, onClose }) => {
  if (!admin) return null;

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
      INACTIVE: "bg-red-50 text-red-700 border-red-200",
      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusText = (status) => {
    const texts = {
      ACTIVE: "Actif",
      INACTIVE: "Inactif",
      PENDING: "En attente",
    };
    return texts[status] || status;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {getInitials(admin.prenom, admin.nom)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {admin.prenom} {admin.nom}
                </h2>
                <div className="flex items-center space-x-3 mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(
                      admin.etat
                    )}`}
                  >
                    {getStatusText(admin.etat)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Administrateur
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="bg-slate-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-slate-600" />
              Informations de Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Email
                </label>
                <div className="flex items-center text-slate-900">
                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                  {admin.email}
                </div>
              </div>
              {admin.telephone && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Téléphone
                  </label>
                  <div className="flex items-center text-slate-900">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {admin.telephone}
                  </div>
                </div>
              )}
            </div>
            {admin.adresse && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Adresse
                </label>
                <div className="flex items-start text-slate-900">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400 mt-0.5" />
                  {admin.adresse}
                </div>
              </div>
            )}
          </div>

          {/* Account Information */}
          <div className="bg-slate-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-slate-600" />
              Informations du Compte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  ID Utilisateur
                </label>
                <div className="flex items-center text-slate-900 font-mono text-sm">
                  <Hash className="w-4 h-4 mr-2 text-slate-400" />
                  {admin.id}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Date de Création
                </label>
                <div className="flex items-center text-slate-900">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  {new Date(admin.creationDate).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-purple-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-purple-600" />
              Permissions & Rôles
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-slate-900">
                    Accès Administrateur
                  </span>
                </div>
                <span className="text-purple-600 font-semibold">Accordé</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-slate-900">
                    Gestion des Utilisateurs
                  </span>
                </div>
                <span className="text-purple-600 font-semibold">Accordé</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-slate-900">
                    Configuration Système
                  </span>
                </div>
                <span className="text-purple-600 font-semibold">Accordé</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Main AdminContent Component
const AdminContent = () => {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getAllUsers();
      // Filter only admin users
      const adminUsers = usersData?.filter((user) => user.admin === true) || [];
      setAdmins(adminUsers);
    } catch (err) {
      setError("Erreur lors du chargement des données: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAdmins = () => {
    let filtered = admins;

    if (searchTerm) {
      filtered = filtered.filter(
        (admin) =>
          admin.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((admin) => admin.etat === filterStatus);
    }

    setFilteredAdmins(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
      INACTIVE: "bg-red-50 text-red-700 border-red-200",
      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusText = (status) => {
    const texts = {
      ACTIVE: "Actif",
      INACTIVE: "Inactif",
      PENDING: "En attente",
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE":
        return <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>;
      case "INACTIVE":
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case "PENDING":
        return (
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
        );
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await userService.deleteUser(selectedAdmin.id);
      await loadData();
      setShowDeleteConfirm(false);
      setSelectedAdmin(null);
    } catch (err) {
      setError("Erreur lors de la suppression: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAdmin = (admin) => {
    setCurrentAdmin(admin);
    setIsViewModalOpen(true);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  if (loading && admins.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin"></div>
            <div
              className="w-16 h-16 border-4 border-purple-600 rounded-full animate-spin absolute top-0 left-0"
              style={{ clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)" }}
            ></div>
          </div>
          <p className="text-slate-600 font-medium">
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Gestion des Administrateurs
              </h1>
              <p className="text-slate-600 mt-1">
                Gérez efficacement les comptes administrateurs du système
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 relative">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-red-800 font-medium">Erreur</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="flex-shrink-0 ml-4 text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">
                  Total Admins
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {admins.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Activity className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">
                Administrateurs système
              </span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Actifs</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {admins.filter((a) => a.etat === "ACTIVE").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              <span className="text-slate-500 text-sm">Comptes validés</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">En attente</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {admins.filter((a) => a.etat === "PENDING").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-slate-500 text-sm">Validation requise</span>
            </div>
          </div>
        </div>

        {/* Modern Controls */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Filter */}
              <div className="relative">
                <Filter
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-12 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="ACTIVE">Actifs</option>
                  <option value="INACTIVE">Inactifs</option>
                  <option value="PENDING">En attente</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
              </div>

              {/* View Toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Grille
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Table
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={() => {
                  setModalMode("create");
                  setSelectedAdmin(null);
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <Plus size={20} />
                Nouvel Admin
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdmins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {getInitials(admin.prenom, admin.nom)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        {getStatusIcon(admin.etat)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {admin.prenom} {admin.nom}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                          admin.etat
                        )} mt-1`}
                      >
                        {getStatusText(admin.etat)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative group/actions">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail size={14} className="mr-2 text-slate-400" />
                    <span className="truncate">{admin.email}</span>
                  </div>

                  {admin.telephone && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone size={14} className="mr-2 text-slate-400" />
                      <span>{admin.telephone}</span>
                    </div>
                  )}

                  {admin.adresse && (
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin size={14} className="mr-2 text-slate-400" />
                      <span className="truncate">{admin.adresse}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-slate-600">
                    <Hash size={14} className="mr-2 text-slate-400" />
                    <span>{admin.id}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleViewAdmin(admin)}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                    title="Voir les détails"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedAdmin(admin);
                      setShowModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAdmin(admin);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Administrateur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 divide-y divide-slate-100">
                  {filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="hover:bg-white/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative flex-shrink-0">
                            <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-white font-medium text-sm">
                                {getInitials(admin.prenom, admin.nom)}
                              </span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5">
                              {getStatusIcon(admin.etat)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">
                              {admin.prenom} {admin.nom}
                            </div>
                            <div className="text-sm text-slate-500 flex items-center">
                              <MapPin size={12} className="mr-1" />
                              {admin.adresse || "Non renseigné"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-slate-900 flex items-center">
                            <Mail size={12} className="mr-2 text-slate-400" />
                            {admin.email}
                          </div>
                          {admin.telephone && (
                            <div className="text-sm text-slate-500 flex items-center">
                              <Phone
                                size={12}
                                className="mr-2 text-slate-400"
                              />
                              {admin.telephone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-900">
                          <Hash size={12} className="mr-1 text-slate-400" />
                          {admin.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            admin.etat
                          )}`}
                        >
                          {getStatusText(admin.etat)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleViewAdmin(admin)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                            title="Voir les détails"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setModalMode("edit");
                              setSelectedAdmin(admin);
                              setShowModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAdmins.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "Aucun résultat trouvé"
                  : "Aucun administrateur enregistré"}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Essayez de modifier vos critères de recherche ou de filtrage pour voir plus de résultats."
                  : "Commencez par ajouter votre premier administrateur au système."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <button
                  onClick={() => {
                    setModalMode("create");
                    setSelectedAdmin(null);
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto"
                >
                  <Plus size={20} />
                  Ajouter un administrateur
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && admins.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-purple-200 rounded-full animate-spin"></div>
                  <div
                    className="w-8 h-8 border-4 border-purple-600 rounded-full animate-spin absolute top-0 left-0"
                    style={{
                      clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                    }}
                  ></div>
                </div>
                <p className="text-slate-700 font-medium">
                  Traitement en cours...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AdminModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        selectedAdmin={selectedAdmin}
        loadData={loadData}
        setError={setError}
        setLoading={setLoading}
      />

      <DeleteConfirmationModal
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        selectedAdmin={selectedAdmin}
        handleDelete={handleDelete}
        loading={loading}
      />

      {isViewModalOpen && (
        <AdminViewModal
          admin={currentAdmin}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminContent;
