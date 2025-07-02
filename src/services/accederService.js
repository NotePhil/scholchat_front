import axios from "axios";

export const EtatDemandeAcces = {
  EN_ATTENTE: "EN_ATTENTE",
  APPROUVEE: "APPROUVEE",
  REJETEE: "REJETEE",
};

class AccederService {
  constructor(baseUrl = null) {
    // Default to your backend URL, but allow override
    this.baseUrl =
      baseUrl ||
      process.env.REACT_APP_API_BASE_URL ||
      "http://localhost:8486/scholchat";
    this.apiUrl = `${this.baseUrl}/acceder`;
  }

  /**
   * Get the actual userId from localStorage with multiple fallback strategies
   * @returns {string|null} - The user ID or null if not found
   */
  getUserId() {
    try {
      console.log("=== GETTING USER ID FROM LOCALSTORAGE ===");

      // Strategy 1: Get the userId directly stored from authData.userId
      const directUserId = localStorage.getItem("userId");
      console.log(
        "Strategy 1 - Direct userId from localStorage:",
        directUserId
      );

      // Validate that it's a UUID and not an email
      if (
        directUserId &&
        !directUserId.includes("@") &&
        this.isValidUUID(directUserId)
      ) {
        console.log("✅ Using valid UUID from direct storage:", directUserId);
        return directUserId;
      }

      // Strategy 2: Try to get from stored auth response
      const authResponseStr = localStorage.getItem("authResponse");
      if (authResponseStr) {
        try {
          const authResponse = JSON.parse(authResponseStr);
          console.log(
            "Strategy 2 - Auth response userId:",
            authResponse.userId
          );
          if (authResponse.userId && !authResponse.userId.includes("@")) {
            console.log(
              "✅ Using userId from stored auth response:",
              authResponse.userId
            );
            return authResponse.userId;
          }
        } catch (e) {
          console.log("Could not parse stored auth response");
        }
      }

      // Strategy 3: Last resort - check if we can extract from token (but this usually gives email)
      const decodedTokenStr = localStorage.getItem("decodedToken");
      if (decodedTokenStr) {
        try {
          const decodedToken = JSON.parse(decodedTokenStr);
          console.log("Strategy 3 - Token sub:", decodedToken.sub);
          console.log("Strategy 3 - Token userId:", decodedToken.userId);

          // Only use token data if it's not an email
          if (decodedToken.userId && !decodedToken.userId.includes("@")) {
            console.log("✅ Using userId from token:", decodedToken.userId);
            return decodedToken.userId;
          }
        } catch (e) {
          console.log("Could not parse stored decoded token");
        }
      }

      console.error("❌ No valid userId found in localStorage");
      console.log("Available localStorage keys:", Object.keys(localStorage));
      return null;
    } catch (error) {
      console.error("Error getting userId:", error);
      return null;
    }
  }

