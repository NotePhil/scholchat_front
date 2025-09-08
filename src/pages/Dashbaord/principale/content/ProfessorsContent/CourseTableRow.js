import React from "react";
import {
  Eye,
  Edit2,
  Trash2,
  Share2,
  FileText,
  Clock,
  CheckCircle,
  Archive,
  AlertCircle,
} from "lucide-react";

const CourseTableRow = ({ course, onView, onEdit, getInitials }) => {
  // Early return if course is undefined or null
  if (!course) {
    return (
      <tr className="animate-pulse">
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-slate-200 rounded-xl mr-4"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="h-4 bg-slate-200 rounded w-20"></div>
        </td>
        <td className="px-6 py-4">
          <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
          <div className="h-3 bg-slate-200 rounded w-20"></div>
        </td>
        <td className="px-6 py-4">
          <div className="h-6 bg-slate-200 rounded-full w-16"></div>
        </td>
        <td className="px-6 py-4">
          <div className="flex justify-end space-x-1">
            <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
          </div>
        </td>
      </tr>
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

  // Safe function to get initials with fallback
  const safeGetInitials = (title) => {
    if (!title) return "CO";
    if (typeof getInitials === "function") {
      return getInitials(title);
    }
    return title.substring(0, 2).toUpperCase();
  };

  return (
    <tr className="hover:bg-white/50 transition-colors duration-200">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-medium text-sm">
                {safeGetInitials(course.titre)}
              </span>
            </div>
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 break-words leading-tight">
              {course.titre || "Titre non défini"}
            </div>
            <div className="text-xs text-slate-500 line-clamp-1 mt-1">
              {course.description || "Aucune description"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900">
          {course.matiere?.nom || "Non définie"}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-900">
          {formatDate(course.dateHeureDebut)}
        </div>
        <div className="text-sm text-slate-500">
          {formatDate(course.dateHeureFin)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
            course.etat
          )}`}
        >
          <div className="mr-2">{getStatusIcon(course.etat)}</div>
          {getStatusText(course.etat)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <div className="flex items-center justify-end space-x-1">
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
      </td>
    </tr>
  );
};

export default CourseTableRow;
