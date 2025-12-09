import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const coursProgrammerApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

coursProgrammerApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("authToken") ||
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

coursProgrammerApi.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

class CoursProgrammerService {
  async programmerCours(coursProgrammerData) {
    try {
      console.log(
        "Démarrage de programmerCours avec les données brutes:",
        coursProgrammerData
      );

      // Validation des champs obligatoires
      if (!coursProgrammerData.coursId) {
        throw new Error("L'ID du cours est requis");
      }
      if (!coursProgrammerData.professeurId) {
        throw new Error("L'ID du professeur est requis");
      }
      if (!coursProgrammerData.dateCoursPrevue) {
        throw new Error("La date prévue du cours est requise");
      }
      if (!coursProgrammerData.lieu) {
        throw new Error("Le lieu est requis");
      }

      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("cmr.notep.business.business.token");
      if (!token) {
        throw new Error("Token d'authentification non trouvé");
      }

      // Format data exactly as expected by the API
      const cleanedData = {
        coursId: coursProgrammerData.coursId.trim(),
        professeurId: coursProgrammerData.professeurId.trim(),
        dateCoursPrevue: this.formatDateToBackend(
          coursProgrammerData.dateCoursPrevue
        ),
        dateDebutEffectif: coursProgrammerData.dateDebutEffectif
          ? this.formatDateToBackend(coursProgrammerData.dateDebutEffectif)
          : null,
        dateFinEffectif: coursProgrammerData.dateFinEffectif
          ? this.formatDateToBackend(coursProgrammerData.dateFinEffectif)
          : null,
        lieu: coursProgrammerData.lieu.trim(),
        description: coursProgrammerData.description?.trim() || null,
        etatCoursProgramme:
          coursProgrammerData.etatCoursProgramme || "PLANIFIE",
        classesIds: Array.isArray(coursProgrammerData.classesIds)
          ? coursProgrammerData.classesIds.filter((id) => id && id.trim())
          : [],
        participantsIds: Array.isArray(coursProgrammerData.participantsIds)
          ? coursProgrammerData.participantsIds.filter((id) => id && id.trim())
          : [],
      };

      // Add capaciteMax only if provided
      if (
        coursProgrammerData.capaciteMax &&
        !isNaN(parseInt(coursProgrammerData.capaciteMax))
      ) {
        cleanedData.capaciteMax = parseInt(coursProgrammerData.capaciteMax);
      }

      console.log(
        "Données nettoyées avant envoi:",
        JSON.stringify(cleanedData, null, 2)
      );

      // Validation des formats UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(cleanedData.coursId)) {
        throw new Error(
          `Format d'ID de cours invalide: ${cleanedData.coursId}`
        );
      }

      if (!uuidRegex.test(cleanedData.professeurId)) {
        throw new Error(
          `Format d'ID de professeur invalide: ${cleanedData.professeurId}`
        );
      }

      for (const classeId of cleanedData.classesIds) {
        if (!uuidRegex.test(classeId)) {
          throw new Error(`Format d'ID de classe invalide: ${classeId}`);
        }
      }

      for (const participantId of cleanedData.participantsIds) {
        if (!uuidRegex.test(participantId)) {
          throw new Error(
            `Format d'ID de participant invalide: ${participantId}`
          );
        }
      }

      console.log("Envoi de la requête vers:", `/cours-programmes`);
      console.log(
        "Payload de la requête:",
        JSON.stringify(cleanedData, null, 2)
      );

      const response = await coursProgrammerApi.post(
        "/cours-programmes",
        cleanedData
      );

      console.log("Cours programmé avec succès:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur dans programmerCours:", error);
      this.handleError(error);
    }
  }

  async mettreAJourCoursProgramme(id, updates) {
    try {
      if (!id) {
        throw new Error("L'ID du cours programmé est requis");
      }

      // Format data exactly as expected by the API for updates
      const formattedUpdates = {
        coursId: updates.coursId?.trim(),
        professeurId: updates.professeurId?.trim(),
        lieu: updates.lieu?.trim(),
        description: updates.description?.trim() || null,
        etatCoursProgramme: updates.etatCoursProgramme || "PLANIFIE",
        classesIds: Array.isArray(updates.classesIds)
          ? updates.classesIds.filter((id) => id && id.trim())
          : [],
        participantsIds: Array.isArray(updates.participantsIds)
          ? updates.participantsIds.filter((id) => id && id.trim())
          : [],
      };

      // Format dates
      if (updates.dateCoursPrevue) {
        formattedUpdates.dateCoursPrevue = this.formatDateToBackend(
          updates.dateCoursPrevue
        );
      }

      // Only include effective dates if they are provided
      if (updates.dateDebutEffectif) {
        formattedUpdates.dateDebutEffectif = this.formatDateToBackend(
          updates.dateDebutEffectif
        );
      } else {
        formattedUpdates.dateDebutEffectif = null;
      }

      if (updates.dateFinEffectif) {
        formattedUpdates.dateFinEffectif = this.formatDateToBackend(
          updates.dateFinEffectif
        );
      } else {
        formattedUpdates.dateFinEffectif = null;
      }

      // Add capaciteMax only if provided
      if (updates.capaciteMax && !isNaN(parseInt(updates.capaciteMax))) {
        formattedUpdates.capaciteMax = parseInt(updates.capaciteMax);
      }

      console.log(
        "Mise à jour du cours programmé:",
        id,
        "avec:",
        formattedUpdates
      );

      const response = await coursProgrammerApi.put(
        `/cours-programmes/${id}`,
        formattedUpdates
      );

      console.log("Cours programmé mis à jour:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du cours programmé:", error);
      this.handleError(error);
    }
  }

  async supprimerCoursProgramme(id) {
    try {
      if (!id) {
        throw new Error("L'ID du cours programmé est requis");
      }

      console.log("Suppression du cours programmé:", id);

      await coursProgrammerApi.delete(`/cours-programmes/${id}`);

      console.log("Cours programmé supprimé avec succès:", id);
    } catch (error) {
      console.error("Erreur lors de la suppression du cours programmé:", error);
      this.handleError(error);
    }
  }

  async obtenirCoursProgrammeParId(id) {
    try {
      if (!id) {
        throw new Error("L'ID du cours programmé est requis");
      }

      console.log("Récupération du cours programmé:", id);

      const response = await coursProgrammerApi.get(`/cours-programmes/${id}`);

      console.log("Cours programmé récupéré:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du cours programmé:",
        error
      );
      this.handleError(error);
    }
  }

  async obtenirTousLesCoursProgrammes() {
    try {
      console.log("Récupération de tous les cours programmés");

      const response = await coursProgrammerApi.get("/cours-programmes");

      console.log("Tous les cours programmés récupérés:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de tous les cours programmés:",
        error
      );
      this.handleError(error);
    }
  }

  async obtenirProgrammationParCours(coursId) {
    try {
      if (!coursId) {
        throw new Error("L'ID du cours est requis");
      }

      console.log("Récupération de la programmation pour le cours:", coursId);

      const response = await coursProgrammerApi.get(
        `/cours-programmes/by-cours/${coursId}`
      );

      console.log("Données de programmation récupérées:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la programmation:",
        error
      );
      this.handleError(error);
    }
  }

  async obtenirProgrammationParClasse(classeId) {
    try {
      if (!classeId) {
        throw new Error("L'ID de la classe est requis");
      }

      console.log("Récupération de la programmation pour la classe:", classeId);

      const response = await coursProgrammerApi.get(
        `/cours-programmes/by-classe/${classeId}`
      );

      console.log(
        "Données de programmation récupérées pour la classe:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la programmation pour la classe:",
        error
      );
      this.handleError(error);
    }
  }

  async obtenirProgrammationParProfesseur(professeurId) {
    try {
      if (!professeurId) {
        throw new Error("L'ID du professeur est requis");
      }

      console.log(
        "Récupération de la programmation pour le professeur:",
        professeurId
      );

      const response = await coursProgrammerApi.get(
        `/cours-programmes/by-professeur/${professeurId}`
      );

      console.log(
        "Données de programmation récupérées pour le professeur:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la programmation pour le professeur:",
        error
      );
      this.handleError(error);
    }
  }

  async obtenirProgrammationParParticipant(participantId) {
    try {
      if (!participantId) {
        throw new Error("L'ID du participant est requis");
      }

      console.log(
        "Récupération de la programmation pour le participant:",
        participantId
      );

      const response = await coursProgrammerApi.get(
        `/cours-programmes/by-participant/${participantId}`
      );

      console.log(
        "Données de programmation récupérées pour le participant:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la programmation pour le participant:",
        error
      );
      this.handleError(error);
    }
  }

  async obtenirProgrammationAccessible(userId) {
    try {
      if (!userId) {
        throw new Error("L'ID de l'utilisateur est requis");
      }

      console.log(
        "Récupération de la programmation accessible pour l'utilisateur:",
        userId
      );

      const response = await coursProgrammerApi.get(
        `/cours-programmes/accessible/${userId}`
      );

      console.log(
        "Données de programmation accessible récupérées:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la programmation accessible:",
        error
      );
      this.handleError(error);
    }
  }

  async demarrerCours(scheduledId) {
    try {
      if (!scheduledId) {
        throw new Error("L'ID du cours programmé est requis");
      }

      const updates = {
        etatCoursProgramme: "EN_COURS",
        dateDebutEffectif: this.formatDateToBackend(new Date().toISOString()),
        dateFinEffectif: null, // Ensure end date is null when starting
      };

      console.log(
        "Démarrage du cours:",
        scheduledId,
        "avec les mises à jour:",
        updates
      );

      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );

      console.log("Cours démarré:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors du démarrage du cours:", error);
      this.handleError(error);
    }
  }

  async terminerCours(scheduledId) {
    try {
      if (!scheduledId) {
        throw new Error("L'ID du cours programmé est requis");
      }

      const updates = {
        etatCoursProgramme: "TERMINE",
        dateFinEffectif: this.formatDateToBackend(new Date().toISOString()),
      };

      console.log(
        "Fin du cours:",
        scheduledId,
        "avec les mises à jour:",
        updates
      );

      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );

      console.log("Cours terminé:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la fin du cours:", error);
      this.handleError(error);
    }
  }

  async annulerCours(scheduledId, reason) {
    try {
      if (!scheduledId) {
        throw new Error("L'ID du cours programmé est requis");
      }

      const updates = {
        etatCoursProgramme: "ANNULE",
        description: reason ? `Annulé: ${reason}` : "Cours annulé",
        dateDebutEffectif: null, // Clear effective dates when cancelling
        dateFinEffectif: null,
      };

      console.log(
        "Annulation du cours:",
        scheduledId,
        "avec la raison:",
        reason
      );

      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );

      console.log("Cours annulé:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'annulation du cours:", error);
      this.handleError(error);
    }
  }

  // Utility method to format dates exactly as expected by backend
  formatDateToBackend(dateValue) {
    if (!dateValue) return null;

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        throw new Error("Date invalide");
      }

      // Format as: YYYY-MM-DDTHH:mm:ss (matching Postman examples)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return null;
    }
  }

  // Legacy method for backward compatibility
  formatDateToISO(dateValue) {
    return this.formatDateToBackend(dateValue);
  }

  handleError(error) {
    console.error("Gestion de l'erreur:", error);

    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.data?.details ||
        `Erreur serveur (${error.response.status})`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error("Erreur réseau. Veuillez vérifier votre connexion.");
    } else {
      throw new Error(
        "Erreur de configuration de la requête: " + error.message
      );
    }
  }
}

export const coursProgrammerService = new CoursProgrammerService();
