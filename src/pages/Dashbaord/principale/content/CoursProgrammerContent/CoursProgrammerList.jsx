import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Eye,
  Edit2,
  XCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  MoreVertical,
  CalendarPlus,
  UserCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const SCHEDULED_COURSE_STATES = {
  PLANIFIE: "PLANIFIE",
  EN_COURS: "EN_COURS",
  TERMINE: "TERMINE",
  ANNULE: "ANNULE",
};

const getStatusBadge = (status) => {
  switch (status) {
    case SCHEDULED_COURSE_STATES.PLANIFIE:
      return "bg-blue-50 text-blue-700 border-blue-200";
    case SCHEDULED_COURSE_STATES.EN_COURS:
      return "bg-green-50 text-green-700 border-green-200";
    case SCHEDULED_COURSE_STATES.TERMINE:
      return "bg-gray-50 text-gray-700 border-gray-200";
    case SCHEDULED_COURSE_STATES.ANNULE:
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case SCHEDULED_COURSE_STATES.PLANIFIE:
      return "Planifié";
    case SCHEDULED_COURSE_STATES.EN_COURS:
      return "En cours";
    case SCHEDULED_COURSE_STATES.TERMINE:
      return "Terminé";
    case SCHEDULED_COURSE_STATES.ANNULE:
      return "Annulé";
    default:
      return "Inconnu";
  }
};

