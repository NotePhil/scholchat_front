import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import AccederService from "../../../../services/accederService";

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

  useEffect(() => {
    const fetchParticipants = async () => {
      if (
        !scheduledCourse?.participantsIds?.length ||
        !scheduledCourse?.classeId
      ) {
        setParticipants([]);
        return;
      }

      try {
        setLoadingParticipants(true);
        const classParticipants =
          await AccederService.obtenirUtilisateursAvecAcces(
            scheduledCourse.classeId
          );

        const participantDetails = scheduledCourse.participantsIds
          .map((participantId) => {
            const participant = classParticipants.find(
              (user) =>
                (user.utilisateurId || user.id) === participantId &&
                user.etat === "APPROUVEE"
            );

            if (participant) {
              const firstName = participant.prenom || "";
              const lastName =
                participant.nom || participant.utilisateurNom || "";
              const fullName = `${firstName} ${lastName}`.trim();

              const displayName =
                fullName ||
                participant.nomComplet ||
                participant.email ||
                `User ${participant.utilisateurId || participant.id}`;

              return {
                id: participant.utilisateurId || participant.id,
                name: displayName,
                email: participant.email || participant.utilisateurEmail || "",
                type: participant.type || participant.role || "MEMBER",
                originalData: participant,
              };
            }
            return null;
          })
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name));

        setParticipants(participantDetails);
      } catch (error) {
        console.error("Error fetching participants:", error);
        setParticipants([]);
      } finally {
        setLoadingParticipants(false);
      }
    };

    if (scheduledCourse && activeTab === "participants") {
      fetchParticipants();
    }
  }, [scheduledCourse, activeTab]);

  if (!scheduledCourse) {
    return null;
  }

  const getClassName = (classeId) => {
    if (!classeId || !classes.length) return "Classe non définie";
    const classe = classes.find((c) => c.id === classeId);
    return classe ? classe.nom : "Classe non définie";
  };

  const getClassDetails = (classeId) => {
    if (!classeId || !classes.length) return null;
    return classes.find((c) => c.id === classeId);
  };

  const handleCancelWithReason = () => {
    onCancel(scheduledCourse.id, cancelReason);
    setShowCancelReason(false);
    setCancelReason("");
    onClose();
  };

  const classDetails = getClassDetails(scheduledCourse.classeId);

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <CalendarPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Détails de la Programmation
                </h2>
                <p className="text-slate-600 mt-1">
                  {scheduledCourse.cours?.titre}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(
                  scheduledCourse.etatCoursProgramme
                )}`}
              >
                <div className="mr-2">
                  {getStatusIcon(scheduledCourse.etatCoursProgramme)}
                </div>
                {getStatusText(scheduledCourse.etatCoursProgramme)}
              </span>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-8">
          <div className="flex space-x-6">
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
              Participants ({scheduledCourse.participantsIds?.length || 0})
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
          <div className="p-8">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-8">
                {/* Course Information */}
                <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-200">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                    Informations du Cours
                  </h3>

                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Course Avatar and basic info */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="h-24 w-24 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl">
                            <span className="text-white font-bold text-2xl">
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
                          <div className="text-2xl font-bold text-slate-900">
                            {scheduledCourse.cours?.titre}
                          </div>
                          <div className="text-slate-600 font-medium mt-1">
                            {getClassName(scheduledCourse.classeId)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Course Details Grid */}
                    <div className="flex-1">
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
                  </div>

                  {scheduledCourse.description && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
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
                  {classDetails && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <School className="w-5 h-5 mr-2 text-indigo-600" />
                        Classe Associée
                      </h4>

                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-slate-900">
                              {classDetails.nom} ({classDetails.niveau})
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === "participants" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-indigo-600" />
                    Participants ({scheduledCourse.participantsIds?.length || 0}
                    )
                  </h3>
                </div>

                {loadingParticipants ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Chargement des participants...
                    </h4>
                    <p className="text-slate-600">
                      Veuillez patienter pendant que nous récupérons les
                      informations.
                    </p>
                  </div>
                ) : !scheduledCourse.participantsIds ||
                  scheduledCourse.participantsIds.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Aucun participant inscrit
                    </h4>
                    <p className="text-slate-600">
                      Les étudiants pourront s'inscrire à ce cours programmé.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {participants.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                          <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <h4 className="text-lg font-medium text-slate-900 mb-2">
                          Participants non trouvés
                        </h4>
                        <p className="text-slate-600">
                          Les informations des participants ne sont pas
                          disponibles ou ils ont été supprimés de la classe.
                        </p>
                      </div>
                    ) : (
                      participants.map((participant, index) => (
                        <div
                          key={participant.id}
                          className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {getInitials(participant.name)}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-lg">
                                {participant.name}
                              </h4>
                              {participant.email && (
                                <p className="text-sm text-slate-600 mt-1 flex items-center">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                    {participant.email}
                                  </span>
                                </p>
                              )}
                              <div className="flex items-center mt-2 space-x-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {participant.type || "MEMBER"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  ID: {participant.id}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Inscrit
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
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
        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              ID: {scheduledCourse.id}
            </div>

            <div className="flex items-center space-x-3">
              {/* Action buttons based on course state */}
              {scheduledCourse.etatCoursProgramme === "PLANIFIE" && (
                <>
                  <button
                    onClick={() => {
                      onStart(scheduledCourse.id);
                      onClose();
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 transition-colors font-medium"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Démarrer
                  </button>
                  <button
                    onClick={() => setShowCancelReason(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 transition-colors font-medium"
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
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl flex items-center gap-2 transition-colors font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Terminer
                  </button>
                  <button
                    onClick={() => setShowCancelReason(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 transition-colors font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Annuler
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  onEdit(scheduledCourse);
                  onClose();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-colors font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>

        {/* Cancel Reason Modal */}
        {showCancelReason && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
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
    </div>
  );
};

export default CoursProgrammerViewModal;
