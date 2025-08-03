import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  FileText,
  Star,
  TrendingUp,
  Activity,
  Grid,
  List,
  Download,
  Share2,
  Archive,
  X,
} from "lucide-react";
import { coursService } from "../../../services/CoursService";
import { matiereService } from "../../../services/MatiereService";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const COURSE_STATES = {
  BROUILLON: "BROUILLON",
  EN_ATTENTE_VALIDATION: "EN_ATTENTE_VALIDATION",
  PUBLIE: "PUBLIE",
  ARCHIVE: "ARCHIVE",
};

const courseSchema = yup.object().shape({
  titre: yup.string().required("Le titre est requis"),
  description: yup.string().required("La description est requise"),
  contenu: yup.string().required("Le contenu est requis"),
  matiereIds: yup
    .array()
    .of(yup.string().required())
    .min(1, "Au moins une matière est requise"),
  dateHeureDebut: yup.date().required("La date de début est requise"),
  dateHeureFin: yup.date().required("La date de fin est requise"),
  lieu: yup.string().required("Le lieu est requis"),
});

// Multi-select dropdown component
const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  placeholder,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (optionId) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    onChange(newSelected);
  };

  const getSelectedLabels = () => {
    return options
      .filter((option) => selected.includes(option.id))
      .map((option) => option.nom)
      .join(", ");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-left flex items-center justify-between ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      >
        <span
          className={
            selected.length === 0 ? "text-slate-400" : "text-slate-900"
          }
        >
          {selected.length === 0 ? placeholder : getSelectedLabels()}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between ${
                selected.includes(option.id)
                  ? "bg-indigo-50 text-indigo-900"
                  : "text-slate-700"
              }`}
            >
              <span>{option.nom}</span>
              {selected.includes(option.id) && (
                <CheckCircle className="w-4 h-4 text-indigo-600" />
              )}
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-4 py-3 text-slate-500 text-center">
              Aucune matière disponible
            </div>
          )}
        </div>
      )}

      {/* Selected items display */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {options
            .filter((option) => selected.includes(option.id))
            .map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
              >
                {option.nom}
                <button
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className="ml-2 hover:text-indigo-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

const ProfessorCoursesContent = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [subjects, setSubjects] = useState([]);
  const [selectedMatiereIds, setSelectedMatiereIds] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      matiereIds: [],
    },
  });

  // Watch matiereIds to sync with local state
  const watchedMatiereIds = watch("matiereIds");

  useEffect(() => {
    loadCourses();
    loadSubjects();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterStatus]);

  // Sync selectedMatiereIds with form
  useEffect(() => {
    setSelectedMatiereIds(watchedMatiereIds || []);
  }, [watchedMatiereIds]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error("ID du professeur non trouvé");
      }
      const coursesData = await coursService.getCoursByProfesseur(professorId);
      setCourses(coursesData || []);
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Erreur lors du chargement des cours: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const subjectsData = await matiereService.getAllMatieres();
      setSubjects(subjectsData || []);
    } catch (err) {
      console.error("Error loading subjects:", err);
      setError("Erreur lors du chargement des matières: " + err.message);
    }
  };

  const filterCourses = () => {
    let filtered = courses;
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          course.matiere?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((course) => course.etat === filterStatus);
    }
    setFilteredCourses(filtered);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error("ID du professeur non trouvé");
      }

      const courseData = {
        titre: data.titre,
        description: data.description,
        contenu: data.contenu,
        matiereIds: selectedMatiereIds,
        redacteurId: professorId,
        etat: "BROUILLON",
        dateCreation: new Date().toISOString(),
        references: data.references || "",
      };

      console.log("Submitting course data:", courseData);

      let result;
      if (modalMode === "create") {
        result = await coursService.createCours(courseData);
        console.log("Course creation result:", result);
      } else {
        result = await coursService.updateCours(selectedCourse.id, courseData);
        console.log("Course update result:", result);
      }

      // Handle scheduling if dates and location are provided
      if (data.dateHeureDebut && data.dateHeureFin && data.lieu) {
        try {
          const scheduleData = {
            coursId: result.id || selectedCourse?.id,
            dateCoursPrevue: data.dateHeureDebut,
            dateDebutEffectif: data.dateHeureDebut,
            dateFinEffectif: data.dateHeureFin,
            lieu: data.lieu,
            etatCoursProgramme: "PLANIFIE",
            classeId: data.classeId,
          };

          await coursService.scheduleCours(
            result.id || selectedCourse?.id,
            scheduleData
          );
          console.log("Course scheduled successfully");
        } catch (scheduleError) {
          console.warn(
            "Course created but scheduling failed:",
            scheduleError.message
          );
          // Don't fail the entire operation if scheduling fails
        }
      }

      // Update courses list
      if (modalMode === "create") {
        setCourses([result, ...courses]);
        setSuccess("Cours créé avec succès !");
      } else {
        setCourses(
          courses.map((c) => (c.id === selectedCourse.id ? result : c))
        );
        setSuccess("Cours modifié avec succès !");
      }

      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error("Error in onSubmit:", err);
      setError("Erreur lors de l'enregistrement: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset({
      titre: "",
      description: "",
      contenu: "",
      matiereIds: [],
      dateHeureDebut: "",
      dateHeureFin: "",
      lieu: "",
    });
    setSelectedMatiereIds([]);
  };

  const handleMatiereChange = (newSelectedIds) => {
    setSelectedMatiereIds(newSelectedIds);
    setValue("matiereIds", newSelectedIds, { shouldValidate: true });
  };

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
    return texts[status] || status;
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
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCreateCourse = () => {
    setModalMode("create");
    setSelectedCourse(null);
    setShowCreateModal(true);
    resetForm();
  };

  const handleEditCourse = (course) => {
    setModalMode("edit");
    setSelectedCourse(course);
    setShowCreateModal(true);

    // Set form values
    reset({
      titre: course.titre,
      description: course.description,
      contenu: course.contenu,
      matiereIds: course.matiereIds || [],
      dateHeureDebut: course.dateHeureDebut,
      dateHeureFin: course.dateHeureFin,
      lieu: course.lieu,
    });

    // Set selected matiere IDs
    setSelectedMatiereIds(course.matiereIds || []);
  };

  const getInitials = (title) => {
    return (
      title
        ?.split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase() || "CO"
    );
  };

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-hide error message after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
              style={{ clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)" }}
            ></div>
          </div>
          <p className="text-slate-600 font-medium">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Mes Cours
              </h1>
              <p className="text-slate-600 mt-1">
                Gérez vos cours et suivez vos programmes d'enseignement
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="ml-3">
                  <p className="text-green-800 font-medium">Succès</p>
                  <p className="text-green-700 text-sm mt-1">{success}</p>
                </div>
              </div>
              <button
                onClick={() => setSuccess("")}
                className="text-green-400 hover:text-green-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="ml-3">
                  <p className="text-red-800 font-medium">Erreur</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">
                  Total Cours
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {courses.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">Tous les cours</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Brouillon</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {courses.filter((c) => c.etat === "BROUILLON").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Activity className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">Non publiés</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">En attente</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {
                    courses.filter((c) => c.etat === "EN_ATTENTE_VALIDATION")
                      .length
                  }
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">En validation</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Publiés</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {courses.filter((c) => c.etat === "PUBLIE").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Star className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">Disponibles</span>
            </div>
          </div>
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
                placeholder="Rechercher par titre, description, matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
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
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-12 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="BROUILLON">Brouillon</option>
                  <option value="EN_ATTENTE_VALIDATION">En attente</option>
                  <option value="PUBLIE">Publié</option>
                  <option value="ARCHIVE">Archivé</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
              </div>

              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>

              <button
                onClick={handleCreateCourse}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <Plus size={20} />
                Nouveau Cours
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">
                          {getInitials(course.titre)}
                        </span>
                      </div>
                      <div className="absolute -top-1 -right-1">
                        {getStatusIcon(course.etat)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {course.titre}
                      </h3>
                      <p className="text-sm text-slate-600 truncate">
                        {course.matiere?.nom || "Matière non définie"}
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
                      course.etat
                    )}`}
                  >
                    {getStatusText(course.etat)}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {course.description || "Aucune description disponible"}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar size={14} className="mr-2 text-slate-400" />
                    <span>Début: {formatDate(course.dateHeureDebut)}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Clock size={14} className="mr-2 text-slate-400" />
                    <span>Fin: {formatDate(course.dateHeureFin)}</span>
                  </div>
                  {course.lieu && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Users size={14} className="mr-2 text-slate-400" />
                      <span className="truncate">{course.lieu}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Voir les détails"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
                    title="Partager"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
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
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cours
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Matière
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Planning
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
                  {filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className="hover:bg-white/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-white font-medium text-sm">
                                {getInitials(course.titre)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">
                              {course.titre}
                            </div>
                            <div className="text-sm text-slate-500 line-clamp-1">
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
                          <div className="mr-2">
                            {getStatusIcon(course.etat)}
                          </div>
                          {getStatusText(course.etat)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Voir les détails"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
                            title="Partager"
                          >
                            <Share2 size={16} />
                          </button>
                          <button
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

        {filteredCourses.length === 0 && !loading && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "Aucun cours trouvé"
                  : "Aucun cours créé"}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Essayez de modifier vos critères de recherche ou de filtrage."
                  : "Commencez par créer votre premier cours pour vos étudiants."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <button
                  onClick={handleCreateCourse}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto"
                >
                  <Plus size={20} />
                  Créer mon premier cours
                </button>
              )}
            </div>
          </div>
        )}

        {loading && courses.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-indigo-200 rounded-full animate-spin"></div>
                  <div
                    className="w-8 h-8 border-4 border-indigo-600 rounded-full animate-spin absolute top-0 left-0"
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {modalMode === "create"
                    ? "Nouveau Cours"
                    : "Modifier le Cours"}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="titre"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Titre du cours *
                  </label>
                  <input
                    id="titre"
                    type="text"
                    {...register("titre")}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      errors.titre ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="Introduction à la programmation"
                  />
                  {errors.titre && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.titre.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Description *
                  </label>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      errors.description ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="Décrivez le contenu de ce cours..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contenu"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Contenu détaillé *
                  </label>
                  <textarea
                    id="contenu"
                    {...register("contenu")}
                    rows={5}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      errors.contenu ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="Détaillez le contenu du cours..."
                  />
                  {errors.contenu && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.contenu.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Matières associées *
                  </label>
                  <MultiSelectDropdown
                    options={subjects}
                    selected={selectedMatiereIds}
                    onChange={handleMatiereChange}
                    placeholder="Sélectionnez une ou plusieurs matières..."
                    error={errors.matiereIds}
                  />
                  {errors.matiereIds && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.matiereIds.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="dateHeureDebut"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Date et heure de début *
                    </label>
                    <input
                      id="dateHeureDebut"
                      type="datetime-local"
                      {...register("dateHeureDebut")}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                        errors.dateHeureDebut
                          ? "border-red-300"
                          : "border-slate-200"
                      }`}
                    />
                    {errors.dateHeureDebut && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.dateHeureDebut.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="dateHeureFin"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Date et heure de fin *
                    </label>
                    <input
                      id="dateHeureFin"
                      type="datetime-local"
                      {...register("dateHeureFin")}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                        errors.dateHeureFin
                          ? "border-red-300"
                          : "border-slate-200"
                      }`}
                    />
                    {errors.dateHeureFin && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.dateHeureFin.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lieu"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Lieu *
                  </label>
                  <input
                    id="lieu"
                    type="text"
                    {...register("lieu")}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      errors.lieu ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="Salle 203, Bâtiment A"
                  />
                  {errors.lieu && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lieu.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {modalMode === "create"
                          ? "Création..."
                          : "Sauvegarde..."}
                      </span>
                    ) : modalMode === "create" ? (
                      "Créer"
                    ) : (
                      "Sauvegarder"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorCoursesContent;
