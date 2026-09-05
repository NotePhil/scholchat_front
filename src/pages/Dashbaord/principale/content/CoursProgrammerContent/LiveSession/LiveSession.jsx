import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import JitsiRoom from "./JitsiRoom";
import ChapterPanel from "./ChapterPanel";
import ChatBar from "./ChatBar";
import liveSessionService from "../../../../../../services/LiveSessionService";
import { coursProgrammerService } from "../../../../../../services/coursProgrammerService";
import { coursService } from "../../../../../../services/CoursService";
import { useSessionWebSocket } from "../../../../../../hooks/useSessionWebSocket";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleExclamation,
  faCompress,
  faExpand,
  faPhoneSlash,
  faSpinner,
  faUsers,
  faVideo,
  faMicrophone,
  faBookOpen,
  faMessage,
} from "@fortawesome/free-solid-svg-icons";
import { asIconComponent } from "../../../../../../utils/faIconAdapter";
const BookOpen = asIconComponent(faBookOpen);
const MessageSquare = asIconComponent(faMessage);
const Mic = asIconComponent(faMicrophone);
const Video = asIconComponent(faVideo);
const MODE_ICON = {
  VIDEO: Video,
  AUDIO: Mic,
  CONTENT_ONLY: BookOpen,
};
const MODE_LABEL = {
  VIDEO: "Vidéo",
  AUDIO: "Audio",
  CONTENT_ONLY: "Contenu",
};
const LiveSession = ({
  scheduledCourse,
  cours,
  onClose,
  isModerator: isModeratorProp,
}) => {
  const coursId =
    cours?.id || scheduledCourse?.cours?.id || scheduledCourse?.coursId;
  const scheduledCourseId = scheduledCourse?.id;
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
  const [redacteurId, setRedacteurId] = useState(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [mobileTab, setMobileTab] = useState("video"); // "video" | "content" | "chat"
  const [chapterChanging, setChapterChanging] = useState(false);
  const sessionRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");
  const userName =
    localStorage.getItem("userName") ||
    localStorage.getItem("username") ||
    "Utilisateur";
  const isModerator = isModeratorProp ?? false;

  // WebSocket events handler
  const handleWsEvent = useCallback((event) => {
    console.log("[LiveSession] WebSocket event received:", event.event, event);
    switch (event.event) {
      case "SESSION_STARTED":
        setSession((prev) => ({
          ...prev,
          ...event.session,
        }));
        break;
      case "SESSION_ENDED":
        setSessionEnded(true);
        break;
      case "CHAPTER_CHANGED":
        // { chapitreId, chapitreOrdre, chapitreTitle }
        setCurrentChapitreId(event.chapitreId);
        break;
      case "PARTICIPANT_JOINED":
        // { userId, userName, totalParticipants, participants }
        console.log(
          "[LiveSession] Participant joined:",
          event.userName,
          "Total:",
          event.totalParticipants,
        );
        if (event.participants && Array.isArray(event.participants)) {
          // Use the full participant list from the event
          setParticipants(event.participants);
          console.log(
            "[LiveSession] Updated participants list from event:",
            event.participants.length,
          );
        } else {
          // Fallback to adding individual participant
          setParticipants((prev) => {
            if (prev.find((p) => p.userId === event.userId)) return prev;
            const updated = [
              ...prev,
              {
                userId: event.userId,
                userName: event.userName,
              },
            ];
            console.log(
              "[LiveSession] Updated participants list (fallback):",
              updated.length,
            );
            return updated;
          });
        }
        break;
      case "PARTICIPANT_LEFT":
        // { userId, totalParticipants, participants }
        console.log(
          "[LiveSession] Participant left:",
          event.userId,
          "Total:",
          event.totalParticipants,
        );
        if (event.participants && Array.isArray(event.participants)) {
          // Use the updated participant list from the event
          setParticipants(event.participants);
          console.log(
            "[LiveSession] Updated participants list from event:",
            event.participants.length,
          );
        } else {
          // Fallback to removing individual participant
          setParticipants((prev) => {
            const updated = prev.filter((p) => p.userId !== event.userId);
            console.log(
              "[LiveSession] Updated participants list (fallback):",
              updated.length,
            );
            return updated;
          });
        }
        break;
      case "HAND_RAISED":
        // { userId, userName }
        setHandRaises((prev) => {
          if (prev.find((h) => h.userId === event.userId)) return prev;
          return [
            ...prev,
            {
              userId: event.userId,
              userName: event.userName,
            },
          ];
        });
        setTimeout(() => {
          setHandRaises((prev) =>
            prev.filter((h) => h.userId !== event.userId),
          );
        }, 30000);
        break;
      case "CHAT_MESSAGE":
        // { userId, userName, message, timestamp }
        setMessages((prev) => [...prev, event]);
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
        console.log("[LiveSession] Initializing session for course:", coursId);
        let activeSession;
        try {
          activeSession = await liveSessionService.getActiveSession(coursId);
          console.log(
            "[LiveSession] Found active session:",
            activeSession.sessionId,
          );
        } catch (e) {
          if (e.response?.status === 404) {
            console.log(
              "[LiveSession] No active session found for course:",
              coursId,
            );
            setError(
              "Aucune session active. Le professeur n'a pas encore démarré le cours.",
            );
            setLoading(false);
            return;
          }
          throw e;
        }

        // Join — returns fresh SessionResponseDTO with own jitsiJwt
        console.log(
          "[LiveSession] Joining session:",
          activeSession.sessionId,
          "as user:",
          currentUserId,
        );
        const joined = await liveSessionService.joinSession(
          coursId,
          activeSession.sessionId,
        );
        console.log(
          "[LiveSession] Successfully joined session. Participants:",
          joined.participants?.length || 0,
        );
        setSession(joined);
        sessionRef.current = joined;

        // Fetch full chapter content (contenu, medias, ressources, fileUrl)
        let fullChapitres = joined.chapitres || [];
        try {
          const fullCours = await coursService.getCoursWithChapitres(coursId);
          const fullMap = Object.fromEntries(
            (fullCours.chapitres || []).map((c) => [c.id, c]),
          );
          fullChapitres = fullChapitres.map((c) => ({
            ...fullMap[c.id],
            ...c,
          }));
          if (fullChapitres.length === 0)
            fullChapitres = fullCours.chapitres || [];
          if (fullCours.redacteurId) setRedacteurId(fullCours.redacteurId);
        } catch (e) {
          /* fallback to session chapitres */
        }
        setChapitres(fullChapitres);
        setCurrentChapitreId(
          joined.currentChapitreId || fullChapitres[0]?.id || null,
        );
        setParticipants(joined.participants || []);
        console.log(
          "[LiveSession] Set initial participants:",
          joined.participants?.length || 0,
        );

        // Load my progress
        try {
          const prog = await liveSessionService.getProgress(coursId);
          setProgress(prog || []);
        } catch (e) {
          /* ignore */
        }
      } catch (e) {
        console.error("[LiveSession] Error initializing session:", e);
        setError(
          e.response?.data?.message ||
            e.message ||
            "Erreur lors du chargement de la session",
        );
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => {
      // Best-effort leave on unmount
      const sid = sessionRef.current?.sessionId;
      if (sid) {
        console.log("[LiveSession] Leaving session on unmount:", sid);
        liveSessionService.leaveSession(coursId, sid).catch(() => {});
      }
    };
  }, [coursId]);

  // Poll session status every 15s so students auto-close when professor ends the session
  // (fallback for when WebSocket SESSION_ENDED event is missed)
  useEffect(() => {
    if (sessionEnded || !coursId || isModerator) return;
    const interval = setInterval(async () => {
      try {
        await liveSessionService.getActiveSession(coursId);
        // If the call succeeds, session is still active — do nothing
      } catch (e) {
        // 404 means no active session → professor ended it
        if (e?.response?.status === 404) {
          setSessionEnded(true);
        }
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [coursId, sessionEnded, isModerator]);
  const handleSelectChapter = async (chapitreId) => {
    if (!isModerator || !session) return;
    setChapterChanging(true);
    try {
      await liveSessionService.changeChapter(
        coursId,
        session.sessionId,
        chapitreId,
      );
      setCurrentChapitreId(chapitreId);
    } catch (e) {
      console.error("Error changing chapter:", e);
    } finally {
      setChapterChanging(false);
    }
  };
  const handleNextChapter = () => {
    const idx = chapitres.findIndex((c) => c.id === currentChapitreId);
    if (idx < chapitres.length - 1) handleSelectChapter(chapitres[idx + 1].id);
  };
  const handlePrevChapter = () => {
    const idx = chapitres.findIndex((c) => c.id === currentChapitreId);
    if (idx > 0) handleSelectChapter(chapitres[idx - 1].id);
  };
  const handleMarkComplete = async () => {
    if (!currentChapitreId) return;
    try {
      await liveSessionService.saveProgress(coursId, currentChapitreId, true);
      setProgress((prev) => {
        const existing = prev.findIndex(
          (p) => p.chapitreId === currentChapitreId,
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = {
            ...updated[existing],
            completed: true,
          };
          return updated;
        }
        return [
          ...prev,
          {
            chapitreId: currentChapitreId,
            completed: true,
          },
        ];
      });
    } catch (e) {
      console.error(e);
    }
  };
  const handleEndSession = async () => {
    if (!session) return;
    try {
      await liveSessionService.endSession(coursId, session.sessionId);
      if (scheduledCourseId) {
        await coursProgrammerService
          .terminerCours(scheduledCourseId)
          .catch(() => {});
      }
      setSessionEnded(true);
    } catch (e) {
      console.error(e);
    }
  };
  const handleSendMessage = (message) => {
    sendChat(message); // server broadcasts back to sender too via WebSocket
  };
  const handleRaiseHand = () => {
    raiseHand(); // no args needed, server reads from JWT
  };
  const currentChapIdx = chapitres.findIndex((c) => c.id === currentChapitreId);

  // --- Render states ---
  if (loading) {
    return createPortal(
      <div
        className="fixed inset-0 bg-gray-950 flex items-center justify-center"
        style={{
          zIndex: 99999,
        }}
      >
        <div className="text-center text-white">
          <FontAwesomeIcon
            icon={faSpinner}
            className="w-10 h-10 animate-spin mx-auto mb-3 text-indigo-400"
          />
          <p className="text-sm text-gray-400">Connexion à la session...</p>
        </div>
      </div>,
      document.body,
    );
  }
  if (error) {
    return createPortal(
      <div
        className="fixed inset-0 bg-gray-950 flex items-center justify-center p-4"
        style={{
          zIndex: 99999,
        }}
      >
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="w-12 h-12 text-red-400 mx-auto mb-4"
          />
          <h3 className="text-white font-bold text-lg mb-2">
            Session indisponible
          </h3>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            Retour
          </button>
        </div>
      </div>,
      document.body,
    );
  }
  const ModeIcon = MODE_ICON[session?.mode] || Video;
  if (sessionEnded) {
    return createPortal(
      <div
        className="fixed inset-0 bg-gray-950 flex items-center justify-center p-4"
        style={{
          zIndex: 99999,
        }}
      >
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <FontAwesomeIcon
            icon={faCircleCheck}
            className="w-12 h-12 text-green-400 mx-auto mb-4"
          />
          <h3 className="text-white font-bold text-lg mb-2">
            Session terminée
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {isModerator
              ? "Vous avez terminé la session."
              : "Le professeur a terminé la session."}
          </p>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            Retour aux cours
          </button>
        </div>
      </div>,
      document.body,
    );
  }
  return createPortal(
    <div
      className="fixed inset-0 bg-gray-950 flex flex-col"
      style={{
        zIndex: 99999,
      }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-semibold text-sm truncate">
            {coursTitle}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">
              En direct
            </span>
            <span className="text-gray-500 text-xs">·</span>
            <ModeIcon className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400 text-xs">
              {MODE_LABEL[session?.mode]}
            </span>
          </div>
        </div>

        {/* Chapter nav — visible on all sizes */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
          <button
            onClick={handlePrevChapter}
            disabled={currentChapIdx <= 0}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-300 px-1">
            {currentChapIdx + 1}/{chapitres.length}
            {chapterChanging && (
              <FontAwesomeIcon
                icon={faSpinner}
                className="w-3 h-3 animate-spin inline ml-1"
              />
            )}
          </span>
          <button
            onClick={handleNextChapter}
            disabled={currentChapIdx >= chapitres.length - 1}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg">
            <FontAwesomeIcon
              icon={faUsers}
              className="w-3.5 h-3.5 text-gray-400"
            />
            <span className="text-xs text-gray-300">{participants.length}</span>
          </div>

          {!isModerator && (
            <button
              onClick={handleMarkComplete}
              disabled={progress.some(
                (p) => p.chapitreId === currentChapitreId && p.completed,
              )}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
              <span>Marquer terminé</span>
            </button>
          )}

          {isModerator && (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faPhoneSlash} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Terminer</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE layout: stacked tabs ── */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {/* Video tab */}
          <div
            className={`w-full h-full ${mobileTab === "video" ? "block" : "hidden"}`}
          >
            <JitsiRoom
              roomName={session?.roomName}
              jitsiJwt={session?.jitsiJwt}
              jitsiDomain={session?.jitsiDomain}
              displayName={userName}
              isModerator={isModerator}
              mode={session?.mode}
              onHangup={isModerator ? handleEndSession : onClose}
            />
          </div>
          {/* Content tab */}
          <div
            className={`w-full h-full overflow-y-auto ${mobileTab === "content" ? "block" : "hidden"}`}
          >
            <ChapterPanel
              chapitres={chapitres}
              currentChapitreId={currentChapitreId}
              progress={progress}
              isModerator={isModerator}
              onSelectChapter={handleSelectChapter}
              redacteurId={redacteurId}
            />
          </div>
          {/* Chat tab */}
          <div
            className={`w-full h-full ${mobileTab === "chat" ? "flex flex-col" : "hidden"}`}
          >
            <ChatBar
              messages={messages}
              participants={participants}
              handRaises={handRaises}
              onSendMessage={handleSendMessage}
              onRaiseHand={handleRaiseHand}
            />
          </div>
        </div>

        {/* Bottom tab bar */}
        <div className="flex-shrink-0 flex border-t border-gray-800 bg-gray-900">
          {[
            {
              key: "video",
              icon: session?.mode === "AUDIO" ? Mic : Video,
              label: "Vidéo",
            },
            {
              key: "content",
              icon: BookOpen,
              label: "Contenu",
            },
            {
              key: "chat",
              icon: MessageSquare,
              label: "Chat",
            },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${mobileTab === key ? "text-indigo-400 border-t-2 border-indigo-400" : "text-gray-500 border-t-2 border-transparent"}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── DESKTOP layout: side by side ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left: Jitsi */}
        <div
          className={`flex flex-col transition-all duration-300 ${panelCollapsed ? "flex-1" : "flex-1 lg:w-0 lg:flex-none lg:basis-[55%]"}`}
        >
          <div className="flex-1 p-2">
            <JitsiRoom
              roomName={session?.roomName}
              jitsiJwt={session?.jitsiJwt}
              jitsiDomain={session?.jitsiDomain}
              displayName={userName}
              isModerator={isModerator}
              mode={session?.mode}
              onHangup={isModerator ? handleEndSession : onClose}
            />
          </div>
        </div>
        <div
          className={`relative flex flex-col border-l border-gray-800 transition-all duration-300 ${panelCollapsed ? "w-0 overflow-hidden" : "w-[45%]"}`}
        >
          <button
            onClick={() => setPanelCollapsed((p) => !p)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white p-1 rounded-l-lg transition-colors flex"
            style={{
              right: panelCollapsed ? 0 : undefined,
            }}
          >
            {panelCollapsed ? (
              <FontAwesomeIcon icon={faExpand} className="w-3.5 h-3.5" />
            ) : (
              <FontAwesomeIcon icon={faCompress} className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="flex-1 overflow-hidden min-h-0">
            <ChapterPanel
              chapitres={chapitres}
              currentChapitreId={currentChapitreId}
              progress={progress}
              isModerator={isModerator}
              onSelectChapter={handleSelectChapter}
              redacteurId={redacteurId}
            />
          </div>

          <div
            className={`flex-shrink-0 transition-all duration-300 ${chatCollapsed ? "h-10" : "h-64"}`}
          >
            <div
              className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-t border-gray-800 cursor-pointer"
              onClick={() => setChatCollapsed((p) => !p)}
            >
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Chat & Interactions
              </span>
              {chatCollapsed ? (
                <FontAwesomeIcon
                  icon={faExpand}
                  className="w-3.5 h-3.5 text-gray-500"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faCompress}
                  className="w-3.5 h-3.5 text-gray-500"
                />
              )}
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
    document.body,
  );
};
export default LiveSession;