  /**
   * Check if a string is a valid UUID format
   * @param {string} str - String to validate
   * @returns {boolean} - True if valid UUID format
   */
  isValidUUID(str) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Decode JWT token
   * @param {string} token - JWT token to decode
   * @returns {Object|null} - Decoded token or null if error
   */
  decodeJWT(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const rawPayload = atob(base64);
      const jsonPayload = decodeURIComponent(
        rawPayload
          .split("")
          .map((c) => {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  /**
   * Request access to a class with an activation code
   * @param {string} utilisateurId - User ID requesting access (optional, will be auto-retrieved)
   * @param {string} classeId - Class ID to access
   * @param {string} codeActivation - Activation code for the class
   * @returns {Promise<Object>} - Response data
   */
  async demanderAcces({ utilisateurId, classeId, codeActivation }) {
    try {
      // Get the actual userId - use provided one or auto-retrieve
      const actualUserId = utilisateurId || this.getUserId();

      if (!actualUserId) {
        throw new Error("User ID not found. Please log in again.");
      }

      console.log("Using userId for access request:", actualUserId);

      const response = await axios.post(`${this.apiUrl}/demandes`, null, {
        params: {
          utilisateurId: actualUserId,
          classeId,
          codeActivation,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get access requests for a specific class
   * @param {string} classeId - Class ID
   * @returns {Promise<Array>} - List of access requests
   */
  async obtenirDemandesAccesPourClasse(classeId) {
    try {
      console.log("Fetching access requests for class:", classeId);
      const response = await axios.get(
        `${this.apiUrl}/classes/${classeId}/demandes`
      );
      console.log("Raw access requests response:", response.data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Approve an access request
   * @param {string} demandeId - Access request ID to approve
   * @returns {Promise<Object>} - Response data
   */
  async validerDemandeAcces(demandeId) {
    try {
      console.log("Approving access request:", demandeId);
      const response = await axios.post(
        `${this.apiUrl}/demandes/${demandeId}/approve`
      );
      console.log("Approval response:", response.data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Reject an access request
   * @param {string} demandeId - Access request ID to reject
   * @param {string} motifRejet - Reason for rejection
   * @returns {Promise<Object>} - Response data
   */
  async rejeterDemandeAcces(demandeId, motifRejet) {
    try {
      console.log(
        "Rejecting access request:",
        demandeId,
        "with reason:",
        motifRejet
      );
      const response = await axios.post(
        `${this.apiUrl}/demandes/${demandeId}/reject`,
        null,
        {
          params: { motifRejet },
        }
      );
      console.log("Rejection response:", response.data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Remove access from a user for a class
   * @param {string} utilisateurId - User ID to remove access from
   * @param {string} classeId - Class ID to remove access to
   * @returns {Promise<void>}
   */
  async retirerAcces(utilisateurId, classeId) {
    try {
      console.log(
        "Removing access for user:",
        utilisateurId,
        "from class:",
        classeId
      );
      await axios.delete(`${this.apiUrl}/${utilisateurId}/${classeId}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all users with access to a class
   * @param {string} classeId - Class ID
   * @returns {Promise<Array>} - List of users with access
   */
  async obtenirUtilisateursAvecAcces(classeId) {
    try {
      console.log("Fetching users with access for class:", classeId);
      const response = await axios.get(
        `${this.apiUrl}/classes/${classeId}/utilisateurs`
      );
      console.log("Users with access response:", response.data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all classes accessible by a user
   * @param {string} utilisateurId - User ID (optional, will be auto-retrieved)
   * @returns {Promise<Array>} - List of accessible classes
   */
  async obtenirClassesAccessibles(utilisateurId) {
    try {
      const actualUserId = utilisateurId || this.getUserId();

      if (!actualUserId) {
        throw new Error("User ID not found. Please log in again.");
      }

      const response = await axios.get(
        `${this.apiUrl}/utilisateurs/${actualUserId}/classes`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @throws {Error} - Throws an error with a user-friendly message
   */
  handleError(error) {
    let errorMessage = "Une erreur est survenue lors de la requête";

    if (error.response) {
      // The request was made and the server responded with a status code
      const { status, data } = error.response;

      console.error("API Error Response:", {
        status,
        data,
        headers: error.response.headers,
      });

      if (data && data.message) {
        errorMessage = data.message;
      } else {
        switch (status) {
          case 400:
            errorMessage = "Requête invalide";
            break;
          case 401:
            errorMessage = "Non autorisé";
            break;
          case 403:
            errorMessage = "Accès refusé";
            break;
          case 404:
            errorMessage = "Ressource non trouvée";
            break;
          case 409:
            errorMessage = "Conflit: La demande existe déjà";
            break;
          case 422:
            errorMessage = "Code d'activation invalide";
            break;
          case 500:
            errorMessage = "Erreur interne du serveur";
            break;
          default:
            errorMessage = `Erreur ${status}`;
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
      errorMessage = "Pas de réponse du serveur";
    } else {
      // Something happened in setting up the request
      console.error("Request setup error:", error.message);
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

// Export a singleton instance of the service
export default new AccederService();
