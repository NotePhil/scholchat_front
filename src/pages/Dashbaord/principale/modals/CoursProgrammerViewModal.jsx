import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  User,
  School,
  PlayCircle,
  CheckCircle,
  XCircle,
  Edit2,
  AlertCircle,
  CalendarPlus,
  UserCheck,
  BookOpen,
  Timer,
  UserX,
  Activity,
} from "lucide-react";
import AccederService from "../../../../services/accederService";
import liveSessionService from "../../../../services/LiveSessionService";

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
  const className = "w-5 h-5";
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

const formatDateOnly = (dateString) => {
  if (!dateString) return "Non défini";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTimeOnly = (dateString) => {
  if (!dateString) return "Non défini";
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-FR", {
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

const CoursProgrammerViewModal = ({
  scheduledCourse,
  onClose,
  onEdit,
  onStart,
  onEnd,
  onCancel,
  classes = [],
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingSessionHistory, setLoadingSessionHistory] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!scheduledCourse) {
        setParticipants([]);
        return;
      }

      console.log("[CoursProgrammerViewModal] Fetching participants for course:", {
        courseId: scheduledCourse?.cours?.id,
        hasSpecificParticipants: scheduledCourse.participantsIds?.length > 0,
        specificParticipantIds: scheduledCourse.participantsIds,
        classIds: scheduledCourse.classesIds,
        scheduledCourse: scheduledCourse
      });

      try {
        setLoadingParticipants(true);
        const accessToken = localStorage.getItem('accessToken');
        
        let expectedParticipants = [];
        
        // Determine expected participants based on course programming logic
        if (scheduledCourse.participantsIds && scheduledCourse.participantsIds.length > 0) {
          // Specific participants were selected
          const participantDetails = await Promise.all(
            scheduledCourse.participantsIds.map(async (participantId) => {
              try {
                const response = await fetch(
                  `${process.env.REACT_APP_API_BASE_URL}/utilisateurs/${participantId}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                    },
                  }
                );
                
                if (!response.ok) {
                  console.warn(`Failed to fetch user ${participantId}`);
                  return null;
                }
                
                const user = await response.json();
                const firstName = user.prenom || "";
                const lastName = user.nom || "";
                const fullName = `${firstName} ${lastName}`.trim();
                
                return {
                  id: user.id,
                  name: fullName || user.email || `User ${user.id}`,
                  email: user.email || "",
                  type: user.role || user.type || "USER",
                  originalData: user,
                };
              } catch (error) {
                console.error(`Error fetching user ${participantId}:`, error);
                return null;
              }
            })
          );
          expectedParticipants = participantDetails.filter(Boolean);
        } else if (scheduledCourse.classesIds && scheduledCourse.classesIds.length > 0) {
          // No specific participants - get all students from the class
          try {
            const classId = scheduledCourse.classesIds[0]; // Take first class
            const classUsersResponse = await fetch(
              `${process.env.REACT_APP_API_BASE_URL}/acceder/classes/${classId}/utilisateurs`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );
            
            if (classUsersResponse.ok) {
              const classUsers = await classUsersResponse.json();
              console.log("[CoursProgrammerViewModal] Raw class users response:", classUsers);
              
              // Filter to only include students (exclude professors but keep parents and other types)
              expectedParticipants = classUsers
                .filter(user => {
                  const userType = (user.typeUtilisateur || "").toUpperCase();
                  // Only exclude professors - keep students, parents, repetiteurs, etc.
                  const isNotProfessor = !userType.includes("PROFESSEUR");
                  console.log(`[CoursProgrammerViewModal] User ${user.id} (${user.prenom} ${user.nom}) type: ${userType}, included: ${isNotProfessor}`);
                  return isNotProfessor;
                })
                .map(user => {
                  const firstName = user.prenom || "";
                  const lastName = user.nom || "";
                  const fullName = `${firstName} ${lastName}`.trim();
                  
                  return {
                    id: user.id,
                    name: fullName || user.email || `User ${user.id}`,
                    email: user.email || "",
                    type: user.typeUtilisateur || "USER",
                    originalData: user,
                  };
                });
              
              console.log("[CoursProgrammerViewModal] Filtered expected participants:", expectedParticipants);
            } else {
              console.error("[CoursProgrammerViewModal] Failed to fetch class users:", classUsersResponse.status, classUsersResponse.statusText);
            }
          } catch (error) {
            console.error("[CoursProgrammerViewModal] Error fetching class students:", error);
          }
        }

        const validParticipants = expectedParticipants
          .sort((a, b) => a.name.localeCompare(b.name));

        setParticipants(validParticipants);
        console.log(`[AttendanceModal] Expected participants for course:`, {
          hasSpecificParticipants: scheduledCourse.participantsIds?.length > 0,
          totalExpected: validParticipants.length,
          participants: validParticipants.map(p => ({ id: p.id, name: p.name }))
        });
      } catch (error) {
        console.error("Error fetching participants:", error);
        setParticipants([]);
      } finally {
        setLoadingParticipants(false);
      }
    };

    const fetchSessionHistory = async () => {
      if (!scheduledCourse?.cours?.id) {
        setSessionHistory([]);
        return;
      }

      try {
        setLoadingSessionHistory(true);
        console.log("[AttendanceModal] Fetching session history for course:", scheduledCourse.cours.id);
        
        const sessions = await liveSessionService.getCourseSessionHistory(scheduledCourse.cours.id);
        console.log("[AttendanceModal] Received session history:", sessions);
        
        if (sessions && sessions.length > 0) {
          sessions.forEach((session, index) => {
            console.log(`[AttendanceModal] Session ${index + 1}:`, {
              id: session.sessionId,
              status: session.status,
              participants: session.participants?.length || 0,
              participantDetails: session.participants
            });
          });
        }
        
        setSessionHistory(sessions || []);
      } catch (error) {
        console.error("[AttendanceModal] Error fetching session history:", error);
        setSessionHistory([]);
      } finally {
        setLoadingSessionHistory(false);
      }
    };

    // Fetch data when modal opens or scheduledCourse changes
    if (scheduledCourse) {
      fetchParticipants();
      fetchSessionHistory();
    }
  }, [scheduledCourse]); // Remove activeTab dependency

  if (!scheduledCourse) {
    return null;
  }

  const getClassName = (scheduledCourse) => {
    const classeId = getClassId(scheduledCourse);
    if (!classeId || !classes.length) return "Classe non définie";
    const classe = classes.find((c) => c.id === classeId);
    return classe ? classe.nom : "Classe non définie";
  };

  const getClassDetails = (scheduledCourse) => {
    const classeId = getClassId(scheduledCourse);
    if (!classeId || !classes.length) return null;
    return classes.find((c) => c.id === classeId);
  };
  
  const getClassId = (scheduledCourse) => {
    // Handle both old format (classeId) and new format (classesIds array)
    if (scheduledCourse?.classeId) {
      return scheduledCourse.classeId;
    }
    if (scheduledCourse?.classesIds && scheduledCourse.classesIds.length > 0) {
      return scheduledCourse.classesIds[0]; // Take first class if multiple
    }
    return null;
  };

  const handleCancelWithReason = () => {
    onCancel(scheduledCourse.id, cancelReason);
    setShowCancelReason(false);
    setCancelReason("");
    onClose();
  };

  const classDetails = getClassDetails(scheduledCourse);
  const currentClassId = getClassId(scheduledCourse);

  return createPortal(
    <div className="fixed inset-0 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                <CalendarPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate">
                  <span className="hidden sm:inline">Détails de la Programmation</span>
                  <span className="sm:hidden">Détails</span>
                </h2>
                <p className="text-slate-600 mt-1 text-sm truncate">
                  {scheduledCourse.cours?.titre}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <span
                className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusBadge(
                  scheduledCourse.etatCoursProgramme
                )}`}
              >
                <div className="mr-1 sm:mr-2">
                  {getStatusIcon(scheduledCourse.etatCoursProgramme)}
                </div>
                <span className="hidden sm:inline">{getStatusText(scheduledCourse.etatCoursProgramme)}</span>
              </span>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-4 sm:px-8 overflow-x-auto">
          <div className="flex space-x-4 sm:space-x-6">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "details"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Détails
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "participants"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Participants ({participants.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "history"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Historique
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-8">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-8">
                {/* Course Information */}
                <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-4 sm:p-8 shadow-lg border border-slate-200">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                    Informations du Cours
                  </h3>

                  <div className="space-y-6">
                    {/* Course Header */}
                    <div className="flex items-center space-x-3 sm:space-x-6">
                      <div className="relative">
                        <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl">
                          <span className="text-white font-bold text-xl sm:text-2xl">
                            {getInitials(scheduledCourse.cours?.titre)}
                          </span>
                        </div>
                        <div className="absolute -bottom-2 -right-2">
                          <div
                            className={`w-6 h-6 rounded-full border-4 border-white ${
                              scheduledCourse.etatCoursProgramme ===
                              "PLANIFIE"
                                ? "bg-blue-500"
                                : scheduledCourse.etatCoursProgramme ===
                                  "EN_COURS"
                                ? "bg-green-500"
                                : scheduledCourse.etatCoursProgramme ===
                                  "TERMINE"
                                ? "bg-gray-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-lg sm:text-2xl font-bold text-slate-900">
                          {scheduledCourse.cours?.titre}
                        </div>
                        <div className="text-slate-600 font-medium mt-1">
                          Classe: {getClassName(scheduledCourse)}
                        </div>
                      </div>
                    </div>

                    {/* Course Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 font-medium">
                              Date Prévue
                            </p>
                            <p className="text-slate-900">
                              {formatDate(scheduledCourse.dateCoursPrevue)}
                            </p>
                          </div>
                        </div>

                        {scheduledCourse.dateDebutEffectif && (
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                              <PlayCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 font-medium">
                                Début Effectif
                              </p>
                              <p className="text-slate-900">
                                {formatDate(
                                  scheduledCourse.dateDebutEffectif
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {scheduledCourse.dateFinEffectif && (
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-50 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 font-medium">
                                Fin Effective
                              </p>
                              <p className="text-slate-900">
                                {formatDate(scheduledCourse.dateFinEffectif)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <MapPin className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 font-medium">
                              Lieu
                            </p>
                            <p className="text-slate-900">
                              {scheduledCourse.lieu || "Non défini"}
                            </p>
                          </div>
                        </div>

                        {scheduledCourse.capaciteMax && (
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                              <Users className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 font-medium">
                                Capacité
                              </p>
                              <p className="text-slate-900">
                                {scheduledCourse.capaciteMax} places
                              </p>
                            </div>
                          </div>
                        )}

                        {scheduledCourse.duree && (
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                              <Timer className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 font-medium">
                                Durée
                              </p>
                              <p className="text-slate-900">
                                {scheduledCourse.duree} minutes
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {scheduledCourse.description && (
                    <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                        Description
                      </h4>
                      <p className="text-slate-700 leading-relaxed">
                        {scheduledCourse.description}
                      </p>
                    </div>
                  )}

                  {/* Class Information */}
                  <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <School className="w-5 h-5 mr-2 text-indigo-600" />
                      Classe Associée
                    </h4>

                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      {classDetails ? (
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-slate-900">
                              {classDetails.nom} {classDetails.niveau && `(${classDetails.niveau})`}
                            </h5>

                            {classDetails.etablissement && (
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center text-sm text-slate-600">
                                  <School className="w-4 h-4 mr-2 text-slate-400" />
                                  <span>{classDetails.etablissement.nom}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                  <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                  <span>
                                    {classDetails.etablissement.localisation},{" "}
                                    {classDetails.etablissement.pays}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              classDetails.etat === "ACTIF"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {classDetails.etat}
                          </span>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-slate-600">
                            <p className="font-medium">Classe: {getClassName(scheduledCourse)}</p>
                            <p className="text-sm mt-1">ID: {currentClassId}</p>
                            <p className="text-xs text-amber-600 mt-2">
                              ⚠️ Détails de la classe non disponibles
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === "participants" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-indigo-600" />
                    Participants et Présence
                  </h3>
                </div>

                {/* Attendance Summary */}
                {sessionHistory.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-blue-600" />
                      Résumé des Sessions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">{sessionHistory.length}</div>
                        <div className="text-sm text-slate-600">Sessions totales</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-2xl font-bold text-green-600">
                          {sessionHistory.filter(s => s.status === 'ENDED').length}
                        </div>
                        <div className="text-sm text-slate-600">Sessions terminées</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.max(...sessionHistory.map(s => s.participants?.length || 0), 0)}
                        </div>
                        <div className="text-sm text-slate-600">Participation max</div>
                      </div>
                    </div>
                  </div>
                )}

                {loadingParticipants || loadingSessionHistory ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Chargement des données de présence...
                    </h4>
                    <p className="text-slate-600">
                      Veuillez patienter pendant que nous récupérons les informations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Participants List with Attendance */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                      <div className="p-6 border-b border-slate-200">
                        <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-indigo-600" />
                          {scheduledCourse.participantsIds && scheduledCourse.participantsIds.length > 0 ? (
                            <span>Participants Sélectionnés ({participants.length})</span>
                          ) : (
                            <span>Tous les Étudiants de la Classe ({participants.length})</span>
                          )}
                        </h4>
                        {scheduledCourse.participantsIds && scheduledCourse.participantsIds.length > 0 ? (
                          <p className="text-sm text-amber-600 mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Cours réservé aux participants sélectionnés uniquement
                          </p>
                        ) : (
                          <p className="text-sm text-blue-600 mt-1 flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Tous les étudiants de la classe peuvent participer
                          </p>
                        )}
                      </div>
                      
                      {participants.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-slate-400" />
                          </div>
                          <h4 className="text-lg font-medium text-slate-900 mb-2">
                            {scheduledCourse.participantsIds && scheduledCourse.participantsIds.length > 0 ? (
                              "Aucun participant spécifique"
                            ) : (
                              "Aucun étudiant dans la classe"
                            )}
                          </h4>
                          <p className="text-slate-600">
                            {scheduledCourse.participantsIds && scheduledCourse.participantsIds.length > 0 ? (
                              "Les participants sélectionnés ne sont pas disponibles."
                            ) : (
                              "Aucun étudiant n'a été trouvé dans cette classe."
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {participants.map((participant) => {
                            // Calculate attendance for this participant
                            const attendedSessions = sessionHistory.filter(session => 
                              session.participants?.some(p => p.userId === participant.id)
                            );
                            const totalSessions = sessionHistory.length;
                            const attendanceRate = totalSessions > 0 
                              ? Math.round((attendedSessions.length / totalSessions) * 100)
                              : 0;
                            
                            console.log(`[AttendanceModal] Participant ${participant.name}:`, {
                              id: participant.id,
                              attendedSessions: attendedSessions.length,
                              totalSessions: totalSessions,
                              attendanceRate: attendanceRate + '%',
                              sessionsAttended: attendedSessions.map(s => s.sessionId)
                            });
                            
                            return (
                              <div key={participant.id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-4 flex-1">
                                    <div className="flex-shrink-0">
                                      <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                        <span className="text-white font-medium text-sm">
                                          {getInitials(participant.name)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-semibold text-slate-900 text-lg">
                                        {participant.name}
                                      </h5>
                                      {participant.email && (
                                        <p className="text-sm text-slate-600 mt-1">
                                          {participant.email}
                                        </p>
                                      )}
                                      <div className="flex items-center mt-2 space-x-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          {participant.type || "MEMBER"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Attendance Info */}
                                  <div className="flex-shrink-0 text-right">
                                    <div className="flex items-center space-x-2 mb-2">
                                      {attendanceRate >= 80 ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                      ) : attendanceRate >= 50 ? (
                                        <AlertCircle className="w-5 h-5 text-orange-500" />
                                      ) : (
                                        <UserX className="w-5 h-5 text-red-500" />
                                      )}
                                      <span className={`text-sm font-medium ${
                                        attendanceRate >= 80 ? 'text-green-700' :
                                        attendanceRate >= 50 ? 'text-orange-700' : 'text-red-700'
                                      }`}>
                                        {attendanceRate}% présence
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {attendedSessions.length}/{totalSessions} sessions
                                    </div>
                                    {totalSessions > 0 && (
                                      <div className="mt-2">
                                        <div className="w-20 bg-slate-200 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                              attendanceRate >= 80 ? 'bg-green-500' :
                                              attendanceRate >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.max(attendanceRate, 5)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Session History */}
                    {sessionHistory.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-6 border-b border-slate-200">
                          <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                            Historique des Sessions ({sessionHistory.length})
                          </h4>
                        </div>
                        <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                          {sessionHistory.map((session, index) => (
                            <div key={session.sessionId} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    session.status === 'ENDED' ? 'bg-green-500' :
                                    session.status === 'ACTIVE' ? 'bg-blue-500' : 'bg-gray-500'
                                  }`}></div>
                                  <div>
                                    <div className="font-medium text-slate-900">
                                      Session #{sessionHistory.length - index}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      {session.startedAt && new Date(session.startedAt).toLocaleString('fr-FR')}
                                      {session.endedAt && (
                                        <span> - {new Date(session.endedAt).toLocaleTimeString('fr-FR')}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-slate-900">
                                    {session.participants?.length || 0} participants
                                  </div>
                                  <div className={`text-xs px-2 py-1 rounded-full ${
                                    session.status === 'ENDED' ? 'bg-green-100 text-green-700' :
                                    session.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {session.status === 'ENDED' ? 'Terminée' :
                                     session.status === 'ACTIVE' ? 'Active' : 'Inconnue'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                    Historique des Modifications
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <CalendarPlus className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">
                          Cours programmé
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Programmé pour le{" "}
                          {formatDate(scheduledCourse.dateCoursPrevue)}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {scheduledCourse.dateCreation
                            ? formatDate(scheduledCourse.dateCreation)
                            : "Date de création non disponible"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {scheduledCourse.dateDebutEffectif && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <PlayCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Cours démarré
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours a été démarré
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDate(scheduledCourse.dateDebutEffectif)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {scheduledCourse.dateFinEffectif && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Cours terminé
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours a été marqué comme terminé
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDate(scheduledCourse.dateFinEffectif)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {scheduledCourse.etatCoursProgramme === "ANNULE" && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Cours annulé
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours a été annulé
                          </p>
                          {scheduledCourse.description?.includes("Annulé:") && (
                            <p className="text-xs text-slate-500 mt-2">
                              Raison:{" "}
                              {scheduledCourse.description
                                .replace("Annulé:", "")
                                .trim()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-4 sm:px-8 py-4 sm:py-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-sm text-slate-600 hidden sm:block">
              Cours programmé
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              {/* Action buttons based on course state */}
              {scheduledCourse.etatCoursProgramme === "PLANIFIE" && (
                <>
                  <button
                    onClick={() => {
                      onStart(scheduledCourse.id);
                      onClose();
                    }}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Démarrer
                  </button>
                  <button
                    onClick={() => setShowCancelReason(true)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Annuler
                  </button>
                </>
              )}

              {scheduledCourse.etatCoursProgramme === "EN_COURS" && (
                <>
                  <button
                    onClick={() => {
                      onEnd(scheduledCourse.id);
                      onClose();
                    }}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Terminer
                  </button>
                  <button
                    onClick={() => setShowCancelReason(true)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Annuler
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  // For finished or cancelled courses, show reprogram option
                  if (scheduledCourse.etatCoursProgramme === "TERMINE" || scheduledCourse.etatCoursProgramme === "ANNULE") {
                    // Create a new course programming based on the current one
                    const reprogramData = {
                      ...scheduledCourse,
                      id: undefined, // Remove ID to create new
                      etatCoursProgramme: "PLANIFIE", // Reset to planned state
                      dateCoursPrevue: null, // Clear previous date
                      dateDebutEffectif: null, // Clear effective dates
                      dateFinEffectif: null,
                      description: scheduledCourse.description?.includes("Annulé:") 
                        ? null // Clear cancellation reason
                        : scheduledCourse.description
                    };
                    onEdit(reprogramData);
                  } else {
                    // Normal edit for active courses
                    onEdit(scheduledCourse);
                  }
                  onClose();
                }}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
              >
                {scheduledCourse.etatCoursProgramme === "TERMINE" || scheduledCourse.etatCoursProgramme === "ANNULE" ? (
                  <>
                    <CalendarPlus className="w-4 h-4" />
                    <span>Reprogrammer</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    <span>Modifier</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>

        {/* Cancel Reason Modal */}
        {showCancelReason && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Annuler le cours
                  </h3>
                </div>

                <p className="text-slate-600 mb-4">
                  Veuillez indiquer la raison de l'annulation (optionnel):
                </p>

                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Raison de l'annulation..."
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 resize-none"
                  rows={3}
                />

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCancelReason(false);
                      setCancelReason("");
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCancelWithReason}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
                  >
                    Confirmer l'annulation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CoursProgrammerViewModal;
