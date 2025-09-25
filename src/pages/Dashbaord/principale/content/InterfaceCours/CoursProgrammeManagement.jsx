import React, { useState, useEffect } from "react";
import {
  Book,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Filter,
  Search,
  BookOpen,
  Video,
  FileText,
  Activity,
  Eye,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  User,
  GraduationCap,
} from "lucide-react";
import onBack from "prop-types";
// Mock data - Replace with actual API calls
const mockClasses = [
  {
    id: "1",
    nom: "Mathématiques 2nde A",
    niveau: "Seconde",
    effectif: 32,
    codeActivation: "MATH2A2024",
  },
  {
    id: "2",
    nom: "Français 1ère B",
    niveau: "Première",
    effectif: 28,
    codeActivation: "FR1B2024",
  },
  {
    id: "3",
    nom: "Physique Terminale",
    niveau: "Terminale",
    effectif: 25,
    codeActivation: "PHY2024",
  },
];

const mockScheduledCourses = [
  {
    id: "1",
    cours: {
      id: "c1",
      titre: "Les fonctions polynômes",
      description: "Introduction aux fonctions polynômes du second degré",
      matieres: [{ nom: "Mathématiques" }],
    },
    classeId: "1",
    dateCoursPrevue: "2024-12-15T10:00:00Z",
    dateDebutEffectif: "2024-12-15T10:05:00Z",
    dateFinEffectif: "2024-12-15T11:35:00Z",
    lieu: "Salle 203",
    etatCoursProgramme: "PLANIFIE",
    capaciteMax: 32,
    participantsIds: ["p1", "p2", "p3"],
    description: "Cours sur les fonctions polynômes avec exercices pratiques",
  },
  {
    id: "2",
    cours: {
      id: "c2",
      titre: "Équations du second degré",
      description:
        "Résolution des équations du second degré - méthodes et applications",
      matieres: [{ nom: "Mathématiques" }],
    },
    classeId: "1",
    dateCoursPrevue: "2024-12-18T14:00:00Z",
    dateDebutEffectif: null,
    dateFinEffectif: null,
    lieu: "Salle 203",
    etatCoursProgramme: "PLANIFIE",
    capaciteMax: 32,
    participantsIds: ["p1", "p2", "p3"],
    description: "Méthodes de résolution avec discriminant",
  },
  {
    id: "3",
    cours: {
      id: "c3",
      titre: "Analyse littéraire",
      description: "Analyse de textes littéraires du 19ème siècle",
      matieres: [{ nom: "Français" }],
    },
    classeId: "2",
    dateCoursPrevue: "2024-12-16T09:00:00Z",
    dateDebutEffectif: "2024-12-16T09:00:00Z",
    dateFinEffectif: "2024-12-16T10:30:00Z",
    lieu: "Salle 105",
    etatCoursProgramme: "EN_COURS",
    capaciteMax: 28,
    participantsIds: ["p4", "p5"],
    description: "Étude des œuvres de Balzac et Zola",
  },
  {
    id: "4",
    cours: {
      id: "c4",
      titre: "Mécanique quantique",
      description:
        "Introduction aux concepts fondamentaux de la mécanique quantique",
      matieres: [{ nom: "Physique" }],
    },
    classeId: "3",
    dateCoursPrevue: "2024-12-20T15:00:00Z",
    dateDebutEffectif: "2024-12-20T15:10:00Z",
    dateFinEffectif: "2024-12-20T16:40:00Z",
    lieu: "Laboratoire Physique",
    etatCoursProgramme: "TERMINE",
    capaciteMax: 25,
    participantsIds: ["p6", "p7", "p8"],
    description: "Principes de base et expériences pratiques",
  },
];

