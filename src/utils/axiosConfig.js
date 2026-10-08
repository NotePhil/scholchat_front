import axios from "axios";
import {
  isProfessorNotValidatedPayload,
  notifyProfessorNotValidated,
} from "./professorVerification";
import { isMustChangePasswordPayload, redirectToForcedPasswordChange } from "./loginSession";

// Codes d'erreur signifiant réellement une session invalide.
const SESSION_ERROR_CODES = ["TOKEN_EXPIRED", "INVALID_TOKEN", "UNAUTHORIZED"];

/**
 * Une réponse 401/403 ne vaut "session expirée" que pour 401, ou pour un 403
 * sans code métier (ou avec un code de session). Un 403 portant un code métier
 * (PROFIL_PROFESSEUR_NON_VALIDE, INVALID_STATE, OPERATION_INTERDITE…) est une
 * règle de gestion refusée : l'utilisateur ne doit pas être déconnecté.
 */
export const isSessionError = (response) => {
  if (!response) return false;
  if (response.status === 401) return true;
  if (response.status !== 403) return false;
  const code = response.data && typeof response.data === "object" ? response.data.code : null;
  return !code || SESSION_ERROR_CODES.includes(code);
};

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create a shared axios instance with authentication handling
export const createAuthenticatedAxios = () => {
  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  applyAuthInterceptors(api);
  return api;
};

/**
 * Apply standard auth request + response interceptors to any existing axios instance.
 * Call this right after creating any axios.create() instance so that 401/403 always
 * triggers the "Session expirée" modal via handleAuthenticationError().
 */
export const applyAuthInterceptors = (instance) => {
  // Request: attach token
  instance.interceptors.request.use(
    (config) => {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("cmr.notep.business.business.token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response: surface auth errors globally
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403 && isMustChangePasswordPayload(error.response.data)) {
        // Mot de passe temporaire pas encore changé : page "Nouveau mot de passe", pas de déconnexion
        redirectToForcedPasswordChange();
      } else if (isProfessorNotValidatedPayload(error.response?.data)) {
        // Profil professeur non validé : écran de statut, pas de déconnexion
        notifyProfessorNotValidated(error.response.data.message);
      } else if (isSessionError(error.response)) {
        handleAuthenticationError();
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Centralized authentication error handling
export const handleAuthenticationError = () => {
  // Save current location before clearing so we can show the expired message
  const currentPath = window.location.pathname;
  const isOnDashboard = currentPath.includes('/schoolchat/Principal');

  // Clear all auth data
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authToken");
  localStorage.removeItem("cmr.notep.business.business.token");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("username");
  localStorage.removeItem("userRoles");
  localStorage.removeItem("decodedToken");
  localStorage.removeItem("authResponse");
  localStorage.removeItem("loginTime");

  // Use sessionStorage so the Login page cleanup (which only touches localStorage) won't erase it
  sessionStorage.setItem("sessionExpired", "true");

  // Dispatch a custom event — Principal.jsx listens for this and shows the
  // "Session expirée" modal before navigating, avoiding a hard reload blank screen
  window.dispatchEvent(new CustomEvent('auth:sessionExpired'));

  // Also dispatch storage event to trigger auth context update
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'isAuthenticated',
    newValue: null
  }));

  // Only redirect if we're actually on a protected page and no modal handler caught it
  // Use a short delay so the modal can show first if Principal is mounted
  if (isOnDashboard) {
    setTimeout(() => {
      // If still on the dashboard (modal didn't navigate away), do a hard redirect
      if (window.location.pathname.includes('/schoolchat/Principal')) {
        window.location.replace('/schoolchat/login');
      }
    }, 3000);
  }
};

// Enhanced error handler for services
export const handleServiceError = (error, serviceName = "Service") => {
  console.error(`${serviceName} - handleError called with:`, error);
  
  if (error.response) {
    // Handle authentication errors specifically
    if (isSessionError(error.response)) {
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }
    
    const errorMessage =
      error.response.data?.message ||
      error.response.data?.error ||
      error.response.data?.details ||
      `Erreur serveur (${error.response.status})`;
    
    console.error(`${serviceName} - API Error Response:`, {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers,
      url: error.config?.url,
      method: error.config?.method
    });
    
    throw new Error(errorMessage);
  } else if (error.request) {
    console.error(`${serviceName} - Network Error:`, error.request);
    throw new Error("Erreur réseau. Veuillez vérifier votre connexion.");
  } else {
    console.error(`${serviceName} - Request Setup Error:`, error.message);
    throw new Error("Erreur de configuration de la requête: " + error.message);
  }
};