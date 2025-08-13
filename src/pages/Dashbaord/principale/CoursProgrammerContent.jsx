import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  XCircle,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  X,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  Grid,
  List,
  RefreshCw,
  MapPin,
  UserCheck,
  CalendarPlus,
} from "lucide-react";
import { coursService } from "../../../services/CoursService";
import { classService } from "../../../services/ClassService";
import { coursProgrammerService } from "../../../services/coursProgrammerService";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import accederService from "../../../services/accederService";
import MultiSelectDropdown from "./MultiSelectDropdown";

const SCHEDULED_COURSE_STATES = {
  PLANIFIE: "PLANIFIE",
  EN_COURS: "EN_COURS",
  TERMINE: "TERMINE",
  ANNULE: "ANNULE",
};

const schedulingSchema = yup.object().shape({
  coursId: yup.string().required("Le cours est obligatoire"),
  classeId: yup.string(),
  dateCoursPrevue: yup.string().required("La date prévue est obligatoire"),
  lieu: yup.string().required("Le lieu est obligatoire"),
  description: yup.string(),
  capaciteMax: yup.number().positive().integer(),
  participantsIds: yup.array().of(yup.string()),
});

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

const CoursProgrammerContent = () => {
  const [scheduledCourses, setScheduledCourses] = useState([]);
  const [filteredScheduledCourses, setFilteredScheduledCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedScheduledCourse, setSelectedScheduledCourse] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [classParticipants, setClassParticipants] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schedulingSchema),
    defaultValues: {
      participantsIds: [],
    },
  });

  const watchedParticipants = watch("participantsIds");
  const watchedClassId = watch("classeId");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterScheduledCourses();
  }, [scheduledCourses, searchTerm, filterStatus]);

  useEffect(() => {
    setSelectedParticipants(watchedParticipants || []);
  }, [watchedParticipants]);

  useEffect(() => {
    const fetchClassParticipants = async (classeId) => {
      if (!classeId) {
        setClassParticipants([]);
        return;
      }

      try {
        setLoading(true);
        const participants = await accederService.obtenirUtilisateursAvecAcces(
          classeId
        );
        const formattedParticipants = participants.map((user) => ({
          id: user.id,
          name: user.nomComplet || user.email || `User ${user.id}`,
        }));
        setClassParticipants(formattedParticipants);
      } catch (error) {
        console.error("Error fetching class participants:", error);
        setError("Erreur lors du chargement des participants de la classe");
      } finally {
        setLoading(false);
      }
    };

    if (watchedClassId) {
      fetchClassParticipants(watchedClassId);
    } else {
      setClassParticipants([]);
    }
  }, [watchedClassId]);

  const handleSelectAllParticipants = () => {
    if (selectedParticipants.length === classParticipants.length) {
      handleParticipantChange([]);
    } else {
      handleParticipantChange(classParticipants.map((user) => user.id));
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error("ID du professeur non trouvé");
      }

      const [coursesData, classesData] = await Promise.all([
        coursService.getCoursByProfesseur(professorId),
        classService.obtenirClassesUtilisateur(professorId),
      ]);

      setCourses(coursesData || []);
      setClasses(classesData || []);

      const scheduledPromises = (coursesData || []).map((course) =>
        coursProgrammerService.obtenirProgrammationParCours(course.id)
      );
      const scheduledResults = await Promise.allSettled(scheduledPromises);

      const allScheduledCourses = scheduledResults
        .filter((result) => result.status === "fulfilled" && result.value)
        .flatMap((result, index) =>
          result.value.map((scheduled) => ({
            ...scheduled,
            cours: coursesData[index],
          }))
        );

      setScheduledCourses(allScheduledCourses);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Erreur lors du chargement des données: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterScheduledCourses = () => {
    let filtered = scheduledCourses;

    if (searchTerm) {
      filtered = filtered.filter(
        (scheduled) =>
          scheduled.cours?.titre
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          scheduled.lieu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scheduled.classe?.nom
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (scheduled) => scheduled.etatCoursProgramme === filterStatus
      );
    }

    setFilteredScheduledCourses(filtered);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const scheduleData = {
        coursId: data.coursId,
        classeId: data.classeId || null,
        dateCoursPrevue: data.dateCoursPrevue,
        lieu: data.lieu,
        description: data.description || null,
        capaciteMax: data.capaciteMax ? parseInt(data.capaciteMax) : null,
        participantsIds: selectedParticipants.filter((id) => id),
      };

      if (
        !scheduleData.coursId ||
        !scheduleData.dateCoursPrevue ||
        !scheduleData.lieu
      ) {
        throw new Error("Cours, date prévue et lieu sont obligatoires");
      }

      let result;
      if (modalMode === "create") {
        result = await coursProgrammerService.programmerCours(scheduleData);
        setSuccess("Cours programmé avec succès !");
      } else {
        result = await coursProgrammerService.updateScheduledCours(
          selectedScheduledCourse.id,
          scheduleData
        );
        setSuccess("Programmation modifiée avec succès !");
      }

      setShowScheduleModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error("Error in onSubmit:", err);
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset({
      coursId: "",
      classeId: "",
      dateCoursPrevue: "",
      lieu: "",
      description: "",
      capaciteMax: "",
      participantsIds: [],
    });
    setSelectedParticipants([]);
    setClassParticipants([]);
  };

  const handleScheduleCourse = () => {
    setModalMode("create");
    setSelectedScheduledCourse(null);
    setShowScheduleModal(true);
    resetForm();
  };

  const handleEditSchedule = (scheduledCourse) => {
    setModalMode("edit");
    setSelectedScheduledCourse(scheduledCourse);
    setShowScheduleModal(true);

    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };

    reset({
      coursId: scheduledCourse.coursId,
      classeId: scheduledCourse.classeId || "",
      dateCoursPrevue: formatDateForInput(scheduledCourse.dateCoursPrevue),
      lieu: scheduledCourse.lieu,
      description: scheduledCourse.description || "",
      capaciteMax: scheduledCourse.capaciteMax || "",
      participantsIds: scheduledCourse.participantsIds || [],
    });

    setSelectedParticipants(scheduledCourse.participantsIds || []);
  };

  const handleStartCourse = async (scheduledId) => {
    try {
      setLoading(true);
      await coursProgrammerService.demarrerCours(scheduledId);
      setSuccess("Cours démarré avec succès !");
      loadData();
    } catch (err) {
      setError("Erreur lors du démarrage: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCourse = async (scheduledId) => {
    try {
      setLoading(true);
      await coursProgrammerService.terminerCours(scheduledId);
      setSuccess("Cours terminé avec succès !");
      loadData();
    } catch (err) {
      setError("Erreur lors de la fin: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCourse = async (scheduledId, reason = "") => {
    try {
      setLoading(true);
      await coursProgrammerService.annulerCours(scheduledId, reason);
      setSuccess("Cours annulé avec succès !");
      loadData();
    } catch (err) {
      setError("Erreur lors de l'annulation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantChange = (newSelectedIds) => {
    setSelectedParticipants(newSelectedIds);
    setValue("participantsIds", newSelectedIds, { shouldValidate: true });
  };

  if (loading && scheduledCourses.length === 0) {
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
          <p className="text-slate-600 font-medium">
            Chargement des programmations...
          </p>
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
              <CalendarPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Programmation des Cours
              </h1>
              <p className="text-slate-600 mt-1">
                Planifiez et gérez les sessions de vos cours
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
                  Total Programmé
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {scheduledCourses.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Planifiés</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {
                    scheduledCourses.filter(
                      (c) => c.etatCoursProgramme === "PLANIFIE"
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">En Cours</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {
                    scheduledCourses.filter(
                      (c) => c.etatCoursProgramme === "EN_COURS"
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Terminés</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">
                  {
                    scheduledCourses.filter(
                      (c) => c.etatCoursProgramme === "TERMINE"
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
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
                placeholder="Rechercher par cours, lieu, classe..."
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
                  <option value="PLANIFIE">Planifié</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
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
                onClick={() => loadData()}
                className="p-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                title="Actualiser"
              >
                <RefreshCw size={20} />
              </button>

              <button
                onClick={handleScheduleCourse}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <Plus size={20} />
                Programmer un Cours
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScheduledCourses.map((scheduledCourse) => (
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
                        {scheduledCourse.classe?.nom || "Classe non définie"}
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
                    {scheduledCourse.etatCoursProgramme === "PLANIFIE" && (
                      <button
                        onClick={() => handleStartCourse(scheduledCourse.id)}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                        title="Démarrer"
                      >
                        <PlayCircle size={16} />
                      </button>
                    )}
                    {scheduledCourse.etatCoursProgramme === "EN_COURS" && (
                      <button
                        onClick={() => handleEndCourse(scheduledCourse.id)}
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
                          handleCancelCourse(
                            scheduledCourse.id,
                            "Annulé par le professeur"
                          )
                        }
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Annuler"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Voir les détails"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditSchedule(scheduledCourse)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
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
                  {filteredScheduledCourses.map((scheduledCourse) => (
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
                              {scheduledCourse.description ||
                                "Aucune description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {scheduledCourse.classe?.nom || "Non définie"}
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
                            Participants:{" "}
                            {scheduledCourse.participantsIds.length}
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
                          {scheduledCourse.etatCoursProgramme ===
                            "PLANIFIE" && (
                            <button
                              onClick={() =>
                                handleStartCourse(scheduledCourse.id)
                              }
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                              title="Démarrer"
                            >
                              <PlayCircle size={16} />
                            </button>
                          )}
                          {scheduledCourse.etatCoursProgramme ===
                            "EN_COURS" && (
                            <button
                              onClick={() =>
                                handleEndCourse(scheduledCourse.id)
                              }
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Terminer"
                            >
                              <PauseCircle size={16} />
                            </button>
                          )}
                          <button
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Voir les détails"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditSchedule(scheduledCourse)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          {(scheduledCourse.etatCoursProgramme === "PLANIFIE" ||
                            scheduledCourse.etatCoursProgramme ===
                              "EN_COURS") && (
                            <button
                              onClick={() =>
                                handleCancelCourse(
                                  scheduledCourse.id,
                                  "Annulé par le professeur"
                                )
                              }
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Annuler"
                            >
                              <XCircle size={16} />
                            </button>
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

        {filteredScheduledCourses.length === 0 && !loading && (
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
                  onClick={handleScheduleCourse}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto"
                >
                  <Plus size={20} />
                  Programmer mon premier cours
                </button>
              )}
            </div>
          </div>
        )}

        {loading && scheduledCourses.length > 0 && (
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

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {modalMode === "create"
                    ? "Programmer un Cours"
                    : "Modifier la Programmation"}
                </h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="coursId"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Cours *
                    </label>
                    <select
                      id="coursId"
                      {...register("coursId")}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                        errors.coursId ? "border-red-300" : "border-slate-200"
                      }`}
                    >
                      <option value="">Sélectionnez un cours</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.titre}
                        </option>
                      ))}
                    </select>
                    {errors.coursId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.coursId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="classeId"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Classe
                    </label>
                    <select
                      id="classeId"
                      {...register("classeId")}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                        errors.classeId ? "border-red-300" : "border-slate-200"
                      }`}
                    >
                      <option value="">
                        Sélectionnez une classe (optionnel)
                      </option>
                      {classes.map((classe) => (
                        <option key={classe.id} value={classe.id}>
                          {classe.nom}
                        </option>
                      ))}
                    </select>
                    {errors.classeId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.classeId.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="dateCoursPrevue"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Date prévue du cours *
                  </label>
                  <input
                    id="dateCoursPrevue"
                    type="datetime-local"
                    {...register("dateCoursPrevue")}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      errors.dateCoursPrevue
                        ? "border-red-300"
                        : "border-slate-200"
                    }`}
                  />
                  {errors.dateCoursPrevue && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.dateCoursPrevue.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <label
                      htmlFor="capaciteMax"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Capacité maximale
                    </label>
                    <input
                      id="capaciteMax"
                      type="number"
                      min="1"
                      {...register("capaciteMax")}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                        errors.capaciteMax
                          ? "border-red-300"
                          : "border-slate-200"
                      }`}
                      placeholder="30 (optionnel)"
                    />
                    {errors.capaciteMax && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.capaciteMax.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Description / Notes
                  </label>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Notes spéciales pour cette session..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Participants (optionnel)
                  </label>
                  <MultiSelectDropdown
                    options={classParticipants}
                    selected={selectedParticipants}
                    onChange={handleParticipantChange}
                    placeholder="Sélectionnez un ou plusieurs participants..."
                    error={errors.participantsIds}
                    onSelectAll={handleSelectAllParticipants}
                    disabled={!watchedClassId}
                  />
                  {errors.participantsIds && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.participantsIds.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
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
                          ? "Programmation..."
                          : "Sauvegarde..."}
                      </span>
                    ) : modalMode === "create" ? (
                      "Programmer"
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

export default CoursProgrammerContent;
