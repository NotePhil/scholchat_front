import React, { useState, useEffect } from "react";
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
} from "lucide-react";

const VirtualClassroomModal = ({
  isOpen,
  onClose,
  className = "Classe de Mathématiques",
}) => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [activeView, setActiveView] = useState("grid"); // grid, speaker, or gallery
  const [messages, setMessages] = useState([
    {
      id: 1,
      user: "Prof. Martin",
      message:
        "Bonjour tout le monde! Bienvenue dans le cours de mathématiques.",
      time: "14:30",
      isTeacher: true,
    },
    {
      id: 2,
      user: "Sarah L.",
      message: "Bonjour professeur!",
      time: "14:31",
      isTeacher: false,
    },
    {
      id: 3,
      user: "Alex M.",
      message: "Bonjour à tous",
      time: "14:31",
      isTeacher: false,
    },
  ]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notes, setNotes] = useState("");
  const [screenShare, setScreenShare] = useState(false);

  const participants = [
    {
      name: "Prof. Martin",
      role: "Enseignant",
      isSpeaking: true,
      isHost: true,
      isVideoOn: true,
    },
    {
      name: "Sarah Laurent",
      role: "Élève",
      isSpeaking: false,
      isHost: false,
      isVideoOn: true,
    },
    {
      name: "Alex Martin",
      role: "Élève",
      isSpeaking: false,
      isHost: false,
      isVideoOn: true,
    },
    {
      name: "Emma Dubois",
      role: "Élève",
      isSpeaking: false,
      isHost: false,
      isVideoOn: false,
    },
    {
      name: "Lucas Bernard",
      role: "Élève",
      isSpeaking: false,
      isHost: false,
      isVideoOn: true,
    },
    {
      name: "Vous",
      role: "Parent",
      isSpeaking: false,
      isHost: false,
      isVideoOn: true,
    },
    {
      name: "Marie Curie",
      role: "Élève",
      isSpeaking: false,
      isHost: false,
      isVideoOn: true,
    },
    {
      name: "Paul Durand",
      role: "Élève",
      isSpeaking: false,
      isHost: false,
      isVideoOn: false,
    },
  ];

  const sendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        user: "Vous",
        message: chatMessage,
        time: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isTeacher: false,
      };
      setMessages([...messages, newMessage]);
      setChatMessage("");
    }
  };

  const downloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([notes], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `notes-${className}-${new Date().toLocaleDateString(
      "fr-FR"
    )}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl transition-all duration-500 ${
          isFullscreen ? "w-full h-full" : "w-full max-w-7xl h-[90vh]"
        } overflow-hidden border border-purple-500/20 flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold">EN DIRECT</span>
            </div>
            <h2 className="text-white text-xl font-bold truncate max-w-xs">
              {className || "Classe de Mathématiques"}
            </h2>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-sm font-medium">
                45 min restantes
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all duration-200"
              title="Notes"
            >
              <FileText size={18} />
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
            {/* View Controls */}
            <div className="flex items-center justify-center p-2 bg-slate-800/50 border-b border-slate-700/50">
              <div className="flex space-x-1 bg-slate-700/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveView("grid")}
                  className={`p-2 rounded-md text-sm transition-all ${
                    activeView === "grid"
                      ? "bg-purple-500 text-white"
                      : "text-slate-300 hover:bg-slate-600"
                  }`}
                  title="Vue en grille"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setActiveView("speaker")}
                  className={`p-2 rounded-md text-sm transition-all ${
                    activeView === "speaker"
                      ? "bg-purple-500 text-white"
                      : "text-slate-300 hover:bg-slate-600"
                  }`}
                  title="Vue présentateur"
                >
                  <User size={16} />
                </button>
                <button
                  onClick={() => setActiveView("gallery")}
                  className={`p-2 rounded-md text-sm transition-all ${
                    activeView === "gallery"
                      ? "bg-purple-500 text-white"
                      : "text-slate-300 hover:bg-slate-600"
                  }`}
                  title="Galerie"
                >
                  <Video size={16} />
                </button>
              </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative bg-gradient-to-br from-slate-800 to-slate-900 p-4">
              {/* Teacher's Video (Main) */}
              <div className="relative h-full bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl overflow-hidden border border-purple-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20"></div>

                {screenShare ? (
                  <div className="h-full flex flex-col items-center justify-center bg-black">
                    <div className="text-center p-4">
                      <Monitor size={48} className="text-white mx-auto mb-4" />
                      <h3 className="text-white text-xl font-bold">
                        Partage d'écran
                      </h3>
                      <p className="text-slate-300 mt-2">
                        Prof. Martin partage son écran
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                        <User size={48} className="text-white" />
                      </div>
                      <h3 className="text-white text-2xl font-bold mb-2">
                        Prof. Martin
                      </h3>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 font-medium">
                          En train de parler
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Whiteboard overlay */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg max-w-xs">
                  <div className="text-slate-800 font-semibold text-sm mb-2">
                    Tableau Interactif
                  </div>
                  <div className="w-full h-32 bg-slate-100 rounded border-2 border-dashed border-slate-300 flex items-center justify-center p-2">
                    <span className="text-xs text-slate-500 text-center">
                      x² + 2x + 1 = 0<br />
                      Solution: x = -1
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Grid - Only visible in grid view */}
              {activeView === "grid" && (
                <div className="absolute bottom-4 left-4 right-4 h-1/4">
                  <div className="grid grid-cols-4 gap-2 h-full">
                    {participants.slice(1, 9).map((participant, index) => (
                      <div
                        key={index}
                        className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl overflow-hidden border border-slate-600/50 group hover:border-purple-400/50 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
                        <div className="relative h-full flex flex-col items-center justify-center p-2">
                          {participant.isVideoOn ? (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-2">
                              <User size={20} className="text-white" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center mb-2">
                              <User size={20} className="text-slate-400" />
                            </div>
                          )}
                          <span className="text-white text-xs font-medium text-center truncate w-full px-1">
                            {participant.name}
                          </span>
                          {participant.isSpeaking && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div className="p-4 bg-slate-800/90 backdrop-blur-lg border-t border-slate-700/50">
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isMicOn
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  title={isMicOn ? "Désactiver le micro" : "Activer le micro"}
                >
                  {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isCameraOn
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  title={
                    isCameraOn ? "Désactiver la caméra" : "Activer la caméra"
                  }
                >
                  {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
                </button>

                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isSpeakerOn
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-slate-600 hover:bg-slate-500 text-white"
                  }`}
                  title={isSpeakerOn ? "Désactiver le son" : "Activer le son"}
                >
                  {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
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
                  onClick={() => setScreenShare(!screenShare)}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    screenShare
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-slate-600 hover:bg-slate-500 text-white"
                  }`}
                  title="Partager l'écran"
                >
                  <Share2 size={20} />
                </button>

                <button className="p-3 bg-slate-600 hover:bg-slate-500 rounded-xl text-white transition-all duration-200">
                  <Monitor size={20} />
                </button>

                <button className="p-3 bg-slate-600 hover:bg-slate-500 rounded-xl text-white transition-all duration-200">
                  <Settings size={20} />
                </button>

                <div className="w-px h-8 bg-slate-600"></div>

                <button className="p-3 bg-red-500 hover:bg-red-600 rounded-xl text-white transition-all duration-200">
                  <PhoneOff size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowChat(true);
                    setShowParticipants(false);
                    setShowNotes(false);
                  }}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showChat
                      ? "bg-purple-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <MessageCircle size={16} className="inline mr-2" />
                  Chat ({messages.length})
                </button>
                <button
                  onClick={() => {
                    setShowParticipants(true);
                    setShowChat(false);
                    setShowNotes(false);
                  }}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showParticipants
                      ? "bg-purple-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <Users size={16} className="inline mr-2" />
                  Participants ({participants.length})
                </button>
                <button
                  onClick={() => {
                    setShowNotes(true);
                    setShowChat(false);
                    setShowParticipants(false);
                  }}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showNotes
                      ? "bg-purple-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <FileText size={16} className="inline mr-2" />
                  Notes
                </button>
              </div>
            </div>

            {/* Chat Panel */}
            {showChat && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="group">
                      <div
                        className={`p-3 rounded-2xl ${
                          message.isTeacher
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30"
                            : message.user === "Vous"
                            ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 ml-4"
                            : "bg-slate-700/50 border border-slate-600/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm font-semibold ${
                              message.isTeacher
                                ? "text-purple-300"
                                : message.user === "Vous"
                                ? "text-blue-300"
                                : "text-slate-300"
                            }`}
                          >
                            {message.user}
                            {message.isTeacher && (
                              <span className="ml-1 text-xs bg-purple-500 px-2 py-0.5 rounded-full">
                                Enseignant
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-400">
                            {message.time}
                          </span>
                        </div>
                        <p className="text-white text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-700/50">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Tapez votre message..."
                        className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                        <button className="p-1.5 text-slate-400 hover:text-purple-400 transition-colors">
                          <Smile size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-purple-400 transition-colors">
                          <Paperclip size={16} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={sendMessage}
                      className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white transition-all duration-200 transform hover:scale-105"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants Panel */}
            {showParticipants && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {participants.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600/30 hover:border-purple-400/30 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              participant.isHost
                                ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                                : "bg-gradient-to-br from-blue-400 to-purple-500"
                            }`}
                          >
                            <User size={16} className="text-white" />
                          </div>
                          {participant.isSpeaking && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">
                            {participant.name}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {participant.role}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {participant.isVideoOn ? (
                          <Camera size={14} className="text-green-400" />
                        ) : (
                          <CameraOff size={14} className="text-slate-500" />
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-white transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Panel */}
            {showNotes && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                  <h3 className="text-white font-medium">Mes Notes</h3>
                  <button
                    onClick={downloadNotes}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="Télécharger les notes"
                  >
                    <Download size={16} />
                  </button>
                </div>
                <div className="flex-1 p-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Prenez vos notes ici..."
                    className="w-full h-full bg-slate-700/50 border border-slate-600/30 rounded-xl p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualClassroomModal;
