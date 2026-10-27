import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faCircleExclamation,
  faFilm,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Shared video/image media building blocks:
 *  - VideoThumbnail: feed/chat tile showing a real preview frame (no autoplay,
 *    metadata fetched only once the tile is near the viewport).
 *  - VideoViewerPlayer: full player for lightboxes with loading / buffering /
 *    error states.
 *  - ViewerImage: lightbox image with a spinner until loaded and a retry state.
 *
 * Preview frames are rendered by a real <video> element (no canvas capture), so
 * they work with presigned URLs even when the bucket sends no CORS headers.
 */

/** "m:ss" / "h:mm:ss" from seconds; "" when unknown. */
export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};

/** Appends a media fragment so browsers paint the frame at 0.5 s as preview. */
export const withPreviewFragment = (url) => {
  if (!url || url.includes("#") || url.startsWith("blob:")) return url;
  return `${url}#t=0.5`;
};

/** True once the element has been near the viewport (sticky). */
const useNearViewport = (ref, rootMargin = "200px") => {
  const [near, setNear] = useState(
    () => typeof window === "undefined" || !("IntersectionObserver" in window),
  );
  useEffect(() => {
    if (near) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near, ref, rootMargin]);
  return near;
};

const Spinner = ({ size = 40, className = "" }) => (
  <span
    className={`inline-block rounded-full border-[3px] border-white/25 border-t-white animate-spin ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
);

const PlayBadge = ({ compact }) => (
  <div
    className={`${compact ? "w-10 h-10" : "w-14 h-14"} rounded-full bg-black/45 backdrop-blur-sm border-2 border-white/70 flex items-center justify-center shadow-xl transition-transform duration-200 group-hover:scale-110`}
  >
    <svg
      viewBox="0 0 24 24"
      className={`${compact ? "w-4 h-4" : "w-6 h-6"} text-white fill-current ml-0.5`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  </div>
);

/** Neutral placeholder (never black) for a video whose preview can't load. */
export const VideoPlaceholder = ({ compact = false, label = "Vidéo" }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-500 dark:text-slate-300">
    <FontAwesomeIcon
      icon={faFilm}
      className={compact ? "w-6 h-6" : "w-9 h-9"}
      style={{ fontSize: compact ? 22 : 34 }}
    />
    <span className={`${compact ? "text-[11px]" : "text-xs"} font-semibold`}>
      {label}
    </span>
  </div>
);

/**
 * VideoThumbnail — preview tile for a video.
 * Props: src (playable URL), poster (optional thumbnail URL, preferred),
 * className (sizing), compact (smaller icons), onClick, onError (e.g. to
 * re-resolve an expired presigned URL; a new src resets the tile).
 * Without src (URL still resolving) the skeleton stays.
 */
export const VideoThumbnail = ({
  src,
  poster,
  className = "",
  compact = false,
  onClick,
  onError,
  title = "Lire la vidéo",
}) => {
  const containerRef = useRef(null);
  const near = useNearViewport(containerRef);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [duration, setDuration] = useState(null);
  const fallbackTimer = useRef(null);

  useEffect(() => {
    setStatus("loading");
    setDuration(null);
  }, [src, poster]);
  useEffect(() => () => clearTimeout(fallbackTimer.current), []);

  const markReady = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    setStatus((s) => (s === "error" ? s : "ready"));
  }, []);

  const onMetadata = (e) => {
    const v = e.currentTarget;
    if (Number.isFinite(v.duration)) setDuration(v.duration);
    if (v.readyState >= 2) markReady();
    // Some browsers (iOS Safari) never fire loadeddata with preload=metadata
    // although they paint the #t frame: don't keep the skeleton forever.
    else fallbackTimer.current = setTimeout(markReady, 2500);
  };

  const usePoster = !!poster && status !== "error";
  const showVideo = !usePoster && !!src && near && status !== "error";

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 group ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      title={title}
      role={onClick ? "button" : undefined}
    >
      {usePoster && near && (
        <img
          src={poster}
          alt=""
          loading="lazy"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          onLoad={markReady}
          onError={() => setStatus("error")}
        />
      )}
      {showVideo && (
        <video
          src={withPreviewFragment(src)}
          preload="metadata"
          muted
          playsInline
          disablePictureInPicture
          tabIndex={-1}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onLoadedMetadata={onMetadata}
          onLoadedData={markReady}
          onSeeked={markReady}
          onError={() => {
            clearTimeout(fallbackTimer.current);
            setStatus("error");
            if (onError) onError();
          }}
        />
      )}
      {status === "loading" && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
      )}
      {status === "error" && !usePoster && (
        <VideoPlaceholder compact={compact} />
      )}

      {/* Play overlay (the placeholder already says "Vidéo" on error) */}
      {!(status === "error" && !usePoster) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none">
          <PlayBadge compact={compact} />
        </div>
      )}

      {duration ? (
        <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded pointer-events-none tabular-nums">
          {formatDuration(duration)}
        </span>
      ) : null}
    </div>
  );
};

/** Percentage of the video buffered ahead of the playhead (0–100). */
const bufferedPercent = (video) => {
  if (!video || !Number.isFinite(video.duration) || video.duration <= 0)
    return null;
  const { buffered, currentTime } = video;
  let end = 0;
  for (let i = 0; i < buffered.length; i += 1) {
    if (buffered.start(i) <= currentTime + 0.5) end = Math.max(end, buffered.end(i));
  }
  return Math.min(100, Math.round((end / video.duration) * 100));
};

/**
 * VideoViewerPlayer — player for lightboxes/modals with clear states:
 * spinner + "Chargement de la vidéo…" + buffered % until playable, buffering
 * spinner on waiting/stalled, error state with "Réessayer".
 * onRetry (optional, async) may return a fresh URL (e.g. expired presigned URL).
 */
export const VideoViewerPlayer = ({
  src,
  poster,
  autoPlay = true,
  className = "",
  style,
  maxVideoHeight = "75vh",
  onRetry,
  onClick,
}) => {
  const videoRef = useRef(null);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [attempt, setAttempt] = useState(0);
  // loading: fetching until playable · idle: waiting for the user to press
  // play (autoplay refused, e.g. iOS) · ready · error
  const [phase, setPhase] = useState("loading");
  const [buffering, setBuffering] = useState(false);
  const [pct, setPct] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setPhase("loading");
    setBuffering(false);
    setPct(null);
  }, [src]);

  const updatePct = () => setPct(bufferedPercent(videoRef.current));

  // Autoplay attempt (instead of the attribute) so a refusal doesn't leave the
  // loading overlay up forever on browsers that then load nothing (iOS).
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !currentSrc) return undefined;
    let timer;
    if (autoPlay) {
      const p = v.play();
      if (p && p.catch)
        p.catch(() => {
          if (v.readyState < 3 && v.networkState !== 2)
            setPhase((ph) => (ph === "loading" ? "idle" : ph));
        });
    } else {
      // Not autoplaying: metadata is enough; don't wait for data that some
      // browsers only fetch after a tap.
      timer = setTimeout(
        () => setPhase((ph) => (ph === "loading" ? "idle" : ph)),
        6000,
      );
    }
    return () => clearTimeout(timer);
  }, [currentSrc, attempt, autoPlay]);

  const retry = async (e) => {
    if (e) e.stopPropagation();
    setRetrying(true);
    let next = currentSrc;
    try {
      if (onRetry) next = (await onRetry()) || currentSrc;
    } catch (err) {
      /* keep the current URL */
    }
    setRetrying(false);
    setCurrentSrc(next);
    setPhase("loading");
    setBuffering(false);
    setPct(null);
    setAttempt((a) => a + 1);
  };

  const showLoading =
    phase === "loading" || (buffering && phase !== "error");

  return (
    <div
      className={`relative flex items-center justify-center bg-black ${phase === "loading" ? "min-h-[220px]" : ""} ${className}`}
      style={style}
      onClick={onClick}
    >
      {currentSrc && phase !== "error" && (
        <video
          key={`${currentSrc}-${attempt}`}
          ref={videoRef}
          src={currentSrc}
          poster={poster}
          controls
          playsInline
          preload="auto"
          className="block w-full object-contain"
          style={{ maxHeight: maxVideoHeight }}
          onLoadedMetadata={() => {
            updatePct();
            if (!autoPlay) setPhase((ph) => (ph === "loading" ? "ready" : ph));
          }}
          onProgress={updatePct}
          onCanPlay={() => {
            setPhase("ready");
            setBuffering(false);
            updatePct();
          }}
          onPlay={(e) => {
            if (e.currentTarget.readyState < 3) setBuffering(true);
          }}
          onPlaying={() => {
            setBuffering(false);
            setPhase("ready");
          }}
          onWaiting={() => {
            setBuffering(true);
            updatePct();
          }}
          onStalled={(e) => {
            const v = e.currentTarget;
            if (!v.paused && v.readyState < 3) setBuffering(true);
          }}
          onTimeUpdate={(e) => {
            if (buffering && e.currentTarget.readyState >= 3) setBuffering(false);
          }}
          onSeeking={updatePct}
          onError={() => setPhase("error")}
        />
      )}

      {!currentSrc && phase !== "error" && <div className="w-full aspect-video" />}

      {showLoading && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none ${phase === "loading" ? "bg-black/60" : "bg-black/25"}`}
          role="status"
          aria-live="polite"
        >
          <Spinner size={phase === "loading" ? 44 : 36} />
          <span className="text-white text-sm font-medium drop-shadow">
            {phase === "loading"
              ? "Chargement de la vidéo…"
              : "Mise en mémoire tampon…"}
            {pct != null && pct > 0 ? ` ${pct} %` : ""}
          </span>
          {pct != null && (
            <div className="w-48 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white transition-[width] duration-300"
                style={{ width: `${Math.max(3, pct)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {phase === "error" && (
        <div className="w-full min-h-[220px] aspect-video flex flex-col items-center justify-center gap-3 text-gray-300 p-6 text-center">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            style={{ fontSize: 34 }}
            className="text-red-400"
          />
          <span className="text-sm">Impossible de lire la vidéo.</span>
          <button
            type="button"
            onClick={retry}
            disabled={retrying}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm font-semibold disabled:opacity-60"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={retrying ? "animate-spin" : ""}
            />
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
};

/** Lightbox image: spinner until loaded, retry on error. */
export const ViewerImage = ({ src, alt = "", className = "", style, onClick, onRetry }) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState("loading"); // loading | ready | error

  useEffect(() => {
    setCurrentSrc(src);
    setState("loading");
  }, [src]);

  const retry = async (e) => {
    if (e) e.stopPropagation();
    let next = currentSrc;
    try {
      if (onRetry) next = (await onRetry()) || currentSrc;
    } catch (err) {
      /* keep the current URL */
    }
    setCurrentSrc(next);
    setState("loading");
    setAttempt((a) => a + 1);
  };

  if (state === "error") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 text-gray-300 p-8 rounded-xl bg-black/40"
        onClick={onClick}
      >
        <FontAwesomeIcon
          icon={faCircleExclamation}
          style={{ fontSize: 30 }}
          className="text-red-400"
        />
        <span className="text-sm">Impossible de charger l'image.</span>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm font-semibold"
        >
          <FontAwesomeIcon icon={faArrowsRotate} />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <Spinner size={42} />
          <span className="text-white/90 text-sm">Chargement de l'image…</span>
        </div>
      )}
      {currentSrc && (
        <img
          key={`${currentSrc}-${attempt}`}
          src={currentSrc}
          alt={alt}
          className={`${className} transition-opacity duration-200 ${state === "loading" ? "opacity-0" : "opacity-100"}`}
          style={style}
          onClick={onClick}
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
        />
      )}
    </>
  );
};
