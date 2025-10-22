import axios from "axios";

export const EtatDemandeAcces = {
  EN_ATTENTE: "EN_ATTENTE",
  APPROUVEE: "APPROUVEE",
  REJETEE: "REJETEE",
};

class AccederService {
  constructor(baseUrl = null) {
    this.baseUrl =
      baseUrl ||
      process.env.REACT_APP_API_BASE_URL ||
      "http://localhost:8486/scholchat";
    this.apiUrl = `${this.baseUrl}/acceder`;
  }

  /**
   * Get the actual userId from localStorage
   */
  getUserId() {
    try {
      console.log("=== GETTING USER ID FROM LOCALSTORAGE ===");

      const directUserId = localStorage.getItem("userId");
      console.log("Direct userId from localStorage:", directUserId);

      if (
        directUserId &&
        !directUserId.includes("@") &&
        this.isValidUUID(directUserId)
      ) {
        console.log("✅ Using valid UUID from direct storage:", directUserId);
        return directUserId;
      }

      const authResponseStr = localStorage.getItem("authResponse");
      if (authResponseStr) {
        try {
          const authResponse = JSON.parse(authResponseStr);
          console.log("Auth response userId:", authResponse.userId);
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

      const decodedTokenStr = localStorage.getItem("decodedToken");
      if (decodedTokenStr) {
        try {
          const decodedToken = JSON.parse(decodedTokenStr);
          if (decodedToken.userId && !decodedToken.userId.includes("@")) {
            console.log("✅ Using userId from token:", decodedToken.userId);
            return decodedToken.userId;
          }
        } catch (e) {
          console.log("Could not parse stored decoded token");
        }
      }

      console.error("❌ No valid userId found in localStorage");
      return null;
    } catch (error) {
      console.error("Error getting userId:", error);
      return null;
    }
  }

  isValidUUID(str) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Request access to a class with an activation code
   */
  async demanderAcces({ utilisateurId, classeId, codeActivation }) {
    try {
      const actualUserId = utilisateurId || this.getUserId();
      if (!actualUserId) {
        throw new Error("User ID not found. Please log in again.");
      }

      console.log("Making POST request to:", `${this.apiUrl}/demandes`);
      console.log("With params:", { actualUserId, classeId, codeActivation });

      const response = await axios.post(`${this.apiUrl}/demandes`, null, {
        params: {
          utilisateurId: actualUserId,
          classeId,
          codeActivation,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error in demanderAcces:", error);
      this.handleError(error);
    }
  }

  /**
   * Get access requests for a specific class - FIXED METHOD
   */
  async obtenirDemandesAccesPourClasse(classeId) {
    try {
      console.log("Fetching access requests for class:", classeId);
      console.log(
        "Making GET request to:",
        `${this.apiUrl}/classes/${classeId}/demandes`
      );

      const response = await axios.get(
        `${this.apiUrl}/classes/${classeId}/demandes`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Access requests response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching access requests:", error);
      this.handleError(error);
    }
  }

  /**
   * Get pending access requests for a specific class
   */
  async obtenirDemandesAccesEnAttentePourClasse(classeId) {
    try {
      console.log("Fetching pending access requests for class:", classeId);

      const response = await axios.get(
        `${this.apiUrl}/classes/${classeId}/demandes/pending`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      this.handleError(error);
    }
  }

  /**
   * Get access requests for moderator - FIXED METHOD
   */
  async obtenirDemandesAccesPourModerateur(moderateurId) {
    try {
      const actualModeratorId = moderateurId || this.getUserId();
      if (!actualModeratorId) {
        throw new Error("Moderator ID not found. Please log in again.");
      }

      console.log("Fetching moderator requests for:", actualModeratorId);
      console.log(
        "Making GET request to:",
        `${this.apiUrl}/moderator/${actualModeratorId}/demandes`
      );

      const response = await axios.get(
        `${this.apiUrl}/moderator/${actualModeratorId}/demandes`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching moderator requests:", error);
      this.handleError(error);
    }
  }

  /**
   * Approve an access request
   */
  async validerDemandeAcces(demandeId) {
    try {
      console.log("Approving access request:", demandeId);
      console.log(
        "Making POST request to:",
        `${this.apiUrl}/demandes/${demandeId}/approve`
      );

      const response = await axios.post(
        `${this.apiUrl}/demandes/${demandeId}/approve`,
        null,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Approval response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error approving request:", error);
      this.handleError(error);
    }
  }

  /**
   * Reject an access request
   */
  async rejeterDemandeAcces(demandeId, motifRejet) {
    try {
      console.log(
        "Rejecting access request:",
        demandeId,
        "with reason:",
        motifRejet
      );
      console.log(
        "Making POST request to:",
        `${this.apiUrl}/demandes/${demandeId}/reject`
      );

      const response = await axios.post(
        `${this.apiUrl}/demandes/${demandeId}/reject`,
        null,
        {
          params: { motifRejet },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Rejection response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error rejecting request:", error);
      this.handleError(error);
    }
  }

  /**
   * Remove access from a user for a class
   */
  async retirerAcces(utilisateurId, classeId) {
    try {
      console.log(
        "Removing access for user:",
        utilisateurId,
        "from class:",
        classeId
      );
      console.log(
        "Making DELETE request to:",
        `${this.apiUrl}/${utilisateurId}/${classeId}`
      );

      const response = await axios.delete(
        `${this.apiUrl}/${utilisateurId}/${classeId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error removing access:", error);
      this.handleError(error);
    }
  }

  /**
   * Get all users with access to a class
   */
  async obtenirUtilisateursAvecAcces(classeId) {
    try {
      console.log("Fetching users with access for class:", classeId);
      console.log(
        "Making GET request to:",
        `${this.apiUrl}/classes/${classeId}/utilisateurs`
      );

      const response = await axios.get(
        `${this.apiUrl}/classes/${classeId}/utilisateurs`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Users with access response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching users with access:", error);
      this.handleError(error);
    }
  }

  /**
   * Get users with access to multiple classes
   */
  async obtenirUtilisateursAvecAccesMultiple(classeIds) {
    try {
      console.log("Fetching users with access for classes:", classeIds);

      const response = await axios.get(`${this.apiUrl}/classes/utilisateurs`, {
        params: { classeIds },
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        "Error fetching users with access for multiple classes:",
        error
      );
      this.handleError(error);
    }
  }

  /**
   * Get all classes accessible by a user
   */
  async obtenirClassesAccessibles(utilisateurId) {
    try {
      const actualUserId = utilisateurId || this.getUserId();
      if (!actualUserId) {
        throw new Error("User ID not found. Please log in again.");
      }

      console.log("Fetching accessible classes for user:", actualUserId);
      console.log(
        "Making GET request to:",
        `${this.apiUrl}/utilisateurs/${actualUserId}/classes`
      );

      const response = await axios.get(
        `${this.apiUrl}/utilisateurs/${actualUserId}/classes`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching accessible classes:", error);
      this.handleError(error);
    }
  }

  /**
   * Handle API errors consistently
   */
  handleError(error) {
    let errorMessage = "Une erreur est survenue lors de la requête";

    if (error.response) {
      const { status, data } = error.response;

      console.error("API Error Response:", {
        status,
        data,
        url: error.config?.url,
        method: error.config?.method,
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
          case 405:
            errorMessage = "Méthode HTTP non autorisée";
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
      console.error("No response received:", error.request);
      errorMessage = "Pas de réponse du serveur";
    } else {
      console.error("Request setup error:", error.message);
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

// Export a singleton instance
const accederService = new AccederService();
export default accederService;
