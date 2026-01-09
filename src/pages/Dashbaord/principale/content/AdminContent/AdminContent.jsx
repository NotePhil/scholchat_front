import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Shield,
  ChevronDown,
  Activity,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  fetchAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  setSearchTerm,
  setFilterStatus,
  setViewMode,
  clearError,
  clearSuccess,
} from "../../../../../store/slices/adminSlice";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useSelector as useReduxSelector } from "react-redux";

const AdminModal = ({
  showModal,
  setShowModal,
  modalMode,
  selectedAdmin,
  onSuccess,
  onError,
  loading,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
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

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalMode === "create") {
        await dispatch(createAdmin(formData)).unwrap();
      } else {
        await dispatch(
          updateAdmin({ id: selectedAdmin.id, data: formData })
        ).unwrap();
      }
      onSuccess();
      setShowModal(false);
    } catch (err) {
      onError(err.message);
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
                    ? t('admin.modals.create')
                    : t('admin.modals.edit')}
                </h2>
                <p className="text-slate-600">
                  {modalMode === "create"
                    ? t('admin.modals.createDesc')
                    : t('admin.modals.editDesc')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('admin.form.lastName')} *
              </label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder={t('admin.form.lastNamePlaceholder')}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('admin.form.firstName')} *
              </label>
              <input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => handleInputChange("prenom", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder={t('admin.form.firstNamePlaceholder')}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('admin.form.email')} *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('admin.form.phone')}
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleInputChange("telephone", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="0123456789"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('admin.form.address')}
              </label>
              <textarea
                value={formData.adresse}
                onChange={(e) => handleInputChange("adresse", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
                placeholder="Entrez l'adresse complète"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('admin.form.status')}
              </label>
              <select
                value={formData.etat}
                onChange={(e) => handleInputChange("etat", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                disabled={loading}
              >
                <option value="ACTIVE">{t('admin.status.active')}</option>
                <option value="INACTIVE">{t('admin.status.inactive')}</option>
                <option value="PENDING">{t('admin.status.pending')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              disabled={loading}
            >
              {t('admin.actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{modalMode === "create" ? t('admin.actions.create') : t('admin.actions.edit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({
  showDeleteConfirm,
  setShowDeleteConfirm,
  selectedAdmin,
  onConfirm,
  loading,
}) => {
  const { t } = useTranslation();
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
                {t('admin.modal.confirmDelete')}
              </h3>
              <p className="text-slate-600 mt-1">
                {t('admin.modal.irreversible')}
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">
              {t('admin.modal.deleteConfirmText')} {" "}
              <span className="font-semibold">
                {selectedAdmin?.prenom} {selectedAdmin?.nom}
              </span>{" "}
              ?
            </p>
            <p className="text-red-700 text-sm mt-2">
              {t('admin.modal.dataLossWarning')}
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium disabled:opacity-50"
            >
              {t('admin.actions.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t('admin.actions.delete')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminViewModal = ({ admin, onClose }) => {
  const { t } = useTranslation();
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
    return t(`admin.status.${status?.toLowerCase()}`) || status;
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
                    {t('admin.role.administrator')}
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
          <div className="bg-slate-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              {t('admin.modal.contactInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  {t('admin.form.email')}
                </label>
                <div className="text-slate-900">{admin.email}</div>
              </div>
              {admin.telephone && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    {t('admin.form.phone')}
                  </label>
                  <div className="text-slate-900">{admin.telephone}</div>
                </div>
              )}
            </div>
            {admin.adresse && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  {t('admin.form.address')}
                </label>
                <div className="text-slate-900">{admin.adresse}</div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              {t('admin.modal.accountInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  {t('admin.form.creationDate')}
                </label>
                <div className="text-slate-900">
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
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            {t('admin.actions.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, gradient, subtext, color }) => (
  <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-600 text-sm font-medium">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className={`p-3 bg-gradient-to-r ${gradient} rounded-xl`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="mt-4 flex items-center">
      <Activity className="w-4 h-4 text-slate-400 mr-2" />
      <span className="text-slate-500 text-sm">{subtext}</span>
    </div>
  </div>
);

const AdminCard = ({ admin, onView, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
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
    return t(`admin.status.${status?.toLowerCase()}`) || status;
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">
              {getInitials(admin.prenom, admin.nom)}
            </span>
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
      </div>

      <div className="space-y-2 text-sm text-slate-600 mb-4">
        <div className="truncate">{admin.email}</div>
        {admin.telephone && <div>{admin.telephone}</div>}
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
        <button
          onClick={() => onView(admin)}
          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
          title={t('admin.actions.view')}
        >
          <Eye size={16} />
        </button>
        <button
          onClick={() => onEdit(admin)}
          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
          title={t('admin.actions.edit')}
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(admin)}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title={t('admin.actions.delete')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export const useAdmins = () => {
  const dispatch = useDispatch();
  const adminState = useSelector((state) => state.admin);
  const { user, userRole, userRoles } = useSelector((state) => state.auth);

  const loadAdmins = useCallback(() => {
    dispatch(fetchAdmins());
  }, [dispatch]);

  const handleCreateAdmin = useCallback(
    (adminData) => {
      return dispatch(createAdmin(adminData)).unwrap();
    },
    [dispatch]
  );

  const handleUpdateAdmin = useCallback(
    ({ id, data }) => {
      return dispatch(updateAdmin({ id, data })).unwrap();
    },
    [dispatch]
  );

  const handleDeleteAdmin = useCallback(
    (adminId) => {
      return dispatch(deleteAdmin(adminId)).unwrap();
    },
    [dispatch]
  );

  const handleSearchChange = useCallback(
    (searchTerm) => {
      dispatch(setSearchTerm(searchTerm));
    },
    [dispatch]
  );

  const handleFilterChange = useCallback(
    (filterStatus) => {
      dispatch(setFilterStatus(filterStatus));
    },
    [dispatch]
  );

  const handleViewModeChange = useCallback(
    (viewMode) => {
      dispatch(setViewMode(viewMode));
    },
    [dispatch]
  );

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleClearSuccess = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);

  const canManageAdmins = useMemo(() => {
    const allowedRoles = [
      "ROLE_ADMIN",
      "ROLE_SUPER_ADMIN",
      "admin",
      "super_admin",
    ];

    if (userRole && allowedRoles.includes(userRole.toLowerCase())) {
      return true;
    }

    if (userRoles && userRoles.length > 0) {
      return userRoles.some((role) =>
        allowedRoles.includes(role.toLowerCase())
      );
    }

    return false;
  }, [userRole, userRoles]);

  return {
    ...adminState,
    loadAdmins,
    handleCreateAdmin,
    handleUpdateAdmin,
    handleDeleteAdmin,
    handleSearchChange,
    handleFilterChange,
    handleViewModeChange,
    handleClearError,
    handleClearSuccess,
    canManageAdmins,
    currentUser: user,
  };
};

const AdminContent = ({ isDark, currentTheme, themes, colorSchemes }) => {
  const { t } = useTranslation();
  const language = useReduxSelector((state) => state.ui?.currentLanguage || 'fr');
  const {
    admins,
    filteredAdmins,
    loading,
    error,
    success,
    searchTerm,
    filterStatus,
    viewMode,
    loadAdmins,
    handleCreateAdmin,
    handleUpdateAdmin,
    handleDeleteAdmin,
    handleSearchChange,
    handleFilterChange,
    handleViewModeChange,
    handleClearError,
    handleClearSuccess,
    canManageAdmins,
    currentUser,
  } = useAdmins();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => handleClearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, handleClearError]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => handleClearSuccess(), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, handleClearSuccess]);

  // FIX: Add safe access for admins array
  const stats = useMemo(
    () => ({
      total: admins?.length || 0,
      active: (admins || []).filter((a) => a.etat === "ACTIVE").length,
      pending: (admins || []).filter((a) => a.etat === "PENDING").length,
    }),
    [admins]
  );

  // FIX: Add safe access for filteredAdmins
  const safeFilteredAdmins = useMemo(() => {
    return filteredAdmins || admins || [];
  }, [filteredAdmins, admins]);

  const handleViewAdmin = useCallback((admin) => {
    setCurrentAdmin(admin);
    setIsViewModalOpen(true);
  }, []);

  const handleEditAdmin = useCallback((admin) => {
    setModalMode("edit");
    setSelectedAdmin(admin);
    setShowModal(true);
  }, []);

  const handleDeleteClick = useCallback((admin) => {
    setSelectedAdmin(admin);
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await handleDeleteAdmin(selectedAdmin.id);
      setShowDeleteConfirm(false);
      setSelectedAdmin(null);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
    }
  }, [selectedAdmin, handleDeleteAdmin]);

  const handleCreateClick = useCallback(() => {
    setModalMode("create");
    setSelectedAdmin(null);
    setShowModal(true);
  }, []);

  const handleModalSuccess = useCallback(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleModalError = useCallback((errorMessage) => {
    console.error("Modal error:", errorMessage);
  }, []);

  // FIX: Update loading condition to handle undefined admins
  if (loading && (!admins || admins.length === 0)) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin text-purple-600" size={48} />
          <p className="text-slate-600 font-medium">
            {t('admin.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span>{success}</span>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'}`}>
                {t('admin.title')}
              </h1>
              <p className="text-slate-600 mt-1">
                {t('admin.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title={t('admin.stats.total')}
            value={stats.total}
            icon={Shield}
            gradient="from-purple-500 to-purple-600"
            color="text-slate-900"
            subtext={t('admin.stats.systemAdmins')}
          />
          <StatsCard
            title={t('admin.stats.active')}
            value={stats.active}
            icon={UserCheck}
            gradient="from-emerald-500 to-emerald-600"
            color="text-emerald-600"
            subtext={t('admin.stats.validatedAccounts')}
          />
          <StatsCard
            title={t('admin.stats.pending')}
            value={stats.pending}
            icon={Users}
            gradient="from-amber-500 to-amber-600"
            color="text-amber-600"
            subtext={t('admin.stats.validationRequired')}
          />
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder={t('admin.search.placeholder')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Filter
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="pl-12 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">{t('admin.search.allStatuses')}</option>
                  <option value="ACTIVE">{t('admin.status.active')}</option>
                  <option value="INACTIVE">{t('admin.status.inactive')}</option>
                  <option value="PENDING">{t('admin.status.pending')}</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
              </div>

              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => handleViewModeChange("grid")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t('admin.search.grid')}
                </button>
                <button
                  onClick={() => handleViewModeChange("table")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t('admin.search.table')}
                </button>
              </div>

              {canManageAdmins && (
                <button
                  onClick={handleCreateClick}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  <Plus size={20} />
                  {t('admin.search.newAdmin')}
                </button>
              )}
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeFilteredAdmins.map((admin) => (
              <AdminCard
                key={admin.id}
                admin={admin}
                onView={handleViewAdmin}
                onEdit={handleEditAdmin}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('admin.table.administrator')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('admin.table.contact')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('admin.table.status')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('admin.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 divide-y divide-slate-100">
                  {safeFilteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="hover:bg-white/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white font-medium text-sm">
                              {`${admin.prenom?.charAt(0) || ""}${
                                admin.nom?.charAt(0) || ""
                              }`.toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">
                              {admin.prenom} {admin.nom}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-slate-900">
                            {admin.email}
                          </div>
                          {admin.telephone && (
                            <div className="text-sm text-slate-500">
                              {admin.telephone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            admin.etat === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : admin.etat === "INACTIVE"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {t(`admin.status.${admin.etat?.toLowerCase()}`) || admin.etat}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleViewAdmin(admin)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                            title={t('admin.actions.view')}
                          >
                            <Eye size={16} />
                          </button>
                          {canManageAdmins && (
                            <>
                              <button
                                onClick={() => handleEditAdmin(admin)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title={t('admin.actions.edit')}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(admin)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title={t('admin.actions.delete')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {safeFilteredAdmins.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? t('admin.empty.noResults')
                  : t('admin.empty.noAdmins')}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? t('admin.empty.noResultsDesc')
                  : t('admin.empty.noAdminsDesc')}
              </p>
              {!searchTerm && filterStatus === "all" && canManageAdmins && (
                <button
                  onClick={handleCreateClick}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto"
                >
                  <Plus size={20} />
                  {t('admin.empty.addAdmin')}
                </button>
              )}
            </div>
          </div>
        )}

        {loading && admins && admins.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4">
                <Loader2 className="animate-spin text-purple-600" size={24} />
                <p className="text-slate-700 font-medium">
                  {t('admin.processing')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdminModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        selectedAdmin={selectedAdmin}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
        loading={loading}
      />

      <DeleteConfirmationModal
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        selectedAdmin={selectedAdmin}
        onConfirm={handleDeleteConfirm}
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
