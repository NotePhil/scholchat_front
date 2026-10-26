// Parent "limited mode": until one of his children has been accepted in a class
// (AuthResponse / GET /utilisateurs/{id} → parentAEnfantValide === false), the
// backend refuses everything except auth, own profile, password, notifications,
// /parents/{id}/enfants** and child inscriptions / requests with
// 403 { code: "PARENT_SANS_ENFANT_VALIDE" }. The web then only shows
// « Mes enfants », Profil / Paramètres and the notifications.

export const PARENT_LIMITED_CODE = "PARENT_SANS_ENFANT_VALIDE";

/** Emitted (window event) whenever the stored flag changes: detail = { valid: boolean }. */
export const PARENT_ACCESS_CHANGED_EVENT = "parent:accessChanged";
/** Emitted when a request was refused with 403 PARENT_SANS_ENFANT_VALIDE. */
export const PARENT_LIMITED_EVENT = "parent:limited";

/** Tabs a limited parent can open. */
export const PARENT_LIMITED_TABS = ["my-children", "settings"];

const API = process.env.REACT_APP_API_BASE_URL;

const readAuthResponse = () => {
  try {
    return JSON.parse(localStorage.getItem("authResponse") || "{}") || {};
  } catch {
    return {};
  }
};

/**
 * true / false when the backend sent the flag, null when unknown (older backend / session):
 * an unknown flag never locks the parent out.
 */
export const getParentAccessFlag = () => {
  const value = readAuthResponse().parentAEnfantValide;
  return typeof value === "boolean" ? value : null;
};

export const isParentLimited = () => getParentAccessFlag() === false;

export const setParentAccessFlag = (valid) => {
  if (typeof valid !== "boolean") return;
  const auth = readAuthResponse();
  const changed = auth.parentAEnfantValide !== valid;
  try {
    localStorage.setItem("authResponse", JSON.stringify({ ...auth, parentAEnfantValide: valid }));
  } catch {
    // storage unavailable: the flag is re-read from the server
  }
  if (changed) {
    window.dispatchEvent(new CustomEvent(PARENT_ACCESS_CHANGED_EVENT, { detail: { valid } }));
  }
};

const isParentSession = () => String(localStorage.getItem("userRole") || "").toUpperCase().includes("PARENT");

/** Re-reads parentAEnfantValide (GET /utilisateurs/{id}); resolves the flag (or null when unknown). */
export const refreshParentAccessFlag = async () => {
  if (!isParentSession()) return null;
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  if (!userId || !token) return getParentAccessFlag();
  try {
    const resp = await fetch(`${API}/utilisateurs/${userId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!resp.ok) return getParentAccessFlag();
    const data = await resp.json().catch(() => null);
    if (data && typeof data.parentAEnfantValide === "boolean") setParentAccessFlag(data.parentAEnfantValide);
  } catch {
    // network error: keep the stored flag
  }
  return getParentAccessFlag();
};

export const isParentLimitedPayload = (data) => !!data && typeof data === "object" && data.code === PARENT_LIMITED_CODE;

export const notifyParentLimited = () => {
  if (!isParentSession()) return;
  setParentAccessFlag(false);
  window.dispatchEvent(new Event(PARENT_LIMITED_EVENT));
};

const inspectForbiddenBody = (text) => {
  if (!text || text.indexOf(PARENT_LIMITED_CODE) < 0) return;
  try {
    if (isParentLimitedPayload(JSON.parse(text))) notifyParentLimited();
  } catch {
    // not JSON
  }
};

/** For a fetch Response (Principal's fetch wrapper calls it). */
export const checkFetchResponseForParentLimit = (response) => {
  if (!response || response.status !== 403) return;
  response
    .clone()
    .text()
    .then(inspectForbiddenBody)
    .catch(() => {});
};

/**
 * Watches every XHR answer (hence every axios instance) for 403 PARENT_SANS_ENFANT_VALIDE.
 * Returns the uninstall function.
 */
export const installParentLimitNetworkHook = () => {
  const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
  const originalSend = proto ? proto.send : null;
  if (!proto || !originalSend) return () => {};
  proto.send = function patchedSend(...args) {
    this.addEventListener("loadend", () => {
      if (this.status !== 403) return;
      if (this.responseType && this.responseType !== "text") {
        if (this.responseType === "json" && isParentLimitedPayload(this.response)) notifyParentLimited();
        return;
      }
      try {
        inspectForbiddenBody(this.responseText);
      } catch {
        // responseText not readable
      }
    });
    return originalSend.apply(this, args);
  };
  return () => {
    proto.send = originalSend;
  };
};