const getStatusIcon = (status) => {
  const className = "w-4 h-4";
  switch (status) {
    case SCHEDULED_COURSE_STATES.PLANIFIE:
      return <Clock className={className} />;
    case SCHEDULED_COURSE_STATES.EN_COURS:
      return <PlayCircle className={className} />;
    case SCHEDULED_COURSE_STATES.TERMINE:
      return <CheckCircle className={className} />;
    case SCHEDULED_COURSE_STATES.ANNULE:
      return <XCircle className={className} />;
    default:
      return <Clock className={className} />;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "Non défini";
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name) => {
  if (!name) return "??";
  const words = name.split(" ");
  return words
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const CoursProgrammerList = ({
  scheduledCourses,
  viewMode,
  onEdit,
  onStart,
  onEnd,
  onCancel,
  onScheduleCourse,
  searchTerm,
  filterStatus,
  classes = [],
  pageSize = 10, // Receive pageSize from parent
  onPageSizeChange, // Receive callback for page size changes
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when filters change or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [scheduledCourses, searchTerm, filterStatus, pageSize]);

  // Get class name by ID
  const getClassName = (classeId) => {
    if (!classeId || !classes.length) return "Classe non définie";
    const classe = classes.find((c) => c.id === classeId);
    return classe ? classe.nom : "Classe non définie";
  };

  // Calculate pagination
  const totalItems = scheduledCourses.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = scheduledCourses.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      const startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2)
      );
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      // Adjust start if we're near the end
      const adjustedStart = Math.max(1, endPage - maxVisiblePages + 1);

      for (let i = adjustedStart; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const ActionButtons = ({ scheduledCourse }) => (
    <>
      {scheduledCourse.etatCoursProgramme === "PLANIFIE" && (
        <button
          onClick={() => onStart(scheduledCourse.id)}
          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
          title="Démarrer"
        >
          <PlayCircle size={16} />
        </button>
      )}
      {scheduledCourse.etatCoursProgramme === "EN_COURS" && (
        <button
          onClick={() => onEnd(scheduledCourse.id)}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          title="Terminer"
        >
          <PauseCircle size={16} />
        </button>
      )}
      {(scheduledCourse.etatCoursProgramme === "PLANIFIE" ||
        scheduledCourse.etatCoursProgramme === "EN_COURS") && (
        <button
          onClick={() =>
            onCancel(scheduledCourse.id, "Annulé par le professeur")
          }
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          title="Annuler"
        >
          <XCircle size={16} />
        </button>
      )}
      <button
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
        title="Voir les détails"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={() => onEdit(scheduledCourse)}
        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
        title="Modifier"
      >
        <Edit2 size={16} />
      </button>
    </>
  );

  const PaginationControls = () => (
    <div className="flex items-center justify-center gap-2 mt-6">
      {/* Previous page button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Page précédente"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              page === currentPage
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next page button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Page suivante"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

  if (scheduledCourses.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg p-12">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
            <CalendarPlus className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchTerm || filterStatus !== "all"
              ? "Aucune programmation trouvée"
              : "Aucun cours programmé"}
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {searchTerm || filterStatus !== "all"
              ? "Essayez de modifier vos critères de recherche ou de filtrage."
              : "Commencez par programmer vos premiers cours pour organiser vos sessions d'enseignement."}
          </p>
          {!searchTerm && filterStatus === "all" && (
            <button
              onClick={onScheduleCourse}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto"
            >
              <Plus size={20} />
              Programmer mon premier cours
            </button>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((scheduledCourse) => (
            <div
              key={scheduledCourse.id}
              className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">
                        {getInitials(scheduledCourse.cours?.titre)}
                      </span>
                    </div>
                    <div className="absolute -top-1 -right-1">
                      {getStatusIcon(scheduledCourse.etatCoursProgramme)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight break-words">
                      {scheduledCourse.cours?.titre}
                    </h3>
                    <p className="text-xs text-slate-600 truncate mt-1">
                      {getClassName(scheduledCourse.classeId)}
                    </p>
                  </div>
                </div>
                <div className="relative group/actions">
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                    scheduledCourse.etatCoursProgramme
                  )}`}
                >
                  {getStatusText(scheduledCourse.etatCoursProgramme)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-slate-600">
                  <Calendar size={14} className="mr-2 text-slate-400" />
                  <span>
                    Prévu: {formatDate(scheduledCourse.dateCoursPrevue)}
                  </span>
                </div>
                {scheduledCourse.lieu && (
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin size={14} className="mr-2 text-slate-400" />
                    <span className="truncate">{scheduledCourse.lieu}</span>
                  </div>
                )}
                {scheduledCourse.capaciteMax && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Users size={14} className="mr-2 text-slate-400" />
                    <span>Capacité: {scheduledCourse.capaciteMax}</span>
                  </div>
                )}
                {scheduledCourse.participantsIds?.length > 0 && (
                  <div className="flex items-center text-sm text-slate-600">
                    <UserCheck size={14} className="mr-2 text-slate-400" />
                    <span>
                      Participants: {scheduledCourse.participantsIds.length}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <ActionButtons scheduledCourse={scheduledCourse} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && <PaginationControls />}
      </>
    );
  }

  return (
    <>
      <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Cours
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Classe
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Lieu
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
              {currentItems.map((scheduledCourse) => (
                <tr
                  key={scheduledCourse.id}
                  className="hover:bg-white/50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-white font-medium text-sm">
                            {getInitials(scheduledCourse.cours?.titre)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 break-words leading-tight">
                          {scheduledCourse.cours?.titre}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1 mt-1">
                          {scheduledCourse.description || "Aucune description"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {getClassName(scheduledCourse.classeId)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">
                      {formatDate(scheduledCourse.dateCoursPrevue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {scheduledCourse.lieu || "Non défini"}
                    </div>
                    {scheduledCourse.capaciteMax && (
                      <div className="text-xs text-slate-500">
                        Cap: {scheduledCourse.capaciteMax}
                      </div>
                    )}
                    {scheduledCourse.participantsIds?.length > 0 && (
                      <div className="text-xs text-slate-500">
                        Participants: {scheduledCourse.participantsIds.length}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                        scheduledCourse.etatCoursProgramme
                      )}`}
                    >
                      <div className="mr-2">
                        {getStatusIcon(scheduledCourse.etatCoursProgramme)}
                      </div>
                      {getStatusText(scheduledCourse.etatCoursProgramme)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end space-x-1">
                      <ActionButtons scheduledCourse={scheduledCourse} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && <PaginationControls />}
    </>
  );
};

export default CoursProgrammerList;
