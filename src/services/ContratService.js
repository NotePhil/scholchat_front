import axios from "axios";
import { applyAuthInterceptors } from "../utils/axiosConfig";

export const StatutContrat = {
  EN_ATTENTE_PAIEMENT: "EN_ATTENTE_PAIEMENT",
  ACTIF: "ACTIF",
  EXPIRE: "EXPIRE",
  RESILIE: "RESILIE",
};

/**
 * Service for managing Contrats (subscriptions linking an Offre to a Classe or an Etablissement)
 */
class ContratService {
  constructor(baseUrl = null) {
    this.baseUrl = baseUrl || process.env.REACT_APP_API_BASE_URL;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });

    applyAuthInterceptors(this.axiosInstance);
  }

  async axiosRequest(endpoint, options = {}) {
    const response = await this.axiosInstance({ url: endpoint, ...options });
    return response.data;
  }

  async obtenirContratClasse(classeId) {
    return this.axiosRequest(`/contrats/classe/${classeId}`, { method: "get" });
  }

  async obtenirContratEtablissement(etablissementId) {
    return this.axiosRequest(`/contrats/etablissement/${etablissementId}`, { method: "get" });
  }

  async prolongerContratClasse(classeId, action) {
    return this.axiosRequest(`/contrats/classe/${classeId}/prolonger`, { method: "post", data: action });
  }

  async changerOffreClasse(classeId, action) {
    return this.axiosRequest(`/contrats/classe/${classeId}/changer-offre`, { method: "post", data: action });
  }

  async prolongerContratEtablissement(etablissementId, action) {
    return this.axiosRequest(`/contrats/etablissement/${etablissementId}/prolonger`, { method: "post", data: action });
  }

  async changerOffreEtablissement(etablissementId, action) {
    return this.axiosRequest(`/contrats/etablissement/${etablissementId}/changer-offre`, { method: "post", data: action });
  }

  // Renouvellement sans session (lien recu par email)
  async demanderLienRenouvellement({ email, classeId, etablissementId }) {
    return this.axiosRequest("/contrats/renouvellement-info", {
      method: "post",
      data: { email, classeId, etablissementId },
    });
  }

  async obtenirStatutRenouvellement(token) {
    return this.axiosRequest(`/contrats/renouvellement/${token}`, { method: "get" });
  }

  async prolongerParToken(token, action) {
    return this.axiosRequest(`/contrats/renouvellement/${token}/prolonger`, { method: "post", data: action });
  }

  async changerOffreParToken(token, action) {
    return this.axiosRequest(`/contrats/renouvellement/${token}/changer-offre`, { method: "post", data: action });
  }

  // Attribution directe par un admin (support), sans paiement — reservee ROLE_ADMIN cote backend
  async assignerOffreClasseParAdmin(classeId, action) {
    return this.axiosRequest(`/contrats/admin/classe/${classeId}/assigner`, { method: "post", data: action });
  }

  async assignerOffreEtablissementParAdmin(etablissementId, action) {
    return this.axiosRequest(`/contrats/admin/etablissement/${etablissementId}/assigner`, { method: "post", data: action });
  }

  estActif(contrat) {
    return contrat && contrat.statut === StatutContrat.ACTIF;
  }

  estExpire(contrat) {
    return contrat && contrat.statut === StatutContrat.EXPIRE;
  }
}

export default ContratService;
export const contratService = new ContratService();
