import { useCallback, useEffect, useRef, useState } from "react";
import { fetchClassPreview, normalizeClassCode } from "../services/classePreview";

const IDLE = { status: "idle", preview: null, error: "", errorCode: null };

/**
 * Manual lookup of a class code (GET /public/classes/apercu). status: "idle" | "loading" | "found" | "error".
 * Nothing is fetched while typing: `verify()` (alias `check()`) runs the lookup (button "Vérifier le code")
 * and resolves the preview or null. Editing the code after a lookup resets the state to "idle" (card hidden).
 */
export const useClassPreview = (code, type = "eleve", { enabled = true } = {}) => {
  const [state, setState] = useState(IDLE);
  const seq = useRef(0);
  const abortRef = useRef(null);
  // Code of the last lookup (null: nothing shown, nothing to reset).
  const lastCode = useRef(null);
  const clean = normalizeClassCode(code);

  const run = useCallback(
    async (value) => {
      const current = ++seq.current;
      if (abortRef.current) abortRef.current.abort();
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      abortRef.current = controller;
      lastCode.current = value;
      setState((s) => ({ ...s, status: "loading", error: "", errorCode: null }));
      try {
        const preview = await fetchClassPreview(value, type, { signal: controller?.signal });
        if (current !== seq.current) return null;
        setState({ status: "found", preview, error: "", errorCode: null });
        return preview;
      } catch (e) {
        if (e?.name === "AbortError" || current !== seq.current) return null;
        setState({ status: "error", preview: null, error: e.message, errorCode: e.code || null });
        return null;
      }
    },
    [type],
  );

  // The code changed after a lookup (or the hook was disabled): cancel it and go back to "idle".
  useEffect(() => {
    if (enabled && clean === lastCode.current) return;
    if (lastCode.current === null) return;
    seq.current += 1;
    if (abortRef.current) abortRef.current.abort();
    lastCode.current = null;
    setState(IDLE);
  }, [clean, enabled]);

  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  const verify = useCallback(async () => {
    if (!clean) {
      lastCode.current = "";
      setState({ status: "error", preview: null, error: "Le code de la classe est requis.", errorCode: "CODE_CLASSE_REQUIS" });
      return null;
    }
    if (state.status === "found" && state.preview?.code === clean) return state.preview;
    return run(clean);
  }, [clean, run, state]);

  const reset = useCallback(() => {
    seq.current += 1;
    if (abortRef.current) abortRef.current.abort();
    lastCode.current = null;
    setState(IDLE);
  }, []);

  const isValid = state.status === "found" && state.preview?.code === clean;
  return { ...state, isValid, verify, check: verify, reset };
};

export default useClassPreview;
