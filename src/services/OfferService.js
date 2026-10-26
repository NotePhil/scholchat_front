import axios from "axios";
import { applyAuthInterceptors } from "../utils/axiosConfig";

export const TypeCibleOffre = {
  CLASSE: "CLASSE",
  ETABLISSEMENT: "ETABLISSEMENT",
};

export const PeriodiciteContrat = {
  MENSUEL: "MENSUEL",
  ANNUEL: "ANNUEL",
};

/**
 * Service for managing Offres (subscription plans) - catalogue CRUD (admin) + read for pickers
 */
class OfferService {
  constructor(baseUrl = null) {
    this.baseUrl = baseUrl || process.env.REACT_APP_API_BASE_URL;
    this.apiUrl = `${this.baseUrl}/offres`;

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

  /**
   * Liste les offres.
   * @param {string|null} cible CLASSE | ETABLISSEMENT | null (toutes cibles)
   * @param {boolean} toutes true pour inclure aussi les offres desactivees (admin)
   */
  async listerOffres(cible = null, toutes = false) {
    return this.axiosRequest("/offres", {
      method: "get",
      params: { cible: cible || undefined, toutes },
    });
  }

  async obtenirOffresActives(cible) {
    return this.listerOffres(cible, false);
  }

  async obtenirOffreParId(id) {
    return this.axiosRequest(`/offres/${id}`, { method: "get" });
  }

  async creerOffre(offre) {
    return this.axiosRequest("/offres", { method: "post", data: offre });
  }

  async modifierOffre(id, offre) {
    return this.axiosRequest(`/offres/${id}`, { method: "put", data: offre });
  }

  async desactiverOffre(id) {
    return this.axiosRequest(`/offres/${id}`, { method: "delete" });
  }

  /**
   * Calcule le pourcentage de reduction annuel affichable si le backend ne l'a pas deja fourni.
   */
  calculerReduction(offre) {
    if (offre.reductionAnnuellePourcentage != null) return offre.reductionAnnuellePourcentage;
    if (!offre.prixMensuel || !offre.prixAnnuel || !offre.dureeMensuelleMinutes || !offre.dureeAnnuelleMinutes) {
      return null;
    }
    const moisEquivalents = offre.dureeAnnuelleMinutes / offre.dureeMensuelleMinutes;
    const prixMensualiseSurAnnee = offre.prixMensuel * moisEquivalents;
    if (prixMensualiseSurAnnee <= 0) return null;
    return 1 - offre.prixAnnuel / prixMensualiseSurAnnee;
  }
}

export default OfferService;
export const offerService = new OfferService();
