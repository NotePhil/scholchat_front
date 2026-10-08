// Login helpers shared by the Login page and the forced "Nouveau mot de passe" page.
import { encryptPassword } from "./crypto";
import { setCredentials } from "../store/slices/authSlice";

export const FORCED_PASSWORD_PATH = "/schoolchat/nouveau-mot-de-passe";

const ROLE_PATHS = {
  ROLE_ADMIN: "/schoolchat/Principal/AdminDashboard/activities",
  ROLE_PROFESSOR: "/schoolchat/Principal/ProfessorDashboard/activities",
  ROLE_PARENT: "/schoolchat/Principal/ParentDashboard/activities",
  ROLE_STUDENT: "/schoolchat/Principal/StudentDashboard/activities",
  ROLE_TUTOR: "/schoolchat/Principal/ProfessorDashboard/activities",
  ROLE_GESTIONNAIRE: "/schoolchat/Principal/GestionnaireDashboard/activities",
};

export const dashboardPathForRole = (role) => {
  const r = String(role || "").toUpperCase();
  return ROLE_PATHS[r.startsWith("ROLE_") ? r : "ROLE_" + r] || ROLE_PATHS.ROLE_ADMIN;
};

export const decodeJWT = (token) => {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const json = decodeURIComponent(
      raw
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/** POST /auth/login. Resolves with the auth payload; rejects with an Error carrying `code`/`status`. */
export const requestLogin = async ({ email, password, selectedRole }) => {
  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: encryptPassword(password),
      ...(selectedRole ? { selectedRole } : {}),
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const err = new Error(data.message || "Échec de l'authentification");
    err.code = data.code;
    err.status = response.status;
    throw err;
  }
  return response.json();
};

/**
 * Stores the authenticated session in localStorage (+ Redux) exactly like the historical
 * Login.completeLogin did, and returns the URL to open (dashboard of the active role, or the
 * stored return page when it belongs to that dashboard). Returns null if the payload is unusable.
 */
export const storeLoginSession = (authData, { selectedRole = null, fallbackEmail = "", dispatch } = {}) => {
  const accessToken = authData?.accessToken;
  const decodedToken = decodeJWT(accessToken);
  if (!decodedToken) return null;

  const userId = authData.userId;
  const userEmail = authData.userEmail || decodedToken.email || fallbackEmail;
  const username = authData.username || decodedToken.username || String(userEmail).split("@")[0];
  if (!userId || String(userId).includes("@")) return null;

  const roleStr = selectedRole || authData.selectedRole || null;
  const activeRole = roleStr
    ? roleStr.toUpperCase().startsWith("ROLE_")
      ? roleStr.toUpperCase()
      : "ROLE_" + roleStr.toUpperCase()
    : null;

  let userRoles = [];
  let primaryRole = activeRole;
  if (Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0) {
    userRoles = decodedToken.roles;
    if (!primaryRole) {
      primaryRole = decodedToken.roles.length > 1 ? decodedToken.roles[1] : decodedToken.roles[0];
    }
  }

  const returnToPage = localStorage.getItem("returnToPage");
  const language = localStorage.getItem("language");
  localStorage.clear();
  if (language) localStorage.setItem("language", language);

  localStorage.setItem("accessToken", accessToken);
  if (authData.refreshToken) localStorage.setItem("refreshToken", authData.refreshToken);
  localStorage.setItem("authToken", accessToken);
  localStorage.setItem("userRole", primaryRole);
  localStorage.setItem("userId", userId);
  localStorage.setItem("userEmail", userEmail);
  localStorage.setItem("username", username);
  localStorage.setItem("userName", username);
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("loginTime", new Date().getTime().toString());
  localStorage.setItem("userRoles", JSON.stringify(userRoles));
  localStorage.setItem("decodedToken", JSON.stringify(decodedToken));
  localStorage.setItem("authResponse", JSON.stringify(authData));
  if (authData.availableRoles) localStorage.setItem("availableRoles", JSON.stringify(authData.availableRoles));
  if (authData.children) localStorage.setItem("children", JSON.stringify(authData.children));
  if (Array.isArray(authData.expiredEntities) && authData.expiredEntities.length > 0) {
    localStorage.setItem("expiredOfferEntities", JSON.stringify(authData.expiredEntities));
  }

  if (dispatch) {
    const user = { name: username, email: userEmail, username, phone: "", id: userId };
    dispatch(setCredentials({ token: accessToken, user, userRole: primaryRole, userRoles }));
  }
  window.dispatchEvent(new Event("storage"));

  const dashboardPath = ROLE_PATHS[primaryRole] || ROLE_PATHS.ROLE_ADMIN;
  const expectedDashboardType = dashboardPath.split("/")[3];
  if (
    returnToPage &&
    returnToPage.toLowerCase().includes("/schoolchat/principal") &&
    returnToPage.includes(expectedDashboardType)
  ) {
    return returnToPage;
  }
  return dashboardPath;
};

/* ---------- First login: forced password change ----------
 * The temporary password typed on the login form is kept in memory only (module variable,
 * never persisted) so the "Nouveau mot de passe" page can send it as currentPassword. */
let pendingPasswordChange = null;

export const setPendingPasswordChange = (value) => {
  pendingPasswordChange = value;
};
export const getPendingPasswordChange = () => pendingPasswordChange;
export const clearPendingPasswordChange = () => {
  pendingPasswordChange = null;
};

export const MUST_CHANGE_PASSWORD_CODE = "MOT_DE_PASSE_A_CHANGER";

export const isMustChangePasswordPayload = (data) =>
  !!data && typeof data === "object" && data.code === MUST_CHANGE_PASSWORD_CODE;

/** Sends the user to the forced password page (no-op if already there). */
export const redirectToForcedPasswordChange = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith(FORCED_PASSWORD_PATH)) return;
  window.location.assign(FORCED_PASSWORD_PATH);
};

let guardInstalled = false;

/**
 * Global guard: any API answer "403 {code: MOT_DE_PASSE_A_CHANGER}" (axios default instance,
 * instances using applyAuthInterceptors, or window.fetch) routes to the forced password page.
 */
export const installMustChangePasswordGuard = (axiosInstance) => {
  if (guardInstalled || typeof window === "undefined") return;
  guardInstalled = true;

  if (axiosInstance?.interceptors) {
    axiosInstance.interceptors.response.use(
      (r) => r,
      (error) => {
        if (error?.response?.status === 403 && isMustChangePasswordPayload(error.response.data)) {
          redirectToForcedPasswordChange();
        }
        return Promise.reject(error);
      },
    );
  }

  const originalFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!originalFetch) return;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (response && response.status === 403) {
      try {
        response
          .clone()
          .json()
          .then((data) => {
            if (isMustChangePasswordPayload(data)) redirectToForcedPasswordChange();
          })
          .catch(() => {});
      } catch {
        // body not readable: ignore
      }
    }
    return response;
  };
};
