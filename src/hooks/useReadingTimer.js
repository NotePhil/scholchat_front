import { useCallback, useEffect, useRef } from "react";

/** Same cap as the backend (CoursBusiness.DUREE_LECTURE_MAX_SECONDES): 4 h. */
export const MAX_READING_SECONDS = 4 * 3600;

/**
 * Active reading time of a course's chapters, sent with "Marquer comme terminé".
 *
 * The clock only runs while the tab is visible. A chapter's time is measured from its first
 * opening — or from the previous "Marquer comme terminé" click if that is more recent — to the
 * click (falls back to the page opening when the chapter was never expanded). Capped at 4 h.
 */
export const useReadingTimer = () => {
  const accumulated = useRef(0);
  const runningSince = useRef(
    typeof document === "undefined" || document.visibilityState !== "hidden" ? Date.now() : null,
  );
  const openedAt = useRef({});
  const lastMark = useRef(0);

  const now = useCallback(
    () => accumulated.current + (runningSince.current != null ? Date.now() - runningSince.current : 0),
    [],
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (runningSince.current != null) {
          accumulated.current += Date.now() - runningSince.current;
          runningSince.current = null;
        }
      } else if (runningSince.current == null) {
        runningSince.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /** A chapter became visible (expanded): its clock starts at the first opening. */
  const markOpened = useCallback(
    (key) => {
      if (key != null && openedAt.current[key] == null) openedAt.current[key] = now();
    },
    [now],
  );

  /** Seconds to send for this chapter (not consumed until `commit`). */
  const peek = useCallback(
    (key) => {
      const start = Math.max(openedAt.current[key] ?? 0, lastMark.current);
      return Math.min(MAX_READING_SECONDS, Math.max(0, Math.round((now() - start) / 1000)));
    },
    [now],
  );

  /** The completion was saved: the next chapter's time starts now. */
  const commit = useCallback(() => {
    lastMark.current = now();
  }, [now]);

  return { markOpened, peek, commit };
};

/** Reading time for display: "< 1 min", "12 min", "1 h 05". Empty string when null. */
export const formatDuration = (seconds) => {
  if (seconds == null || !Number.isFinite(Number(seconds))) return "";
  const s = Math.max(0, Math.round(Number(seconds)));
  if (s < 60) return "< 1 min";
  const minutes = Math.round(s / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
};
