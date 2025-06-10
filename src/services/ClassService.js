import axios from "axios";

export const EtatClasse = {
  EN_ATTENTE_APPROBATION: "EN_ATTENTE_APPROBATION",
  ACTIF: "ACTIF",
  INACTIF: "INACTIF",
};

export const DroitPublication = {
  TOUS: "TOUS",
  MODERATEUR_SEULEMENT: "MODERATEUR_SEULEMENT",
  PARENTS_ET_MODERATEUR: "PARENTS_ET_MODERATEUR",
};

/**
 * Service for managing Classes CRUD operations
 */
class ClassService {
  constructor(baseUrl = null) {
    // Default to your backend URL, but allow override
    this.baseUrl =
      baseUrl ||
      process.env.REACT_APP_API_BASE_URL ||
      "http://localhost:8486/scholchat";
    this.apiUrl = `${this.baseUrl}/classes`;

    // Configure axios defaults
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000, // 30 second timeout for slower connections
    });

    // Add response interceptor for better error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error);
        if (error.response) {
          // Server responded with error status
          const message =
            error.response.data?.message ||
            error.response.statusText ||
            `HTTP Error: ${error.response.status}`;
          throw new Error(message);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error("Network error: No response from server");
        } else {
          // Something else happened
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  /**
   * Generic fetch wrapper with improved error handling
   * @param {string} url - The URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} - The response data
   */
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
        ...options,
      });

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;

        // Try to get error details from response
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            // If not JSON, get text content for debugging
            const textResponse = await response.text();
            console.error("Non-JSON response:", textResponse.substring(0, 200));
            errorMessage = `Server returned non-JSON response. Status: ${response.status}`;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        throw new Error(errorMessage);
      }

      // Handle empty responses (like DELETE operations)
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        return null;
      }

      // Check content type before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(
          "Expected JSON but got:",
          contentType,
          textResponse.substring(0, 200)
        );
        throw new Error("Server returned non-JSON response");
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  /**
   * Alternative method using axios for better error handling
   */
  async axiosRequest(endpoint, options = {}) {
    try {
      const response = await this.axiosInstance({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw error; // Error is already handled by interceptor
    }
  }

  /**
   * Creates a new class
   * @param {Object} classe - The class data to create
   * @returns {Promise<Object>} The created class
   */
  async creerClasse(classe) {
    try {
      return await this.axiosRequest("/classes", {
        method: "POST",
        data: classe,
      });
    } catch (error) {
      console.error("Error creating class:", error);
      throw error;
    }
  }

  /**
   * Updates an existing class
   * @param {string} idClasse - The class ID to update
   * @param {Object} classeModifiee - The updated class data
   * @returns {Promise<Object>} The updated class
   */
  async modifierClasse(idClasse, classeModifiee) {
    try {
      // Prepare the data to send to the backend
      const dataToSend = {
        ...classeModifiee,
        // Send only the ID for relationships
        etablissement: classeModifiee.etablissement
          ? { id: classeModifiee.etablissement.id }
          : null,
        // Send moderator as just the ID string (not an object)
        moderator: classeModifiee.moderator,
        parents: classeModifiee.parents.map((p) => ({ id: p.id })),
        eleves: classeModifiee.eleves.map((e) => ({ id: e.id })),
      };

      return await this.axiosRequest(`/classes/${idClasse}`, {
        method: "PUT",
        data: dataToSend,
      });
    } catch (error) {
      console.error("Error updating class:", error);
      throw error;
    }
  }

  /**
   * Approves a pending class (changes status to ACTIF)
   * @param {string} idClasse - The class ID to approve
   * @returns {Promise<Object>} The approved class
   */
  async approuverClasse(idClasse) {
    try {
      return await this.axiosRequest(`/classes/${idClasse}/approve`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Error approving class:", error);
      throw error;
    }
  }

  /**
   * Rejects a pending class (changes status to INACTIF)
   * @param {string} idClasse - The class ID to reject
   * @param {string} motif - The reason for rejection
   * @returns {Promise<Object>} The rejected class
   */
  async rejeterClasse(idClasse, motif) {
    try {
      return await this.axiosRequest(`/classes/${idClasse}/reject`, {
        method: "PATCH",
        params: { motif },
      });
    } catch (error) {
      console.error("Error rejecting class:", error);
      throw error;
    }
  }

  /**
   * Gets all classes with a specific status
   * @param {string} etat - The status to filter by
   * @returns {Promise<Array>} List of classes with the specified status
   */
  async obtenirClassesParEtat(etat) {
    try {
      return await this.axiosRequest("/classes/by-status", {
        method: "GET",
        params: { etat },
      });
    } catch (error) {
      console.error("Error getting classes by status:", error);
      throw error;
    }
  }

  /**
   * Deletes a class by ID
   * @param {string} idClasse - The class ID to delete
   * @returns {Promise<void>}
   */
  async supprimerClasse(idClasse) {
    try {
      return await this.axiosRequest(`/classes/${idClasse}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting class:", error);
      throw error;
    }
  }

  /**
   * Gets a single class by ID
   * @param {string} idClasse - The class ID to retrieve
   * @returns {Promise<Object>} The class data
   */
  async obtenirClasseParId(idClasse) {
    try {
      return await this.axiosRequest(`/classes/${idClasse}`, {
        method: "GET",
      });
    } catch (error) {
      console.error("Error getting class by ID:", error);
      throw error;
    }
  }

  /**
   * Gets all classes
   * @returns {Promise<Array>} List of all classes
   */
  async obtenirToutesLesClasses() {
    try {
      return await this.axiosRequest("/classes", {
        method: "GET",
      });
    } catch (error) {
      console.error("Error getting all classes:", error);
      throw error;
    }
  }

  /**
   * Updates publication rights for a class
   * @param {string} idClasse - The class ID
   * @param {string} droitPublication - The new publication rights
   * @returns {Promise<Object>} The updated class
   */
  async modifierDroitPublication(idClasse, droitPublication) {
    try {
      return await this.axiosRequest(
        `/classes/${idClasse}/publication-rights`,
        {
          method: "PATCH",
          params: { droitPublication },
        }
      );
    } catch (error) {
      console.error("Error updating publication rights:", error);
      throw error;
    }
  }

  /**
   * Gets activation history for a class
   * @param {string} idClasse - The class ID
   * @returns {Promise<Array>} List of activation history records
   */
  async obtenirHistoriqueActivation(idClasse) {
    try {
      return await this.axiosRequest(
        `/classes/${idClasse}/activation-history`,
        {
          method: "GET",
        }
      );
    } catch (error) {
      console.error("Error getting activation history:", error);
      throw error;
    }
  }

  // Additional utility methods

  /**
   * Gets classes pending approval
   * @returns {Promise<Array>} List of classes waiting for approval
   */
  async obtenirClassesEnAttente() {
    return await this.obtenirClassesParEtat(EtatClasse.EN_ATTENTE_APPROBATION);
  }

  /**
   * Gets active classes
   * @returns {Promise<Array>} List of active classes
   */
  async obtenirClassesActives() {
    return await this.obtenirClassesParEtat(EtatClasse.ACTIF);
  }

  /**
   * Gets inactive classes
   * @returns {Promise<Array>} List of inactive classes
   */
  async obtenirClassesInactives() {
    return await this.obtenirClassesParEtat(EtatClasse.INACTIF);
  }

  /**
   * Checks if a class is pending approval
   * @param {Object} classe - The class to check
   * @returns {boolean} True if class is pending approval
   */
  estEnAttenteApprobation(classe) {
    return classe.etat === EtatClasse.EN_ATTENTE_APPROBATION;
  }

  /**
   * Checks if a class is active
   * @param {Object} classe - The class to check
   * @returns {boolean} True if class is active
   */
  estActif(classe) {
    return classe.etat === EtatClasse.ACTIF;
  }

  /**
   * Checks if a class is inactive
   * @param {Object} classe - The class to check
   * @returns {boolean} True if class is inactive
   */
  estInactif(classe) {
    return classe.etat === EtatClasse.INACTIF;
  }

  /**
   * Gets the display name for a class status
   * @param {string} etat - The class status
   * @returns {string} The display name
   */
  getEtatDisplayName(etat) {
    switch (etat) {
      case EtatClasse.EN_ATTENTE_APPROBATION:
        return "En attente d'approbation";
      case EtatClasse.ACTIF:
        return "Actif";
      case EtatClasse.INACTIF:
        return "Inactif";
      default:
        return "Inconnu";
    }
  }

  /**
   * Gets the display name for publication rights
   * @param {string} droit - The publication rights
   * @returns {string} The display name
   */
  getDroitPublicationDisplayName(droit) {
    switch (droit) {
      case DroitPublication.TOUS:
        return "Tous";
      case DroitPublication.MODERATEUR_SEULEMENT:
        return "Modérateur seulement";
      case DroitPublication.PARENTS_ET_MODERATEUR:
        return "Parents et modérateur";
      default:
        return "Non défini";
    }
  }

  /**
   * Creates a new class with default values
   * @param {string} nom - Class name
   * @param {string} niveau - Class level
   * @param {string} etablissementId - School ID (optional)
   * @returns {Object} A new class object with defaults
   */
  creerNouvelleClasse(nom, niveau, etablissementId = null) {
    return {
      nom,
      niveau,
      dateCreation: new Date().toISOString(),
      etat: EtatClasse.EN_ATTENTE_APPROBATION,
      etablissement: etablissementId ? { id: etablissementId } : null,
      parents: [],
      eleves: [],
    };
  }

  /**
   * Bulk operations for multiple classes
   */

  /**
   * Creates multiple classes
   * @param {Array} classes - Array of class objects
   * @returns {Promise<Array>} Array of created classes
   */
  async creerPlusieursClasses(classes) {
    const promises = classes.map((classe) => this.creerClasse(classe));
    return await Promise.allSettled(promises);
  }

  /**
   * Approves multiple classes
   * @param {Array} idClasses - Array of class IDs
   * @returns {Promise<Array>} Array of approved classes
   */
  async approuverPlusieursClasses(idClasses) {
    const promises = idClasses.map((id) => this.approuverClasse(id));
    return await Promise.allSettled(promises);
  }

  /**
   * Deletes multiple classes
   * @param {Array} idClasses - Array of class IDs
   * @returns {Promise<void>}
   */
  async supprimerPlusieursClasses(idClasses) {
    const promises = idClasses.map((id) => this.supprimerClasse(id));
    await Promise.allSettled(promises);
  }

  /**
   * Gets classes statistics
   * @returns {Promise<Object>} Statistics about classes
   */
  async obtenirStatistiquesClasses() {
    try {
      const toutesLesClasses = await this.obtenirToutesLesClasses();

      const stats = {
        total: toutesLesClasses.length,
        enAttente: toutesLesClasses.filter(
          (c) => c.etat === EtatClasse.EN_ATTENTE_APPROBATION
        ).length,
        actives: toutesLesClasses.filter((c) => c.etat === EtatClasse.ACTIF)
          .length,
        inactives: toutesLesClasses.filter((c) => c.etat === EtatClasse.INACTIF)
          .length,
      };

      return stats;
    } catch (error) {
      console.error("Error calculating statistics:", error);
      throw error;
    }
  }

  /**
   * Searches classes by name or level
   * @param {string} searchTerm - The search term
   * @returns {Promise<Array>} Filtered classes
   */
  async rechercherClasses(searchTerm) {
    try {
      const toutesLesClasses = await this.obtenirToutesLesClasses();
      const terme = searchTerm.toLowerCase();

      return toutesLesClasses.filter(
        (classe) =>
          classe.nom.toLowerCase().includes(terme) ||
          classe.niveau.toLowerCase().includes(terme)
      );
    } catch (error) {
      console.error("Error searching classes:", error);
      throw error;
    }
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if API is accessible
   */
  async testConnection() {
    try {
      await this.axiosRequest("/classes", { method: "GET" });
      return true;
    } catch (error) {
      console.error("API connection test failed:", error);
      return false;
    }
  }
}

export default ClassService;

export const classService = new ClassService();
