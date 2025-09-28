import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  Users,
  MessageSquare,
  FileText,
  Clipboard,
  Monitor,
  MicOff,
  Mic,
  Camera,
  CameraOff,
  Hand,
  X,
  Send,
  Plus,
  Calendar,
  Clock,
  Settings,
  Download,
  UploadCloud,
  CheckCircle,
  ArrowLeft,
  Maximize2,
  Minimize2,
  ChevronDown,
  MoreVertical,
  Eye,
  Bell,
  AlertCircle,
  Search,
  Filter,
  BookOpen,
  Check,
  ChevronRight,
} from "lucide-react";

const ManageClass = ({ classInfo, onBack }) => {
  // États principaux
  const [activeTab, setActiveTab] = useState("videoconference");
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");
  const videoContainerRef = useRef(null);

  // Données d'exemple
  const classeInfo = {
    name: "10A - Mathématiques",
    teacher: "Dr. Richard Martinez",
    schedule: "Lun, Mer, Ven 9:00 - 10:30",
    currentSession: "Algèbre Linéaire - Séance 12",
    nextSession: "Vendredi 17 Mai, 9:00",
  };

  const participants = [
    {
      id: 1,
      name: "Dr. Richard Martinez",
      role: "professeur",
      isActive: true,
      hasHand: false,
      hasMic: true,
      hasCamera: true,
    },
    {
      id: 2,
      name: "Léa Bernard",
      role: "étudiant",
      isActive: true,
      hasHand: true,
      hasMic: false,
      hasCamera: true,
    },
    {
      id: 3,
      name: "Julien Moreau",
      role: "étudiant",
      isActive: true,
      hasHand: false,
      hasMic: false,
      hasCamera: true,
    },
    {
      id: 4,
      name: "Emma Dufour",
      role: "étudiant",
      isActive: true,
      hasHand: false,
      hasMic: false,
      hasCamera: false,
    },
    {
      id: 5,
      name: "Lucas Martin",
      role: "étudiant",
      isActive: false,
      hasHand: false,
      hasMic: false,
      hasCamera: false,
    },
    {
      id: 6,
      name: "Chloé Leclerc",
      role: "étudiant",
      isActive: true,
      hasHand: false,
      hasMic: false,
      hasCamera: false,
    },
    {
      id: 7,
      name: "Nathan Dubois",
      role: "étudiant",
      isActive: true,
      hasHand: false,
      hasMic: false,
      hasCamera: false,
    },
    {
      id: 8,
      name: "Zoé Laurent",
      role: "étudiant",
      isActive: false,
      hasHand: false,
      hasMic: false,
      hasCamera: false,
    },
  ];

  const chatMessages = [
    {
      id: 1,
      user: "Dr. Richard Martinez",
      role: "professeur",
      message:
        "Bonjour à tous ! Aujourd'hui nous allons étudier les matrices et leurs propriétés.",
      timestamp: "09:03",
    },
    {
      id: 2,
      user: "Léa Bernard",
      role: "étudiant",
      message: "Bonjour Professeur, j'ai une question sur le devoir précédent.",
      timestamp: "09:04",
    },
    {
      id: 3,
      user: "Dr. Richard Martinez",
      role: "professeur",
      message:
        "Bien sûr Léa, nous pourrons en discuter après la présentation principale.",
      timestamp: "09:05",
    },
    {
      id: 4,
      user: "Julien Moreau",
      role: "étudiant",
      message:
        "Est-ce que vous pourriez partager le lien vers les ressources supplémentaires dont vous avez parlé la dernière fois ?",
      timestamp: "09:07",
    },
    {
      id: 5,
      user: "Dr. Richard Martinez",
      role: "professeur",
      message:
        "J'ai déposé toutes les ressources dans la section 'Documents' de notre classe virtuelle. Vous pouvez y accéder dès maintenant.",
      timestamp: "09:08",
    },
  ];

  const assignments = [
    {
      id: 1,
      title: "Exercices sur les systèmes d'équations linéaires",
      status: "active",
      dueDate: "18 Mai 2025",
      submissionCount: 12,
      totalStudents: 25,
      attachments: 2,
      description:
        "Résoudre les systèmes d'équations linéaires en utilisant les méthodes de substitution et d'élimination. Inclure toutes les étapes de calcul.",
      points: 20,
    },
    {
      id: 2,
      title: "Projet de groupe sur les applications des matrices",
      status: "upcoming",
      dueDate: "25 Mai 2025",
      submissionCount: 0,
      totalStudents: 25,
      attachments: 4,
      description:
        "Choisir une application réelle des matrices (graphisme, cryptographie, etc.) et préparer une présentation de 10 minutes avec des exemples concrets.",
      points: 30,
    },
    {
      id: 3,
      title: "Quiz sur les vecteurs",
      status: "completed",
      dueDate: "10 Mai 2025",
      submissionCount: 23,
      totalStudents: 25,
      attachments: 1,
      description:
        "Quiz en ligne couvrant les concepts de base des vecteurs, produit scalaire et vectoriel.",
      points: 15,
    },
  ];

  const documents = [
    {
      id: 1,
      title: "Cours - Matrices et Opérations",
      type: "pdf",
      uploadDate: "03 Mai 2025",
      size: "2.4 MB",
      category: "cours",
    },

    {
      id: 2,
      title: "Exercices supplémentaires",
      type: "pdf",
      uploadDate: "05 Mai 2025",
      size: "1.1 MB",
      category: "exercices",
    },
    {
      id: 3,
      title: "Présentation du cours",
      type: "pptx",
      uploadDate: "12 Mai 2025",
      size: "5.6 MB",
      category: "presentations",
    },
    {
      id: 4,
      title: "Corrigé des exercices précédents",
      type: "pdf",
      uploadDate: "07 Mai 2025",
      size: "1.8 MB",
      category: "corriges",
    },
  ];

  // Effet pour la mise en page responsive
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowParticipants(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Fonctions de gestion des événements
  const handleSendMessage = () => {
    if (chatMessage.trim() === "") return;
    console.log("Message envoyé:", chatMessage);
    setChatMessage("");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
        setFullscreenMode(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreenMode(false);
      }
    }
  };

  const handleStartSharing = () => {
    setSharingScreen(true);
  };

  const handleStopSharing = () => {
    setSharingScreen(false);
  };

  // Filtrage des données
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (assignmentFilter === "all") return matchesSearch;
    if (assignmentFilter === "active")
      return matchesSearch && assignment.status === "active";
    if (assignmentFilter === "upcoming")
      return matchesSearch && assignment.status === "upcoming";
    if (assignmentFilter === "completed")
      return matchesSearch && assignment.status === "completed";

    return matchesSearch;
  });

  const filteredDocuments = documents.filter((document) => {
    const matchesSearch = document.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (documentFilter === "all") return matchesSearch;
    if (documentFilter === "cours")
      return matchesSearch && document.category === "cours";
    if (documentFilter === "exercices")
      return matchesSearch && document.category === "exercices";
    if (documentFilter === "presentations")
      return matchesSearch && document.category === "presentations";
    if (documentFilter === "corriges")
      return matchesSearch && document.category === "corriges";

    return matchesSearch;
  });

  // Formulaire de création de devoir
  const NewAssignmentForm = () => {
    const [assignmentData, setAssignmentData] = useState({
      title: "",
      description: "",
      dueDate: "",
      dueTime: "",
      points: "100",
      attachments: [],
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      console.log("Nouveau devoir créé:", assignmentData);
      setShowCreateAssignment(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <button onClick={onBack} className="back-button">
              <ArrowLeft size={20} className="mr-1" />
              Back to Classes
            </button>
            <h2>Manage Class</h2>
            <h2 className="text-xl font-bold">Créer un nouveau devoir</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowCreateAssignment(false)}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2"
                value={assignmentData.title}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    title: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 min-h-32"
                value={assignmentData.description}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    description: e.target.value,
                  })
                }
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={assignmentData.dueDate}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      dueDate: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure d'échéance
                </label>
                <input
                  type="time"
                  className="w-full border rounded-lg px-3 py-2"
                  value={assignmentData.dueTime}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      dueTime: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                value={assignmentData.points}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    points: e.target.value,
                  })
                }
                min="0"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pièces jointes
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <UploadCloud size={36} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  Glissez et déposez des fichiers ici ou
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    parcourir votre appareil
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, DOCX, PPTX, XLSX, JPG, PNG (Max 10MB)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setShowCreateAssignment(false)}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Créer le devoir
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Composant pour afficher les détails d'un devoir
  const AssignmentDetails = ({ assignment, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{assignment.title}</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    assignment.status === "active"
                      ? "bg-green-100 text-green-800"
                      : assignment.status === "upcoming"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {assignment.status === "active"
                    ? "Actif"
                    : assignment.status === "upcoming"
                    ? "À venir"
                    : "Terminé"}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <Calendar size={14} className="inline mr-1" />À rendre avant le{" "}
                {assignment.dueDate}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Description
              </h3>
              <p className="text-gray-600">{assignment.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Points
                </h3>
                <p className="text-gray-600">{assignment.points} points</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Soumissions
                </h3>
                <p className="text-gray-600">
                  {assignment.submissionCount}/{assignment.totalStudents}{" "}
                  étudiants
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Pièces jointes
              </h3>
              <div className="space-y-2">
                {[...Array(assignment.attachments)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center p-2 border rounded-lg"
                  >
                    <FileText size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      Document_{i + 1}.pdf
                    </span>
                    <button className="ml-auto text-blue-600 hover:text-blue-800 text-sm">
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
              onClick={onClose}
            >
              Fermer
            </button>
            {assignment.status !== "completed" && (
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Modifier le devoir
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* En-tête de la classe */}
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button className="mr-4 text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {classeInfo.name}
              </h1>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Calendar size={14} className="mr-1" />
                <span>{classeInfo.schedule}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-gray-900">
                {classeInfo.currentSession}
              </div>
              <div className="text-xs text-gray-500">
                Prochaine séance: {classeInfo.nextSession}
              </div>
            </div>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="bg-white border-b px-6">
        <div className="flex flex-wrap -mb-px">
          <button
            className={`inline-flex items-center py-4 px-4 text-sm font-medium border-b-2 ${
              activeTab === "videoconference"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("videoconference")}
          >
            <Video size={18} className="mr-2" />
            Visioconférence
          </button>
          <button
            className={`inline-flex items-center py-4 px-4 text-sm font-medium border-b-2 ${
              activeTab === "assignments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("assignments")}
          >
            <Clipboard size={18} className="mr-2" />
            Devoirs
          </button>
          <button
            className={`inline-flex items-center py-4 px-4 text-sm font-medium border-b-2 ${
              activeTab === "documents"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("documents")}
          >
            <FileText size={18} className="mr-2" />
            Documents
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* === VISIOCONFÉRENCE === */}
        {activeTab === "videoconference" && (
          <div className="flex flex-1 overflow-hidden">
            {/* Zone principale de la visioconférence */}
            <div
              ref={videoContainerRef}
              className={`flex-1 flex flex-col ${
                fullscreenMode ? "fixed inset-0 z-50 bg-black" : ""
              }`}
            >
              {/* Écran vidéo */}
              <div className="flex-1 bg-gray-900 relative p-2">
                {/* Vidéo principale (partagée ou du prof) */}
                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center relative">
                  {sharingScreen ? (
                    <div className="w-full h-full bg-white p-4 overflow-hidden flex items-center justify-center">
                      <img
                        src="/api/placeholder/1024/576"
                        alt="Écran partagé"
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs py-1 px-2 rounded-full">
                        Écran partagé
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-gray-400 text-center">
                        <Camera size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">
                          {cameraActive
                            ? "Caméra en cours de chargement..."
                            : "Caméra désactivée"}
                        </p>
                      </div>
                      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-60 text-white text-xs py-1 px-2 rounded">
                        Dr. Richard Martinez (Vous)
                      </div>
                    </>
                  )}
                </div>

                {/* Miniatures vidéo (visible même en écran partagé) */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  {participants
                    .filter((p) => p.hasCamera && p.isActive)
                    .slice(0, 4)
                    .map((participant) => (
                      <div
                        key={participant.id}
                        className="w-24 h-36 bg-gray-700 rounded-lg relative overflow-hidden"
                      >
                        {participant.hasCamera ? (
                          <img
                            src={`/api/placeholder/96/144?text=${participant.name.charAt(
                              0
                            )}`}
                            alt={participant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {participant.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                          {participant.name.split(" ")[0]}
                          {!participant.hasMic && (
                            <MicOff size={10} className="inline ml-1" />
                          )}
                        </div>
                        {participant.hasHand && (
                          <div className="absolute top-1 right-1 text-yellow-300">
                            <Hand size={14} />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Contrôles de la visioconférence */}
              <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
                <div className="text-white text-sm hidden md:block">
                  {participants.filter((p) => p.isActive).length} participants
                  actifs
                </div>

                <div className="flex space-x-2 md:space-x-4">
                  <button
                    className={`p-3 rounded-full ${
                      micActive
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={() => setMicActive(!micActive)}
                  >
                    {micActive ? (
                      <Mic size={20} className="text-white" />
                    ) : (
                      <MicOff size={20} className="text-white" />
                    )}
                  </button>

                  <button
                    className={`p-3 rounded-full ${
                      cameraActive
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={() => setCameraActive(!cameraActive)}
                  >
                    {cameraActive ? (
                      <Camera size={20} className="text-white" />
                    ) : (
                      <CameraOff size={20} className="text-white" />
                    )}
                  </button>

                  <button
                    className={`p-3 rounded-full ${
                      handRaised
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={() => setHandRaised(!handRaised)}
                  >
                    <Hand size={20} className="text-white" />
                  </button>

                  {sharingScreen ? (
                    <button
                      className="p-3 rounded-full bg-red-600 hover:bg-red-700"
                      onClick={handleStopSharing}
                    >
                      <X size={20} className="text-white" />
                      <span className="hidden md:inline ml-2 text-white text-sm">
                        Arrêter le partage
                      </span>
                    </button>
                  ) : (
                    <button
                      className="p-3 rounded-full bg-green-600 hover:bg-green-700"
                      onClick={handleStartSharing}
                    >
                      <Monitor size={20} className="text-white" />
                      <span className="hidden md:inline ml-2 text-white text-sm">
                        Partager l'écran
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    className="p-2 md:p-3 rounded-full bg-gray-700 hover:bg-gray-600"
                    onClick={toggleFullscreen}
                  >
                    {fullscreenMode ? (
                      <Minimize2 size={20} className="text-white" />
                    ) : (
                      <Maximize2 size={20} className="text-white" />
                    )}
                  </button>

                  <button
                    className="md:hidden p-2 rounded-full bg-gray-700 hover:bg-gray-600"
                    onClick={() => setShowParticipants(!showParticipants)}
                  >
                    <Users size={20} className="text-white" />
                  </button>

                  <button
                    className="md:hidden p-2 rounded-full bg-gray-700 hover:bg-gray-600"
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare size={20} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Panneau latéral (participants et chat) */}
            <div
              className={`w-80 bg-white border-l flex flex-col ${
                showParticipants || showChat ? "block" : "hidden md:flex"
              }`}
            >
              <div className="border-b px-4 py-3">
                <div className="flex space-x-2">
                  <button
                    className={`flex-1 text-center py-2 text-sm font-medium rounded-md ${
                      showParticipants
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setShowParticipants(true);
                      setShowChat(false);
                    }}
                  >
                    <Users size={16} className="inline mr-1" />
                    Participants
                  </button>
                  <button
                    className={`flex-1 text-center py-2 text-sm font-medium rounded-md ${
                      showChat
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setShowChat(true);
                      setShowParticipants(false);
                    }}
                  >
                    <MessageSquare size={16} className="inline mr-1" />
                    Chat
                  </button>
                </div>
              </div>

              {/* Liste des participants */}
              {showParticipants && (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700">
                        Participants ({participants.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className={`flex items-center px-3 py-2 rounded-lg ${
                            participant.isActive
                              ? "bg-gray-50"
                              : "bg-gray-100 opacity-60"
                          }`}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {participant.name.charAt(0)}
                            </div>
                            {participant.isActive && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium">
                              {participant.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {participant.role}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {participant.hasHand && (
                              <div className="text-yellow-500">
                                <Hand size={16} />
                              </div>
                            )}
                            {!participant.hasMic && (
                              <div className="text-gray-400">
                                <MicOff size={16} />
                              </div>
                            )}
                            {!participant.hasCamera && (
                              <div className="text-gray-400">
                                <CameraOff size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat */}
              {showChat && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className="flex gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {message.user.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline">
                              <span className="font-medium text-sm">
                                {message.user}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                {message.timestamp}
                              </span>
                            </div>
                            <div className="text-sm mt-1">
                              {message.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-t">
                    <div className="flex items-center">
                      <input
                        type="text"
                        className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Écrivez un message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                      />
                      <button
                        className="bg-blue-600 text-white px-3 py-2 rounded-r-lg hover:bg-blue-700"
                        onClick={handleSendMessage}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === DEVOIRS === */}
        {activeTab === "assignments" && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Gestion des devoirs</h2>
              <button
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                onClick={() => setShowCreateAssignment(true)}
              >
                <Plus size={18} className="mr-2" />
                Créer un devoir
              </button>
            </div>

            {/* Filtres pour les devoirs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="relative w-full md:w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Rechercher des devoirs..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-gray-500" />
                <select
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={assignmentFilter}
                  onChange={(e) => setAssignmentFilter(e.target.value)}
                >
                  <option value="all">Tous les devoirs</option>
                  <option value="active">Actifs</option>
                  <option value="upcoming">À venir</option>
                  <option value="completed">Terminés</option>
                </select>
              </div>
            </div>

            {/* Liste des devoirs */}
            <div className="space-y-4">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white border rounded-lg shadow-sm hover:shadow-md transition"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            À rendre avant le {assignment.dueDate}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            assignment.status === "active"
                              ? "bg-green-100 text-green-800"
                              : assignment.status === "upcoming"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {assignment.status === "active"
                            ? "Actif"
                            : assignment.status === "upcoming"
                            ? "À venir"
                            : "Terminé"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Users size={16} className="mr-1" />
                            <span>
                              {assignment.submissionCount}/
                              {assignment.totalStudents} soumissions
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FileText size={16} className="mr-1" />
                            <span>
                              {assignment.attachments} pièce(s) jointe(s)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Voir détails
                          </button>
                          {assignment.status !== "completed" && (
                            <button className="text-gray-500 hover:text-gray-700">
                              <MoreVertical size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Aucun devoir trouvé correspondant à vos critères
                </div>
              )}
            </div>

            {showCreateAssignment && <NewAssignmentForm />}
          </div>
        )}

        {/* === DOCUMENTS === */}
        {activeTab === "documents" && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Documents de la classe</h2>
              <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <Plus size={18} className="mr-2" />
                Ajouter un document
              </button>
            </div>

            {/* Filtres pour les documents */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="relative w-full md:w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Rechercher des documents..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-gray-500" />
                <select
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={documentFilter}
                  onChange={(e) => setDocumentFilter(e.target.value)}
                >
                  <option value="all">Tous les documents</option>
                  <option value="cours">Cours</option>
                  <option value="exercices">Exercices</option>
                  <option value="presentations">Présentations</option>
                  <option value="corriges">Corrigés</option>
                </select>
              </div>
            </div>

            {/* Liste des documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="bg-white border rounded-lg shadow-sm hover:shadow-md transition"
                  >
                    <div className="p-4">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                          <FileText size={24} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{document.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {document.type.toUpperCase()} • {document.size}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Ajouté le {document.uploadDate}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-between items-center">
                        <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                          <Download size={16} className="mr-1" />
                          Télécharger
                        </button>
                        <button className="text-gray-500 hover:text-gray-700">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  Aucun document trouvé correspondant à vos critères
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClass;
