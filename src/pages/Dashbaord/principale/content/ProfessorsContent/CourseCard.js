// CourseCard.js
import React from "react";
import {
  Eye,
  Edit2,
  Trash2,
  Share2,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckCircle,
  Archive,
  AlertCircle,
} from "lucide-react";

const CourseCard = ({ course, onView, onEdit, getInitials }) => {
  // Early return if course is undefined
  if (!course) {
    return (
      <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      BROUILLON: "bg-yellow-50 text-yellow-700 border-yellow-200",
      EN_ATTENTE_VALIDATION: "bg-blue-50 text-blue-700 border-blue-200",
      PUBLIE: "bg-green-50 text-green-700 border-green-200",
      ARCHIVE: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusText = (status) => {
    const texts = {
      BROUILLON: "Brouillon",
      EN_ATTENTE_VALIDATION: "En attente",
      PUBLIE: "Publié",
      ARCHIVE: "Archivé",
    };
    return texts[status] || status || "Non défini";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "BROUILLON":
        return <FileText className="w-4 h-4 text-yellow-500" />;
      case "EN_ATTENTE_VALIDATION":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "PUBLIE":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "ARCHIVE":
        return <Archive className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non défini";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">
                {getInitials
                  ? getInitials(course?.titre)
                  : course?.titre?.substring(0, 2).toUpperCase() || "CO"}
              </span>
            </div>
            <div className="absolute -top-1 -right-1">
              {getStatusIcon(course?.etat)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight break-words">
              {course?.titre || "Titre non défini"}
            </h3>
            <p className="text-xs text-slate-600 truncate mt-1">
              {course?.matiere?.nom || "Matière non définie"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
            course?.etat
          )}`}
        >
          {getStatusText(course?.etat)}
        </span>
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
        {course?.description || "Aucune description disponible"}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-slate-600">
          <Calendar size={14} className="mr-2 text-slate-400" />
          <span>Début: {formatDate(course?.dateHeureDebut)}</span>
        </div>
        <div className="flex items-center text-sm text-slate-600">
          <Clock size={14} className="mr-2 text-slate-400" />
          <span>Fin: {formatDate(course?.dateHeureFin)}</span>
        </div>
        {course?.lieu && (
          <div className="flex items-center text-sm text-slate-600">
            <Users size={14} className="mr-2 text-slate-400" />
            <span className="truncate">{course.lieu}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
        <button
          onClick={() => onView?.(course)}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          title="Voir les détails"
          disabled={!course}
        >
          <Eye size={16} />
        </button>
        <button
          onClick={() => onEdit?.(course)}
          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
          title="Modifier"
          disabled={!course}
        >
          <Edit2 size={16} />
        </button>
        <button
          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
          title="Partager"
          disabled={!course}
        >
          <Share2 size={16} />
        </button>
        <button
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          title="Supprimer"
          disabled={!course}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
