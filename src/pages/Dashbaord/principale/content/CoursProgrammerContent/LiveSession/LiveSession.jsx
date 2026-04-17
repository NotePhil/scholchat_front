import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, Users, ChevronLeft, ChevronRight,
  Video, Mic, BookOpen, PhoneOff, Maximize2, Minimize2,
  CheckCircle, Loader2, AlertCircle,
} from "lucide-react";
import JitsiRoom from "./JitsiRoom";
import ChapterPanel from "./ChapterPanel";
import ChatBar from "./ChatBar";
import liveSessionService from "../../../../../../services/LiveSessionService";
import { useSessionWebSocket } from "../../../../../../hooks/useSessionWebSocket";

const MODE_ICON = { VIDEO: Video, AUDIO: Mic, CONTENT_ONLY: BookOpen };
const MODE_LABEL = { VIDEO: "Vidéo", AUDIO: "Audio", CONTENT_ONLY: "Contenu" };

const LiveSession = ({ scheduledCourse, cours, onClose, isModerator: isModeratorProp }) => {
  const coursId = cours?.id || scheduledCourse?.cours?.id || scheduledCourse?.coursId;
  const coursTitle = cours?.titre || scheduledCourse?.cours?.titre || "Cours";

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chapitres, setChapitres] = useState([]);
  const [currentChapitreId, setCurrentChapitreId] = useState(null);
  const [progress, setProgress] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [handRaises, setHandRaises] = useState([]);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [chapterChanging, setChapterChanging] = useState(false);
  const sessionRef = useRef(null);

  const currentUserId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || localStorage.getItem("username") || "Utilisateur";
  const isModerator = isModeratorProp ?? false;

  // WebSocket events handler
  const handleWsEvent = useCallback((event) => {
    switch (event.event) {
      case "SESSION_STARTED":
        setSession(prev => ({ ...prev, ...event.session }));
        break;
      case "SESSION_ENDED":
        setSessionEnded(true);
        break;
      case "CHAPTER_CHANGED":
        // { chapitreId, chapitreOrdre, chapitreTitle }
        setCurrentChapitreId(event.chapitreId);
        break;
      case "PARTICIPANT_JOINED":
        // { userId, userName, totalParticipants }
        setParticipants(prev => {
          if (prev.find(p => p.userId === event.userId)) return prev;
          return [...prev, { userId: event.userId, userName: event.userName }];
        });
        break;
      case "PARTICIPANT_LEFT":
        // { userId, totalParticipants }
        setParticipants(prev => prev.filter(p => p.userId !== event.userId));
        break;
      case "HAND_RAISED":
        // { userId, userName }
        setHandRaises(prev => {
          if (prev.find(h => h.userId === event.userId)) return prev;
          return [...prev, { userId: event.userId, userName: event.userName }];
        });
        setTimeout(() => {
          setHandRaises(prev => prev.filter(h => h.userId !== event.userId));
        }, 30000);
        break;
      case "CHAT_MESSAGE":
        // { userId, userName, message, timestamp }
        setMessages(prev => [...prev, event]);
        break;
      default:
        break;
    }
  }, []);

  const { sendChat, raiseHand } = useSessionWebSocket(coursId, handleWsEvent);

  // Load or join session on mount
  useEffect(() => {
    if (!coursId) return;
    const init = async () => {
      setLoading(true);
      try {
        let activeSession;
        try {
          activeSession = await liveSessionService.getActiveSession(coursId);
        } catch (e) {
          if (e.response?.status === 404) {
            setError("Aucune session active. Le professeur n'a pas encore démarré le cours.");
            setLoading(false);
            return;
          }
          throw e;
        }

        // Join — returns fresh SessionResponseDTO with own jitsiJwt
        const joined = await liveSessionService.joinSession(coursId, activeSession.sessionId);
        setSession(joined);
        sessionRef.current = joined;
        setChapitres(joined.chapitres || []);
        setCurrentChapitreId(joined.currentChapitreId || joined.chapitres?.[0]?.id || null);
        setParticipants(joined.participants || []);

        // Load my progress
        try {
          const prog = await liveSessionService.getProgress(coursId);
          setProgress(prog || []);
        } catch (e) { /* ignore */ }

      } catch (e) {
        setError(e.response?.data?.message || e.message || "Erreur lors du chargement de la session");
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
      // Best-effort leave on unmount
      const sid = sessionRef.current?.sessionId;
      if (sid) liveSessionService.leaveSession(coursId, sid).catch(() => {});
    };
  }, [coursId]);

  const handleSelectChapter = async (chapitreId) => {
    if (!isModerator || !session) return;
    setChapterChanging(true);
    try {
      await liveSessionService.changeChapter(coursId, session.sessionId, chapitreId);
      setCurrentChapitreId(chapitreId);
    } catch (e) {
      console.error("Error changing chapter:", e);
    } finally {
      setChapterChanging(false);
    }
  };

  const handleNextChapter = () => {
    const idx = chapitres.findIndex(c => c.id === currentChapitreId);
    if (idx < chapitres.length - 1) handleSelectChapter(chapitres[idx + 1].id);
  };

  const handlePrevChapter = () => {
    const idx = chapitres.findIndex(c => c.id === currentChapitreId);
    if (idx > 0) handleSelectChapter(chapitres[idx - 1].id);
  };

  const handleMarkComplete = async () => {
    if (!currentChapitreId) return;
    try {
      await liveSessionService.saveProgress(coursId, currentChapitreId, true);
      setProgress(prev => {
        const existing = prev.findIndex(p => p.chapitreId === currentChapitreId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], completed: true };
          return updated;
        }
        return [...prev, { chapitreId: currentChapitreId, completed: true }];
      });
    } catch (e) { console.error(e); }
  };

  const handleEndSession = async () => {
    if (!session) return;
    try {
      await liveSessionService.endSession(coursId, session.sessionId);
      setSessionEnded(true);
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = (message) => {
    sendChat(message); // server broadcasts back to sender too via WebSocket
  };

  const handleRaiseHand = () => {
    raiseHand(); // no args needed, server reads from JWT
  };

  const currentChapIdx = chapitres.findIndex(c => c.id === currentChapitreId);

  // --- Render states ---
  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center" style={{ zIndex: 99999 }}>
        <div className="text-center text-white">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-indigo-400" />
          <p className="text-sm text-gray-400">Connexion à la session...</p>
        </div>
      </div>,
      document.body
    );
  }

  if (error) {
    return createPortal(
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Session indisponible</h3>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
            Retour
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const ModeIcon = MODE_ICON[session?.mode] || Video;

  if (sessionEnded) {
    return createPortal(
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Session terminée</h3>
          <p className="text-gray-400 text-sm mb-6">
            {isModerator ? "Vous avez terminé la session." : "Le professeur a terminé la session."}
          </p>
          <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
            Retour aux cours
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-gray-950 flex flex-col" style={{ zIndex: 99999 }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-semibold text-sm truncate">{coursTitle}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">En direct</span>
            <span className="text-gray-500 text-xs">·</span>
            <ModeIcon className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400 text-xs">{MODE_LABEL[session?.mode]}</span>
          </div>
        </div>

        {/* Chapter nav */}
        <div className="hidden sm:flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
          <button onClick={handlePrevChapter} disabled={currentChapIdx <= 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-300 px-1">
            {currentChapIdx + 1} / {chapitres.length}
            {chapterChanging && <Loader2 className="w-3 h-3 animate-spin inline ml-1" />}
          </span>
          <button onClick={handleNextChapter} disabled={currentChapIdx >= chapitres.length - 1} className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-300">{participants.length}</span>
          </div>

          {!isModerator && (
            <button
              onClick={handleMarkComplete}
              disabled={progress.some(p => p.chapitreId === currentChapitreId && p.completed)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Marquer terminé</span>
            </button>
          )}

          {isModerator && (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Terminer</span>
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Jitsi */}
        <div className={`flex flex-col transition-all duration-300 ${panelCollapsed ? "flex-1" : "flex-1 lg:w-0 lg:flex-none lg:basis-[55%]"}`}>
          <div className="flex-1 p-2">
            <JitsiRoom
              roomName={session?.roomName}
              jitsiJwt={session?.jitsiJwt}
              displayName={userName}
              isModerator={isModerator}
              mode={session?.mode}
            />
          </div>
        </div>

        {/* Right: Chapter panel + Chat */}
        <div className={`flex flex-col border-l border-gray-800 transition-all duration-300 ${panelCollapsed ? "w-0 overflow-hidden" : "w-full lg:w-[45%] lg:max-w-sm xl:max-w-md"}`}>
          {/* Toggle button */}
          <button
            onClick={() => setPanelCollapsed(p => !p)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white p-1 rounded-l-lg transition-colors hidden lg:flex"
            style={{ right: panelCollapsed ? 0 : undefined }}
          >
            {panelCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Chapter panel — top half */}
          <div className="flex-1 overflow-hidden min-h-0">
            <ChapterPanel
              chapitres={chapitres}
              currentChapitreId={currentChapitreId}
              progress={progress}
              isModerator={isModerator}
              onSelectChapter={handleSelectChapter}
            />
          </div>

          {/* Chat — bottom */}
          <div className={`flex-shrink-0 transition-all duration-300 ${chatCollapsed ? "h-10" : "h-64"}`}>
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-t border-gray-800 cursor-pointer" onClick={() => setChatCollapsed(p => !p)}>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Chat & Interactions</span>
              {chatCollapsed ? <Maximize2 className="w-3.5 h-3.5 text-gray-500" /> : <Minimize2 className="w-3.5 h-3.5 text-gray-500" />}
            </div>
            {!chatCollapsed && (
              <div className="h-[calc(100%-32px)]">
                <ChatBar
                  messages={messages}
                  participants={participants}
                  handRaises={handRaises}
                  onSendMessage={handleSendMessage}
                  onRaiseHand={handleRaiseHand}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LiveSession;