const CoursProgrammeManagement = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [scheduledCourses, setScheduledCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetail, setShowCourseDetail] = useState(false);

  // Initialize data
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setClasses(mockClasses);
      setLoading(false);
    }, 500);
  }, []);

  // Load courses when class is selected
  useEffect(() => {
    if (selectedClass) {
      setLoading(true);
      // Simulate API call to load courses for selected class
      setTimeout(() => {
        const classScheduledCourses = mockScheduledCourses.filter(
          (course) => course.classeId === selectedClass.id
        );
        setScheduledCourses(classScheduledCourses);
        setFilteredCourses(classScheduledCourses);
        setLoading(false);
      }, 300);
    }
  }, [selectedClass]);

  // Filter courses based on search and status
  useEffect(() => {
    let filtered = scheduledCourses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.cours.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.cours.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          course.lieu.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "TOUS") {
      filtered = filtered.filter(
        (course) => course.etatCoursProgramme === statusFilter
      );
    }

    setFilteredCourses(filtered);
  }, [searchTerm, statusFilter, scheduledCourses]);

  const getStatusColor = (status) => {
    switch (status) {
      case "PLANIFIE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "EN_COURS":
        return "bg-green-100 text-green-800 border-green-200";
      case "TERMINE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "ANNULE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PLANIFIE":
        return <Clock className="w-3 h-3" />;
      case "EN_COURS":
        return <PlayCircle className="w-3 h-3" />;
      case "TERMINE":
        return <CheckCircle className="w-3 h-3" />;
      case "ANNULE":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PLANIFIE":
        return "Planifié";
      case "EN_COURS":
        return "En cours";
      case "TERMINE":
        return "Terminé";
      case "ANNULE":
        return "Annulé";
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClassSelect = (classe) => {
    setSelectedClass(classe);
    setSearchTerm("");
    setStatusFilter("TOUS");
  };

  const handleBackToClasses = () => {
    onBack(); // Call the parent's back function
    setScheduledCourses([]);
    setFilteredCourses([]);
    setShowCourseDetail(false);
    setSelectedCourse(null);
  };
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
  };

  const handleBackToCourses = () => {
    setShowCourseDetail(false);
    setSelectedCourse(null);
  };

  if (showCourseDetail && selectedCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackToCourses}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold flex items-center">
                      <BookOpen className="w-6 h-6 mr-3" />
                      Détails du cours
                    </h1>
                    <p className="text-blue-100 mt-1">{selectedClass.nom}</p>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-full border ${getStatusColor(
                    selectedCourse.etatCoursProgramme
                  )} bg-white/20 text-white border-white/30`}
                >
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedCourse.etatCoursProgramme)}
                    <span className="font-medium">
                      {getStatusText(selectedCourse.etatCoursProgramme)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Info Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedCourse.cours.titre}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {selectedCourse.cours.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center space-x-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      <Book className="w-4 h-4" />
                      <span>{selectedCourse.cours.matieres[0]?.nom}</span>
                    </div>
                  </div>
                </div>

                {selectedCourse.description && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Notes du cours
                    </h3>
                    <p className="text-gray-700">
                      {selectedCourse.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Schedule Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                  Planning du cours
                </h3>

                <div className="space-y-4">
                  {/* Planned Date */}
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Date prévue</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedCourse.dateCoursPrevue)} à{" "}
                        {formatTime(selectedCourse.dateCoursPrevue)}
                      </p>
                    </div>
                  </div>

                  {/* Actual Dates */}
                  {selectedCourse.dateDebutEffectif && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <PlayCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Début effectif
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(selectedCourse.dateDebutEffectif)} à{" "}
                            {formatTime(selectedCourse.dateDebutEffectif)}
                          </p>
                        </div>
                      </div>

                      {selectedCourse.dateFinEffectif && (
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Fin effective
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(selectedCourse.dateFinEffectif)} à{" "}
                              {formatTime(selectedCourse.dateFinEffectif)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Location Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                  Lieu
                </h3>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-gray-900">
                    {selectedCourse.lieu}
                  </span>
                </div>
              </div>

              {/* Participants Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-indigo-600" />
                  Participants
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-gray-700">
                        Participants inscrits
                      </span>
                    </div>
                    <span className="font-bold text-indigo-600">
                      {selectedCourse.participantsIds.length}
                    </span>
                  </div>
                  {selectedCourse.capaciteMax && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-gray-700">
                          Capacité maximale
                        </span>
                      </div>
                      <span className="font-bold text-indigo-600">
                        {selectedCourse.capaciteMax}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Actions
                </h3>
                <div className="space-y-3">
                  {selectedCourse.etatCoursProgramme === "EN_COURS" && (
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                      <Video className="w-4 h-4" />
                      <span>Rejoindre le cours</span>
                    </button>
                  )}

                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Voir les ressources</span>
                  </button>

                  <button className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Exercices</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center">
                    <GraduationCap className="w-8 h-8 mr-4" />
                    Mes Cours Programmés
                  </h1>
                  <p className="text-indigo-100 mt-2 text-lg">
                    Sélectionnez une classe pour voir les cours programmés
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-100 text-sm">Élève</p>
                  <p className="font-semibold text-lg">
                    Interface d'apprentissage
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune classe disponible
                  </h3>
                  <p className="text-gray-600">
                    Vous n'êtes inscrit à aucune classe pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((classe) => (
                    <div
                      key={classe.id}
                      onClick={() => handleClassSelect(classe)}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">
                              {classe.nom}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {classe.niveau}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-indigo-400 mt-1" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{classe.effectif} élèves</span>
                          </div>

                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Code:
                              </span>
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {classe.codeActivation}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToClasses}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center">
                    <Calendar className="w-6 h-6 mr-3" />
                    Cours Programmés
                  </h1>
                  <p className="text-blue-100 mt-1">
                    {selectedClass.nom} - {selectedClass.niveau}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">
                  {filteredCourses.length} cours
                </p>
                <p className="font-semibold">{selectedClass.effectif} élèves</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TOUS">Tous les statuts</option>
                  <option value="PLANIFIE">Planifiés</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminés</option>
                  <option value="ANNULE">Annulés</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {scheduledCourses.length === 0
                    ? "Aucun cours programmé"
                    : "Aucun cours trouvé"}
                </h3>
                <p className="text-gray-600">
                  {scheduledCourses.length === 0
                    ? "Il n'y a actuellement aucun cours programmé pour cette classe."
                    : "Aucun cours ne correspond à vos critères de recherche."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-lg text-gray-900">
                              {course.cours.titre}
                            </h3>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                course.etatCoursProgramme
                              )}`}
                            >
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(course.etatCoursProgramme)}
                                <span>
                                  {getStatusText(course.etatCoursProgramme)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {course.cours.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0 ml-2" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Book className="w-4 h-4" />
                            <span>{course.cours.matieres[0]?.nom}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{course.lieu}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(course.dateCoursPrevue)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(course.dateCoursPrevue)}</span>
                          </div>
                        </div>

                        {course.participantsIds.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600">
                              {course.participantsIds.length} participant
                              {course.participantsIds.length > 1 ? "s" : ""}
                              {course.capaciteMax && ` / ${course.capaciteMax}`}
                            </span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCourseSelect(course);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Voir détails</span>
                            </button>

                            {course.etatCoursProgramme === "EN_COURS" && (
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1"
                              >
                                <Video className="w-3 h-3" />
                                <span>Rejoindre</span>
                              </button>
                            )}

                            {course.etatCoursProgramme === "PLANIFIE" && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                À venir
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Statistics Card */}
        {filteredCourses.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-600" />
              Statistiques des cours
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {
                    scheduledCourses.filter(
                      (c) => c.etatCoursProgramme === "PLANIFIE"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Planifiés</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {
                    scheduledCourses.filter(
                      (c) => c.etatCoursProgramme === "EN_COURS"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">En cours</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 mb-1">
                  {
                    scheduledCourses.filter(
                      (c) => c.etatCoursProgramme === "TERMINE"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Terminés</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {scheduledCourses.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursProgrammeManagement;
