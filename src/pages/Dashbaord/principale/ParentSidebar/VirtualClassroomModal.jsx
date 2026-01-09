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
  const [chatMessage, setChatMessage] = useState("");
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

  const participants = [
    {
      name: "Prof. Martin",
      role: "Enseignant",
      isSpeaking: true,
      isHost: true,
    },
    { name: "Sarah Laurent", role: "Élève", isSpeaking: false, isHost: false },
    { name: "Alex Martin", role: "Élève", isSpeaking: false, isHost: false },
    { name: "Emma Dubois", role: "Élève", isSpeaking: false, isHost: false },
    { name: "Lucas Bernard", role: "Élève", isSpeaking: false, isHost: false },
    { name: "Vous", role: "Parent", isSpeaking: false, isHost: false },
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl transition-all duration-500 ${
          isFullscreen ? "w-full h-full" : "w-full max-w-7xl h-[90vh]"
        } overflow-hidden border border-purple-500/20`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold">EN DIRECT</span>
            </div>
            <h2 className="text-white text-xl font-bold">{className}</h2>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-sm font-medium">
                45 min restantes
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all duration-200"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-all duration-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Main Video Area */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-800 to-slate-900">
            {/* Teacher's Video (Main) */}
            <div className="relative h-2/3 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl m-4 overflow-hidden border border-purple-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
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

              {/* Whiteboard overlay */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <div className="text-slate-800 font-semibold text-sm mb-2">
                  Tableau Interactif
                </div>
                <div className="w-24 h-16 bg-slate-100 rounded border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <span className="text-xs text-slate-500">Équation</span>
                </div>
              </div>
            </div>

            {/* Student Grid */}
            <div className="h-1/3 p-4 pt-0">
              <div className="grid grid-cols-4 gap-3 h-full">
                {participants.slice(1, 5).map((participant, index) => (
                  <div
                    key={index}
                    className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl overflow-hidden border border-slate-600/50 group hover:border-purple-400/50 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
                    <div className="relative h-full flex flex-col items-center justify-center p-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-2">
                        <User size={20} className="text-white" />
                      </div>
                      <span className="text-white text-xs font-medium text-center">
                        {participant.name}
                      </span>
                      {participant.isSpeaking && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Control Bar */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl p-3 flex items-center space-x-3 border border-slate-600/50 shadow-2xl">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isMicOn
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
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
                >
                  <Hand size={20} />
                </button>

                <div className="w-px h-8 bg-slate-600"></div>

                <button className="p-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white transition-all duration-200">
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
          <div className="w-80 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowChat(true);
                    setShowParticipants(false);
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
              <div className="p-4">
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
                      <button className="p-1.5 text-slate-400 hover:text-white transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  ))}
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
