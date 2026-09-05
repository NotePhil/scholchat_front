import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { scholchatService } from "../../../../../services/ScholchatService";
import accederService from "../../../../../services/accederService";
import parentService from "../../../../../services/parentService";
import ParentModal from "../../modals/ParentModal";
import DeleteConfirmationModal from "../../modals/DeleteConfirmationModal";
import UserViewModalParentStudent from "../../modals/UserViewModalParentStudent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faCalendarDays,
  faChevronDown,
  faClock,
  faEllipsisVertical,
  faEnvelope,
  faEye,
  faFilter,
  faHeartPulse,
  faLocationDot,
  faMagnifyingGlass,
  faPen,
  faPhone,
  faPlus,
  faTrashCan,
  faUser,
  faUserCheck,
  faUserXmark,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
const ParentsContent = () => {
  const { t } = useTranslation();
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedParent, setSelectedParent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role) {
      setUserRole(role.toUpperCase());
    }
    loadData();
  }, []);
  useEffect(() => {
    filterParents();
  }, [parents, searchTerm, filterStatus]);
  const loadData = async () => {
    try {
      setLoading(true);
      const role = localStorage.getItem("userRole")?.toUpperCase();
      const userId = localStorage.getItem("userId");
      let rawParents;
      if (role === "PROFESSOR" || role === "ROLE_PROFESSOR") {
        rawParents = await parentService.getParentsByProfesseur(userId);
      } else {
        rawParents = await scholchatService.getAllParents();
      }
      const safeParents = Array.isArray(rawParents) ? rawParents : [];
      const enriched = await Promise.all(
        safeParents.map(async (p) => {
          try {
            p.classes = await accederService.obtenirClassesAccessibles(p.id);
          } catch {
            p.classes = [];
          }
          try {
            p.enfants = await parentService.getChildren(p.id);
          } catch {
            p.enfants = [];
          }
          return p;
        }),
      );
      setParents(enriched);
      setClasses([]);
    } catch (err) {
      setError(t("parents.errors.loadData") + err.message);
    } finally {
      setLoading(false);
    }
  };
  const filterParents = () => {
    const safeParents = Array.isArray(parents) ? parents : [];
    let filtered = safeParents;
    if (searchTerm) {
      filtered = filtered.filter(
        (parent) =>
          parent.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          parent.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          parent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          parent.telephone?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((parent) => parent.etat === filterStatus);
    }
    setFilteredParents(filtered);
  };
  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
      INACTIVE: "bg-red-50 text-red-700 border-red-200",
      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
      AWAITING_VALIDATION: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };
  const getStatusText = (status) => {
    const statusMap = {
      ACTIVE: t("parents.status.active"),
      INACTIVE: t("parents.status.inactive"),
      PENDING: t("parents.status.pending"),
      AWAITING_VALIDATION: t("parents.status.awaitingValidation"),
    };
    return statusMap[status] || status;
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full"></div>
        );
      case "INACTIVE":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
        );
      case "PENDING":
      case "AWAITING_VALIDATION":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full animate-pulse"></div>
        );
      default:
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full"></div>
        );
    }
  };
  const handleDelete = async () => {
    try {
      setLoading(true);
      await scholchatService.deleteParent(selectedParent.id);
      await loadData();
      setShowDeleteConfirm(false);
      setSelectedParent(null);
    } catch (err) {
      setError(t("parents.errors.delete") + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleViewUser = (parent) => {
    setCurrentUser(parent);
    setIsViewModalOpen(true);
  };
  const handleSuccess = () => {
    setIsViewModalOpen(false);
    loadData();
  };
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };
  const isAdmin = userRole === "ADMIN" || userRole === "ROLE_ADMIN";
  if (loading && parents.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
              style={{
                clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
              }}
            ></div>
          </div>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            {t("parents.loading.data")}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="full-bleed-page">
      <div className="w-full px-3 sm:px-6 py-3 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
              <FontAwesomeIcon
                icon={faUser}
                className="w-4 h-4 sm:w-6 sm:h-6 text-white"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {t("parents.title")}
              </h1>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm">
                {t("parents.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 relative">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="w-2 h-2 sm:w-3 sm:h-3 text-white"
                    />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-red-800 font-medium text-sm">
                    {t("common.messages.error")}
                  </p>
                  <p className="text-red-700 text-xs sm:text-sm mt-1">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="flex-shrink-0 ml-4 text-red-400 hover:text-red-600 transition-colors"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="hidden md:grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div
            onClick={() => setFilterStatus("all")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${filterStatus === "all" ? "ring-2 ring-blue-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  {t("parents.stats.total")}
                </p>
                <p className="text-lg sm:text-3xl font-bold text-slate-900 mt-1">
                  {Array.isArray(parents) ? parents.length : 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="w-3 h-3 sm:w-6 sm:h-6 text-white"
                />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <FontAwesomeIcon
                icon={faHeartPulse}
                className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1 sm:mr-2"
              />
              <span className="text-slate-500 text-xs sm:text-sm">
                {t("parents.stats.registered")}
              </span>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("ACTIVE")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${filterStatus === "ACTIVE" ? "ring-2 ring-emerald-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  {t("parents.stats.active")}
                </p>
                <p className="text-lg sm:text-3xl font-bold text-emerald-600 mt-1">
                  {
                    (Array.isArray(parents) ? parents : []).filter(
                      (p) => p.etat === "ACTIVE",
                    ).length
                  }
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl">
                <FontAwesomeIcon
                  icon={faUserCheck}
                  className="w-3 h-3 sm:w-6 sm:h-6 text-white"
                />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">
                {t("parents.stats.validated")}
              </span>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("PENDING")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${filterStatus === "PENDING" ? "ring-2 ring-amber-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  {t("parents.stats.pending")}
                </p>
                <p className="text-lg sm:text-3xl font-bold text-amber-600 mt-1">
                  {
                    (Array.isArray(parents) ? parents : []).filter(
                      (p) =>
                        p.etat === "PENDING" ||
                        p.etat === "AWAITING_VALIDATION",
                    ).length
                  }
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg sm:rounded-xl">
                <FontAwesomeIcon
                  icon={faClock}
                  className="w-3 h-3 sm:w-6 sm:h-6 text-white"
                />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full animate-pulse mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">
                {t("parents.stats.validation")}
              </span>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("INACTIVE")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${filterStatus === "INACTIVE" ? "ring-2 ring-red-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  {t("parents.stats.inactive")}
                </p>
                <p className="text-lg sm:text-3xl font-bold text-red-600 mt-1">
                  {
                    (Array.isArray(parents) ? parents : []).filter(
                      (p) => p.etat === "INACTIVE",
                    ).length
                  }
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg sm:rounded-xl">
                <FontAwesomeIcon
                  icon={faUserXmark}
                  className="w-3 h-3 sm:w-6 sm:h-6 text-white"
                />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">
                {t("parents.stats.deactivated")}
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg mb-6 sm:mb-8">
          <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:space-x-6">
            <div className="relative flex-1 max-w-full lg:max-w-md">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                style={{
                  fontSize: 16,
                }}
              />
              <input
                type="text"
                placeholder={t("parents.search.placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3 min-[480px]:gap-2 sm:gap-4">
              <div className="relative flex-1 min-[480px]:flex-none min-w-0">
                <FontAwesomeIcon
                  icon={faFilter}
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  style={{
                    fontSize: 14,
                  }}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-8 sm:pl-12 pr-6 sm:pr-8 py-2 sm:py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">{t("parents.search.allStatuses")}</option>
                  <option value="ACTIVE">{t("parents.status.active")}</option>
                  <option value="INACTIVE">
                    {t("parents.status.inactive")}
                  </option>
                  <option value="PENDING">{t("parents.status.pending")}</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  style={{
                    fontSize: 14,
                  }}
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-600 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon
                    icon={faArrowsRotate}
                    className={`sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
                    style={{
                      fontSize: 14,
                    }}
                  />
                  Actualiser
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setModalMode("create");
                      setSelectedParent(null);
                      setShowModal(true);
                    }}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 sm:gap-2"
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="sm:w-4 sm:h-4"
                      style={{
                        fontSize: 14,
                      }}
                    />
                    {t("parents.actions.add")}
                  </button>
                )}

                <div className="flex bg-slate-100 rounded-lg sm:rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {t("parents.actions.grid")}
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {t("parents.actions.table")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredParents.map((parent) => (
              <div
                key={parent.id}
                className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                <div className="p-3 sm:p-5 pb-2 sm:pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xs sm:text-lg">
                            {getInitials(parent.prenom, parent.nom)}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          {getStatusIcon(parent.etat)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 mb-1">
                          {parent.prenom} {parent.nom}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium border ${getStatusBadge(parent.etat)}`}
                        >
                          {getStatusText(parent.etat)}
                        </span>
                      </div>
                    </div>
                    <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <FontAwesomeIcon
                        icon={faEllipsisVertical}
                        className="sm:w-4 sm:h-4"
                        style={{
                          fontSize: 12,
                        }}
                      />
                    </button>
                  </div>
                </div>

                <div className="px-3 sm:px-5 pb-3 sm:pb-4 flex-grow space-y-2 sm:space-y-3">
                  <div className="flex items-center text-xs sm:text-sm text-slate-600">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
                      style={{
                        fontSize: 10,
                      }}
                    />
                    <span className="truncate">{parent.email}</span>
                  </div>

                  {parent.telephone && (
                    <div className="flex items-center text-xs sm:text-sm text-slate-600">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
                        style={{
                          fontSize: 10,
                        }}
                      />
                      <span className="truncate">{parent.telephone}</span>
                    </div>
                  )}

                  {parent.adresse && (
                    <div className="flex items-center text-xs sm:text-sm text-slate-600">
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
                        style={{
                          fontSize: 10,
                        }}
                      />
                      <span className="truncate">{parent.adresse}</span>
                    </div>
                  )}

                  <div className="flex items-center text-xs sm:text-sm text-slate-600">
                    <FontAwesomeIcon
                      icon={faCalendarDays}
                      className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
                      style={{
                        fontSize: 10,
                      }}
                    />
                    <span className="truncate">
                      {t("parents.card.registeredOn")}{" "}
                      {new Date(parent.creationDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-1 sm:pt-2">
                    <p className="text-xs font-medium text-slate-500 mb-1 sm:mb-2">
                      {t("parents.card.associatedClasses")}
                    </p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {parent.classes?.length > 0 ? (
                        <>
                          {parent.classes.slice(0, 2).map((cls) => (
                            <span
                              key={cls.id}
                              className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-full"
                            >
                              {cls.nom}
                            </span>
                          ))}
                          {parent.classes.length > 2 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              +{parent.classes.length - 2}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {t("parents.card.noClassAssociated")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-3 sm:px-5 py-2 sm:py-3 border-t border-slate-100">
                  <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                    <button
                      onClick={() => handleViewUser(parent)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title={t("parents.actions.view")}
                    >
                      <FontAwesomeIcon
                        icon={faEye}
                        className="sm:w-4 sm:h-4"
                        style={{
                          fontSize: 12,
                        }}
                      />
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedParent(parent);
                            setShowModal(true);
                          }}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                          title={t("parents.actions.edit")}
                        >
                          <FontAwesomeIcon
                            icon={faPen}
                            className="sm:w-4 sm:h-4"
                            style={{
                              fontSize: 12,
                            }}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedParent(parent);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title={t("parents.actions.delete")}
                        >
                          <FontAwesomeIcon
                            icon={faTrashCan}
                            className="sm:w-4 sm:h-4"
                            style={{
                              fontSize: 12,
                            }}
                          />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("parents.table.parent")}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("parents.table.contact")}
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("parents.table.registrationDate")}
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("parents.table.associatedClasses")}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("parents.table.status")}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t("parents.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 divide-y divide-slate-100">
                  {filteredParents.map((parent) => (
                    <tr
                      key={parent.id}
                      className="hover:bg-white/50 transition-colors duration-200"
                    >
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative flex-shrink-0">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-white font-medium text-xs sm:text-sm">
                                {getInitials(parent.prenom, parent.nom)}
                              </span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5">
                              {getStatusIcon(parent.etat)}
                            </div>
                          </div>
                          <div className="ml-2 sm:ml-4 min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {parent.prenom} {parent.nom}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center truncate">
                              <FontAwesomeIcon
                                icon={faLocationDot}
                                className="mr-1 flex-shrink-0"
                                style={{
                                  fontSize: 10,
                                }}
                              />
                              <span className="truncate">
                                {parent.adresse ||
                                  t("parents.table.notSpecified")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <div className="space-y-1">
                          <div className="text-xs sm:text-sm text-slate-900 flex items-center">
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              className="mr-1 sm:mr-2 text-slate-400 flex-shrink-0"
                              style={{
                                fontSize: 10,
                              }}
                            />
                            <span className="truncate">{parent.email}</span>
                          </div>
                          {parent.telephone && (
                            <div className="text-xs text-slate-500 flex items-center">
                              <FontAwesomeIcon
                                icon={faPhone}
                                className="mr-1 sm:mr-2 text-slate-400 flex-shrink-0"
                                style={{
                                  fontSize: 10,
                                }}
                              />
                              <span className="truncate">
                                {parent.telephone}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-slate-900">
                          {new Date(parent.creationDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4">
                        <div className="flex flex-wrap gap-1">
                          {parent.classes?.length > 0 ? (
                            <>
                              {parent.classes.slice(0, 2).map((cls) => (
                                <span
                                  key={cls.id}
                                  className="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate"
                                >
                                  {cls.nom}
                                </span>
                              ))}
                              {parent.classes.length > 2 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  +{parent.classes.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs sm:text-sm text-slate-400">
                              {t("parents.table.noClass")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium border ${getStatusBadge(parent.etat)}`}
                        >
                          <div
                            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-1 sm:mr-2 ${parent.etat === "ACTIVE" ? "bg-emerald-500" : parent.etat === "PENDING" || parent.etat === "AWAITING_VALIDATION" ? "bg-amber-500" : "bg-red-500"}`}
                          ></div>
                          {getStatusText(parent.etat)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleViewUser(parent)}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title={t("parents.actions.view")}
                          >
                            <FontAwesomeIcon
                              icon={faEye}
                              className="sm:w-4 sm:h-4"
                              style={{
                                fontSize: 12,
                              }}
                            />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setModalMode("edit");
                                  setSelectedParent(parent);
                                  setShowModal(true);
                                }}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title={t("parents.actions.edit")}
                              >
                                <FontAwesomeIcon
                                  icon={faPen}
                                  className="sm:w-4 sm:h-4"
                                  style={{
                                    fontSize: 12,
                                  }}
                                />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedParent(parent);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title={t("parents.actions.delete")}
                              >
                                <FontAwesomeIcon
                                  icon={faTrashCan}
                                  className="sm:w-4 sm:h-4"
                                  style={{
                                    fontSize: 12,
                                  }}
                                />
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

        {/* Empty State */}
        {filteredParents.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <FontAwesomeIcon
                  icon={faUser}
                  className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? t("parents.search.noResults")
                  : t("parents.search.noParents")}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? t("parents.search.noResultsDesc")
                  : t("parents.search.noParentsDesc")}
              </p>
              {!searchTerm && filterStatus === "all" && isAdmin && (
                <button
                  onClick={() => {
                    setModalMode("create");
                    setSelectedParent(null);
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto text-sm sm:text-base"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="sm:w-5 sm:h-5"
                    style={{
                      fontSize: 16,
                    }}
                  />
                  {t("parents.search.addParent")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && parents.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
                    style={{
                      clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                    }}
                  ></div>
                </div>
                <p className="text-slate-700 font-medium text-sm sm:text-base">
                  {t("parents.loading.processing")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isAdmin && (
        <>
          <ParentModal
            showModal={showModal}
            setShowModal={setShowModal}
            modalMode={modalMode}
            selectedParent={selectedParent}
            classes={classes}
            loadData={loadData}
            setError={setError}
            setLoading={setLoading}
          />

          <DeleteConfirmationModal
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            selectedUser={selectedParent}
            handleDelete={handleDelete}
            loading={loading}
            userType="parent"
          />
        </>
      )}

      {isViewModalOpen && (
        <UserViewModalParentStudent
          user={currentUser}
          onClose={() => setIsViewModalOpen(false)}
          onSuccess={handleSuccess}
          userType="parent"
        />
      )}
    </div>
  );
};
export default ParentsContent;
