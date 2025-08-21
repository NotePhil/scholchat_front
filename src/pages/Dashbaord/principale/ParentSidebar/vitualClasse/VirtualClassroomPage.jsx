import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Users,
  MessageCircle,
  Share2,
  Settings,
  Phone,
  PhoneOff,
  Monitor,
  Hand,
  Grid3X3,
  User,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  BookOpen,
  FileText,
  Download,
  Edit3,
  Video,
  PlayArrow,
  Pause,
  Square,
  Calendar,
  Clock,
  MapPin,
  Users as UsersIcon,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  CheckCircle,
  PenTool,
  Type,
  Circle,
  Square as SquareIcon,
  MousePointer,
  Trash2,
  Undo,
  Redo,
  Save,
  Upload,
  Download as DownloadIcon,
  Screen,
  Presentation,
  Webcam,
  MicIcon,
  SpeakerIcon,
  Headphones,
} from "lucide-react";

const VirtualClassroomModal = ({
  isOpen,
  onClose,
  selectedClass,
  userId,
  coursProgrammerService,
  classService,
}) => {
  // Media Controls State
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState("courses"); // courses, chat, participants, whiteboard, notes
  const [activeView, setActiveView] = useState("grid"); // grid, speaker, presentation
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Data State
  const [classCourses, setClassCourses] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Course Management State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStatus, setCourseStatus] = useState("PLANIFIE");
  const [courseDuration, setCourseDuration] = useState("00:00:00");

  // Chat State
  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Whiteboard State
  const [whiteboardTool, setWhiteboardTool] = useState("pen");
  const [whiteboardColor, setWhiteboardColor] = useState("#000000");
  const [whiteboardStrokes, setWhiteboardStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // WebRTC State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [peerConnections, setPeerConnections] = useState(new Map());

  // Refs
  const localVideoRef = useRef(null);
  const whiteboardRef = useRef(null);
  const chatEndRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Fetch class data and courses on component mount
  useEffect(() => {
    if (isOpen && selectedClass && userId) {
      initializeClassroom();
    }
    return () => {
      cleanup();
    };
  }, [isOpen, selectedClass, userId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeClassroom = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchClassCourses(),
        fetchClassParticipants(),
        initializeMedia(),
        loadInitialMessages(),
      ]);

      setLoading(false);
    } catch (err) {
      console.error("Error initializing classroom:", err);
      setError("Failed to initialize classroom: " + err.message);
      setLoading(false);
    }
  };

  const fetchClassCourses = async () => {
    try {
      if (!coursProgrammerService) {
        throw new Error("Course service not available");
      }

      // Fetch courses for this class
      const userCourses =
        await coursProgrammerService.obtenirProgrammationParParticipant(userId);
      const filteredCourses = userCourses.filter(
        (course) => course.classeId === selectedClass.id
      );

      setClassCourses(filteredCourses);

      // Set the first available course as selected
      if (filteredCourses.length > 0) {
        setSelectedCourse(filteredCourses[0]);
        setCourseStatus(filteredCourses[0].etatCoursProgramme);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setClassCourses([]);
    }
  };

  const fetchClassParticipants = async () => {
    try {
      if (!classService) {
        throw new Error("Class service not available");
      }

      const classData = await classService.obtenirClasseParId(selectedClass.id);

      // Mock participants based on class data
      const mockParticipants = [
        {
          id: "teacher-1",
          name: classData.moderator || "Enseignant",
          role: "teacher",
          isHost: true,
          isVideoOn: true,
          isMicOn: true,
          isSpeaking: false,
          isOnline: true,
        },
        {
          id: userId,
          name: "Vous",
          role: "parent",
          isHost: false,
          isVideoOn: isCameraOn,
          isMicOn: isMicOn,
          isSpeaking: false,
          isOnline: true,
        },
      ];

      // Add mock students
      for (let i = 0; i < (classData.effectif || 5); i++) {
        mockParticipants.push({
          id: `student-${i}`,
          name: `Élève ${i + 1}`,
          role: "student",
          isHost: false,
          isVideoOn: Math.random() > 0.3,
          isMicOn: false,
          isSpeaking: Math.random() > 0.8,
          isOnline: Math.random() > 0.2,
        });
      }

      setParticipants(mockParticipants);
    } catch (err) {
      console.error("Error fetching participants:", err);
      setParticipants([]);
    }
  };

  const loadInitialMessages = () => {
    const initialMessages = [
      {
        id: "msg-1",
        userId: "teacher-1",
        username: "Enseignant",
        message: `Bienvenue dans le cours de ${selectedClass.nom}!`,
        timestamp: new Date(),
        type: "text",
        isTeacher: true,
      },
      {
        id: "msg-2",
        userId: userId,
        username: "Vous",
        message: "Bonjour, merci pour l'accueil!",
        timestamp: new Date(Date.now() - 30000),
        type: "text",
        isTeacher: false,
      },
    ];

    setMessages(initialMessages);
  };

  const initializeMedia = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
      // Handle gracefully - classroom can work without camera
    }
  };

  const startCourse = async (course) => {
    try {
      if (!coursProgrammerService) return;

      await coursProgrammerService.demarrerCours(course.id);
      setCourseStatus("EN_COURS");
      setSelectedCourse({ ...course, etatCoursProgramme: "EN_COURS" });

      // Start duration timer
      startDurationTimer();

      // Add system message
      addSystemMessage(`Cours "${course.coursNom}" démarré`);
    } catch (err) {
      console.error("Error starting course:", err);
      addSystemMessage("Erreur lors du démarrage du cours", "error");
    }
  };

  const endCourse = async (course) => {
    try {
      if (!coursProgrammerService) return;

      await coursProgrammerService.terminerCours(course.id);
      setCourseStatus("TERMINE");
      setSelectedCourse({ ...course, etatCoursProgramme: "TERMINE" });

      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      addSystemMessage(`Cours "${course.coursNom}" terminé`);
    } catch (err) {
      console.error("Error ending course:", err);
      addSystemMessage("Erreur lors de l'arrêt du cours", "error");
    }
  };

  const startDurationTimer = () => {
    const startTime = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      setCourseDuration(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);
  };

  const addSystemMessage = (message, type = "info") => {
    const systemMessage = {
      id: `sys-${Date.now()}`,
      userId: "system",
      username: "Système",
      message,
      timestamp: new Date(),
      type: "system",
      severity: type,
    };

    setMessages((prev) => [...prev, systemMessage]);
  };

  const sendMessage = () => {
    if (!chatMessage.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      userId: userId,
      username: "Vous",
      message: chatMessage.trim(),
      timestamp: new Date(),
      type: "text",
      isTeacher: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setChatMessage("");
  };

  const toggleCamera = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);

        // Update participant state
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === userId ? { ...p, isVideoOn: !isCameraOn } : p
          )
        );
      }
    }
  };

  const toggleMic = async () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);

        // Update participant state
        setParticipants((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, isMicOn: !isMicOn } : p))
        );
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        setIsScreenSharing(true);
        addSystemMessage("Partage d'écran démarré");

        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          addSystemMessage("Partage d'écran arrêté");
        };
      } else {
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
      addSystemMessage("Erreur lors du partage d'écran", "error");
    }
  };

  const downloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([notes], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `notes-${
      selectedClass.nom
    }-${new Date().toLocaleDateString("fr-FR")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Close peer connections
    peerConnections.forEach((pc) => pc.close());
    setPeerConnections(new Map());
    setRemoteStreams(new Map());
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center p-2">
      <div
        className={`bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl transition-all duration-500 ${
          isFullscreen ? "w-full h-full" : "w-full max-w-7xl h-[95vh]"
        } overflow-hidden border border-blue-500/20 flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  courseStatus === "EN_COURS"
                    ? "bg-red-500"
                    : courseStatus === "PLANIFIE"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              ></div>
              <span className="text-white font-semibold">
                {courseStatus === "EN_COURS"
                  ? "EN DIRECT"
                  : courseStatus === "PLANIFIE"
                  ? "EN ATTENTE"
                  : "TERMINÉ"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <BookOpen size={20} className="text-white" />
              <h2 className="text-white text-lg font-bold truncate max-w-xs">
                {selectedClass?.nom}
              </h2>
            </div>

            {selectedCourse && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white text-sm font-medium">
                  {selectedCourse.coursNom}
                </span>
              </div>
            )}

            {courseStatus === "EN_COURS" && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white text-sm font-mono">
                  {courseDuration}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all duration-200"
              title={showSidebar ? "Masquer panneau" : "Afficher panneau"}
            >
              {showSidebar ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all duration-200"
              title={isFullscreen ? "Réduire" : "Plein écran"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-all duration-200"
              title="Quitter"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="text-center">
                  <Loader
                    size={48}
                    className="text-blue-400 animate-spin mx-auto mb-4"
                  />
                  <p className="text-white text-lg">
                    Initialisation de la classe virtuelle...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="text-center">
                  <AlertCircle
                    size={48}
                    className="text-red-400 mx-auto mb-4"
                  />
                  <p className="text-white text-lg mb-2">Erreur</p>
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={initializeClassroom}
                    className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-all"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* View Controls */}
                <div className="flex items-center justify-center p-3 bg-slate-800/50 border-b border-slate-700/50">
                  <div className="flex space-x-1 bg-slate-700/50 rounded-lg p-1">
                    {["grid", "speaker", "presentation"].map((view) => (
                      <button
                        key={view}
                        onClick={() => setActiveView(view)}
                        className={`p-2 rounded-md text-sm transition-all ${
                          activeView === view
                            ? "bg-blue-500 text-white"
                            : "text-slate-300 hover:bg-slate-600"
                        }`}
                        title={
                          view === "grid"
                            ? "Vue en grille"
                            : view === "speaker"
                            ? "Vue présentateur"
                            : "Vue présentation"
                        }
                      >
                        {view === "grid" && <Grid3X3 size={16} />}
                        {view === "speaker" && <User size={16} />}
                        {view === "presentation" && <Presentation size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Area */}
                <div className="flex-1 relative bg-gradient-to-br from-slate-800 to-slate-900 p-4">
                  {activeView === "presentation" ? (
                    // Presentation/Screen Share View
                    <div className="relative h-full bg-black rounded-2xl overflow-hidden">
                      {isScreenSharing ? (
                        <div className="h-full flex items-center justify-center">
                          <Screen size={64} className="text-blue-400" />
                          <div className="ml-4 text-white">
                            <h3 className="text-xl font-bold">
                              Partage d'écran actif
                            </h3>
                            <p className="text-slate-300">
                              Contenu partagé par l'enseignant
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <Monitor
                              size={64}
                              className="mx-auto mb-4 text-slate-400"
                            />
                            <h3 className="text-xl font-bold mb-2">
                              Aucun contenu partagé
                            </h3>
                            <p className="text-slate-300">
                              En attente du partage d'écran
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Main video area
                    <div className="relative h-full">
                      {/* Teacher/Main Video */}
                      <div className="relative h-2/3 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl overflow-hidden border border-blue-500/30">
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-2">
                          <div className="flex items-center space-x-2 text-white">
                            <User size={16} />
                            <span className="font-medium">Enseignant</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* Participant Grid */}
                      {activeView === "grid" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 p-2">
                          <div className="grid grid-cols-6 gap-2 h-full">
                            {participants.slice(0, 6).map((participant) => (
                              <div
                                key={participant.id}
                                className="relative bg-slate-700/80 rounded-lg overflow-hidden border border-slate-600/50"
                              >
                                <div className="h-full flex items-center justify-center">
                                  {participant.isVideoOn ? (
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                      <User size={16} className="text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                                      <CameraOff
                                        size={16}
                                        className="text-slate-400"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="absolute bottom-1 left-1 right-1">
                                  <div className="text-white text-xs font-medium truncate bg-black/50 rounded px-1">
                                    {participant.name}
                                  </div>
                                </div>

                                {participant.isSpeaking && (
                                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                )}

                                {!participant.isMicOn && (
                                  <div className="absolute top-1 left-1">
                                    <MicOff
                                      size={12}
                                      className="text-red-400"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Control Bar */}
                <div className="p-4 bg-slate-800/90 backdrop-blur-lg border-t border-slate-700/50">
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={toggleMic}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        isMicOn
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                      title={
                        isMicOn ? "Désactiver le micro" : "Activer le micro"
                      }
                    >
                      {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>

                    <button
                      onClick={toggleCamera}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        isCameraOn
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                      title={
                        isCameraOn
                          ? "Désactiver la caméra"
                          : "Activer la caméra"
                      }
                    >
                      {isCameraOn ? (
                        <Camera size={20} />
                      ) : (
                        <CameraOff size={20} />
                      )}
                    </button>

                    <button
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        isSpeakerOn
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-slate-600 hover:bg-slate-500 text-white"
                      }`}
                      title={
                        isSpeakerOn ? "Désactiver le son" : "Activer le son"
                      }
                    >
                      {isSpeakerOn ? (
                        <Volume2 size={20} />
                      ) : (
                        <VolumeX size={20} />
                      )}
                    </button>

                    <button
                      onClick={() => setIsHandRaised(!isHandRaised)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        isHandRaised
                          ? "bg-yellow-500 hover:bg-yellow-600 text-white animate-bounce"
                          : "bg-slate-600 hover:bg-slate-500 text-white"
                      }`}
                      title={isHandRaised ? "Baisser la main" : "Lever la main"}
                    >
                      <Hand size={20} />
                    </button>

                    <div className="w-px h-8 bg-slate-600"></div>

                    <button
                      onClick={toggleScreenShare}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        isScreenSharing
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-slate-600 hover:bg-slate-500 text-white"
                      }`}
                      title="Partager l'écran"
                    >
                      <Share2 size={20} />
                    </button>

                    <button
                      className="p-3 bg-slate-600 hover:bg-slate-500 rounded-xl text-white transition-all duration-200"
                      title="Paramètres"
                    >
                      <Settings size={20} />
                    </button>

                    <div className="w-px h-8 bg-slate-600"></div>

                    {selectedCourse && (
                      <>
                        {courseStatus === "PLANIFIE" && (
                          <button
                            onClick={() => startCourse(selectedCourse)}
                            className="p-3 bg-green-500 hover:bg-green-600 rounded-xl text-white transition-all duration-200"
                            title="Démarrer le cours"
                          >
                            <PlayArrow size={20} />
                          </button>
                        )}

                        {courseStatus === "EN_COURS" && (
                          <button
                            onClick={() => endCourse(selectedCourse)}
                            className="p-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-all duration-200"
                            title="Terminer le cours"
                          >
                            <Square size={20} />
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={onClose}
                      className="p-3 bg-red-500 hover:bg-red-600 rounded-xl text-white transition-all duration-200"
                      title="Quitter la classe"
                    >
                      <PhoneOff size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="w-96 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-700/50">
                <div className="flex space-x-1">
                  {[
                    "courses",
                    "chat",
                    "participants",
                    "whiteboard",
                    "notes",
                  ].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab
                          ? "bg-blue-500 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {tab === "courses" && (
                        <>
                          <BookOpen size={14} className="inline mr-1" />
                          Cours
                        </>
                      )}
                      {tab === "chat" && (
                        <>
                          <MessageCircle size={14} className="inline mr-1" />
                          Chat ({messages.length})
                        </>
                      )}
                      {tab === "participants" && (
                        <>
                          <Users size={14} className="inline mr-1" />
                          Participants ({participants.length})
                        </>
                      )}
                      {tab === "whiteboard" && (
                        <>
                          <PenTool size={14} className="inline mr-1" />
                          Tableau
                        </>
                      )}
                      {tab === "notes" && (
                        <>
                          <FileText size={14} className="inline mr-1" />
                          Notes
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Courses Tab */}
                {activeTab === "courses" && (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold text-lg">
                        Cours Programmés
                      </h3>
                      <div className="text-slate-400 text-sm">
                        {classCourses.length} cours
                      </div>
                    </div>

                    {classCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen
                          size={48}
                          className="mx-auto mb-4 text-slate-500"
                        />
                        <p className="text-slate-400">Aucun cours programmé</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {classCourses.map((course) => (
                          <div
                            key={course.id}
                            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                              selectedCourse?.id === course.id
                                ? "bg-blue-500/20 border-blue-400/50"
                                : "bg-slate-700/50 border-slate-600/30 hover:border-blue-400/30"
                            }`}
                            onClick={() => setSelectedCourse(course)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-white font-medium text-sm">
                                {course.coursNom || "Cours sans nom"}
                              </h4>
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  course.etatCoursProgramme === "EN_COURS"
                                    ? "bg-green-500/20 text-green-400"
                                    : course.etatCoursProgramme === "PLANIFIE"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-slate-500/20 text-slate-400"
                                }`}
                              >
                                {course.etatCoursProgramme === "EN_COURS"
                                  ? "En cours"
                                  : course.etatCoursProgramme === "PLANIFIE"
                                  ? "Planifié"
                                  : "Terminé"}
                              </div>
                            </div>

                            {course.description && (
                              <p className="text-slate-300 text-xs mb-3 line-clamp-2">
                                {course.description}
                              </p>
                            )}

                            <div className="space-y-2">
                              <div className="flex items-center text-slate-400 text-xs">
                                <Calendar size={12} className="mr-2" />
                                {formatDate(course.dateCoursPrevue)}
                              </div>

                              {course.lieu && (
                                <div className="flex items-center text-slate-400 text-xs">
                                  <MapPin size={12} className="mr-2" />
                                  {course.lieu}
                                </div>
                              )}
                            </div>

                            {course.etatCoursProgramme === "PLANIFIE" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startCourse(course);
                                }}
                                className="w-full mt-3 p-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm font-medium transition-all"
                              >
                                <PlayArrow size={14} className="inline mr-1" />
                                Démarrer le cours
                              </button>
                            )}

                            {course.etatCoursProgramme === "EN_COURS" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  endCourse(course);
                                }}
                                className="w-full mt-3 p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-all"
                              >
                                <Square size={14} className="inline mr-1" />
                                Terminer le cours
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === "chat" && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((message) => (
                        <div key={message.id} className="group">
                          <div
                            className={`p-3 rounded-xl ${
                              message.type === "system"
                                ? "bg-slate-700/50 border border-slate-600/30"
                                : message.isTeacher
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30"
                                : message.userId === userId
                                ? "bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-400/30 ml-4"
                                : "bg-slate-700/50 border border-slate-600/30"
                            }`}
                          >
                            {message.type !== "system" && (
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-sm font-semibold ${
                                    message.isTeacher
                                      ? "text-blue-300"
                                      : message.userId === userId
                                      ? "text-green-300"
                                      : "text-slate-300"
                                  }`}
                                >
                                  {message.username}
                                  {message.isTeacher && (
                                    <span className="ml-1 text-xs bg-blue-500 px-2 py-0.5 rounded-full">
                                      Enseignant
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {message.timestamp.toLocaleTimeString(
                                    "fr-FR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                            )}

                            <p
                              className={`text-sm ${
                                message.type === "system"
                                  ? message.severity === "error"
                                    ? "text-red-400"
                                    : "text-slate-300"
                                  : "text-white"
                              }`}
                            >
                              {message.type === "system" && (
                                <span className="inline-flex items-center mr-2">
                                  {message.severity === "error" ? (
                                    <AlertCircle size={12} />
                                  ) : (
                                    <CheckCircle size={12} />
                                  )}
                                </span>
                              )}
                              {message.message}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-slate-700/50">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && sendMessage()
                            }
                            placeholder="Tapez votre message..."
                            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                            <button className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors">
                              <Smile size={16} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors">
                              <Paperclip size={16} />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={sendMessage}
                          disabled={!chatMessage.trim()}
                          className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Participants Tab */}
                {activeTab === "participants" && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">Participants</h3>
                      <div className="text-slate-400 text-sm">
                        {participants.filter((p) => p.isOnline).length}/
                        {participants.length} en ligne
                      </div>
                    </div>

                    <div className="space-y-3">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600/30 hover:border-blue-400/30 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  participant.isHost
                                    ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                                    : participant.role === "teacher"
                                    ? "bg-gradient-to-br from-blue-400 to-purple-500"
                                    : "bg-gradient-to-br from-green-400 to-blue-500"
                                }`}
                              >
                                <User size={16} className="text-white" />
                              </div>
                              {participant.isOnline && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800"></div>
                              )}
                              {participant.isSpeaking && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">
                                {participant.name}
                                {participant.id === userId && " (Vous)"}
                              </div>
                              <div className="text-slate-400 text-xs capitalize">
                                {participant.role === "teacher"
                                  ? "Enseignant"
                                  : participant.role === "parent"
                                  ? "Parent"
                                  : "Élève"}
                                {participant.isHost && " • Hôte"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {participant.isVideoOn ? (
                              <Camera size={14} className="text-green-400" />
                            ) : (
                              <CameraOff size={14} className="text-slate-500" />
                            )}
                            {participant.isMicOn ? (
                              <Mic size={14} className="text-green-400" />
                            ) : (
                              <MicOff size={14} className="text-slate-500" />
                            )}
                            <button className="p-1.5 text-slate-400 hover:text-white transition-colors">
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Whiteboard Tab */}
                {activeTab === "whiteboard" && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">
                        Tableau Blanc
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setWhiteboardStrokes([])}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-all"
                          title="Effacer tout"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white transition-all">
                          <Save size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Whiteboard Tools */}
                    <div className="mb-4 p-3 bg-slate-700/50 rounded-xl">
                      <div className="flex items-center space-x-2 mb-3">
                        {[
                          "pen",
                          "eraser",
                          "line",
                          "circle",
                          "square",
                          "text",
                        ].map((tool) => (
                          <button
                            key={tool}
                            onClick={() => setWhiteboardTool(tool)}
                            className={`p-2 rounded-lg transition-all ${
                              whiteboardTool === tool
                                ? "bg-blue-500 text-white"
                                : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                            }`}
                          >
                            {tool === "pen" && <PenTool size={16} />}
                            {tool === "eraser" && <Trash2 size={16} />}
                            {tool === "line" && (
                              <div className="w-4 h-0.5 bg-current" />
                            )}
                            {tool === "circle" && <Circle size={16} />}
                            {tool === "square" && <SquareIcon size={16} />}
                            {tool === "text" && <Type size={16} />}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={whiteboardColor}
                          onChange={(e) => setWhiteboardColor(e.target.value)}
                          className="w-8 h-8 rounded-lg border-2 border-slate-600"
                        />
                        <span className="text-slate-300 text-sm">Couleur</span>
                      </div>
                    </div>

                    {/* Whiteboard Canvas */}
                    <div className="bg-white rounded-xl border border-slate-600 h-96 relative overflow-hidden">
                      <canvas
                        ref={whiteboardRef}
                        className="w-full h-full cursor-crosshair"
                        width="400"
                        height="384"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-slate-400 text-center">
                          <PenTool
                            size={48}
                            className="mx-auto mb-2 opacity-20"
                          />
                          <p className="text-sm">Tableau blanc collaboratif</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === "notes" && (
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                      <h3 className="text-white font-semibold">Mes Notes</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={downloadNotes}
                          className="p-2 text-slate-400 hover:text-white transition-colors"
                          title="Télécharger les notes"
                        >
                          <DownloadIcon size={16} />
                        </button>
                        <button
                          onClick={() => setNotes("")}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          title="Effacer les notes"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={`Prenez vos notes pour le cours "${selectedClass?.nom}"...\n\nVous pouvez noter ici tout ce qui vous semble important pendant le cours.`}
                        className="w-full h-full bg-slate-700/50 border border-slate-600/30 rounded-xl p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="p-4 border-t border-slate-700/50">
                      <div className="text-slate-400 text-xs">
                        {notes.length} caractères • Sauvegarde automatique
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualClassroomModal;
