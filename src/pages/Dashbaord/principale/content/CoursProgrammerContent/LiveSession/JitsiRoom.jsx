import React, { useEffect, useRef } from "react";

const JitsiRoom = ({ roomName, jitsiJwt, jitsiDomain, displayName, isModerator, mode }) => {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!roomName || !jitsiDomain || !containerRef.current) return;

    const loadJitsi = () => {
      if (!window.JitsiMeetExternalAPI) return;

      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }

      const options = {
        roomName,
        parentNode: containerRef.current,
        jwt: jitsiJwt,
        userInfo: { displayName: displayName || "Utilisateur" },
        configOverwrite: {
          startWithAudioMuted: !isModerator,
          startWithVideoMuted: mode !== "VIDEO" || !isModerator,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          disableInviteFunctions: true,
          enableWelcomePage: false,
          toolbarButtons: isModerator
            ? ["microphone", "camera", "desktop", "chat", "raisehand", "tileview", "hangup"]
            : ["microphone", "camera", "chat", "raisehand", "tileview", "hangup"],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          HIDE_INVITE_MORE_HEADER: true,
        },
      };

      if (mode === "AUDIO") options.configOverwrite.startWithVideoMuted = true;
      if (mode === "CONTENT_ONLY") {
        options.configOverwrite.startWithVideoMuted = true;
        options.configOverwrite.startWithAudioMuted = true;
      }

      apiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, options);
    };

    if (window.JitsiMeetExternalAPI) {
      loadJitsi();
    } else {
      const script = document.createElement("script");
      script.src = `https://${jitsiDomain}/libs/external_api.min.js`;
      script.async = true;
      script.onload = loadJitsi;
      document.head.appendChild(script);
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, jitsiJwt, jitsiDomain, displayName, isModerator, mode]);

  if (mode === "CONTENT_ONLY") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-xl">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📚</span>
          </div>
          <p className="font-semibold">Mode Contenu Seul</p>
          <p className="text-sm text-gray-400 mt-1">Suivez le cours dans le panneau de droite</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />;
};

export default JitsiRoom;
