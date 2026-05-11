import axios from "axios";

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

  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("cmr.notep.business.business.token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle authentication errors
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleAuthenticationError();
      }
      return Promise.reject(error);
    }
  );

  return api;
};

// Centralized authentication error handling
export const handleAuthenticationError = () => {
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
  
  // Set session expired flag
  localStorage.setItem("sessionExpired", "true");
  
  // Dispatch storage event to trigger auth context update
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'isAuthenticated',
    newValue: null
  }));
  
  // Redirect to login page
  window.location.href = '/schoolchat/login';
};

// Enhanced error handler for services
export const handleServiceError = (error, serviceName = "Service") => {
  console.error(`${serviceName} - handleError called with:`, error);
  
  if (error.response) {
    // Handle authentication errors specifically
    if (error.response.status === 401 || error.response.status === 403) {
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