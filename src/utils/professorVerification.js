// Statut de vérification du profil professeur (pièces d'identité validées par
// l'administrateur), distinct de l'état du compte (etat). Tant qu'il n'est pas
// VALIDE, le backend refuse toute action professeur avec un 403
// { code: "PROFIL_PROFESSEUR_NON_VALIDE" } : le web affiche alors l'écran de
// statut (ProfessorVerificationStatus) au lieu du tableau de bord.

export const PROFESSOR_STATUS = {
  DOCUMENTS_MANQUANTS: "DOCUMENTS_MANQUANTS",
  EN_ATTENTE_VALIDATION: "EN_ATTENTE_VALIDATION",
  VALIDE: "VALIDE",
  REJETE: "REJETE",
};

export const PROFESSOR_NOT_VALIDATED_CODE = "PROFIL_PROFESSEUR_NON_VALIDE";

// Événement global émis quand une requête est refusée pour profil non validé.
export const PROFESSOR_NOT_VALIDATED_EVENT = "professor:notValidated";

// Notifications envoyées au professeur quand son statut change.
export const PROFESSOR_STATUS_NOTIFICATION_TYPES = [
  "PROFESSOR_VERIFICATION_VALIDATED",
  "PROFESSOR_VERIFICATION_REJECTED",
  "PROFESSOR_VERIFICATION_DOCUMENTS_REQUIRED",
  "ROLE_VALIDATED",
  "ROLE_REJECTED",
  // Professor profile requested from an existing (parent / student) account
  "PROFESSOR_ROLE_VALIDATED",
  "PROFESSOR_ROLE_REJECTED",
];

const STATUS_DISPLAY = {
  DOCUMENTS_MANQUANTS: {
    label: "Pièces manquantes",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  EN_ATTENTE_VALIDATION: {
    label: "En attente de validation",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  VALIDE: {
    label: "Validé",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  REJETE: {
    label: "Refusé",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export const getProfessorStatusDisplay = (status) =>
  STATUS_DISPLAY[status] || null;

const readAuthResponse = () => {
  try {
    return JSON.parse(localStorage.getItem("authResponse") || "{}") || {};
  } catch {
    return {};
  }
};

/**
 * Statut stocké à la connexion / au changement de profil (champ
 * professeurStatutVerification de la réponse d'authentification).
 * status vaut null quand il est inconnu (session antérieure au champ).
 */
export const getStoredProfessorStatus = () => {
  const auth = readAuthResponse();
  return {
    status: auth.professeurStatutVerification || null,
    motif: auth.professeurMotifRejet || null,
  };
};

export const storeProfessorStatus = (status, motif = null) => {
  try {
    const auth = readAuthResponse();
    auth.professeurStatutVerification = status || null;
    auth.professeurMotifRejet = status === PROFESSOR_STATUS.REJETE ? motif || null : null;
    localStorage.setItem("authResponse", JSON.stringify(auth));
  } catch {
    // stockage indisponible : le statut sera relu depuis le serveur
  }
};

export const isProfessorNotValidatedPayload = (data) =>
  !!data && typeof data === "object" && data.code === PROFESSOR_NOT_VALIDATED_CODE;

export const notifyProfessorNotValidated = (message) => {
  window.dispatchEvent(
    new CustomEvent(PROFESSOR_NOT_VALIDATED_EVENT, { detail: { message } }),
  );
};

const inspectForbiddenBody = (text) => {
  if (!text || text.indexOf(PROFESSOR_NOT_VALIDATED_CODE) < 0) return;
  try {
    const data = JSON.parse(text);
    if (isProfessorNotValidatedPayload(data)) notifyProfessorNotValidated(data.message);
  } catch {
    // corps non JSON : ignoré
  }
};

/** À appeler sur une Response fetch (le wrapper fetch de Principal le fait). */
export const checkFetchResponseForProfessorBlock = (response) => {
  if (!response || response.status !== 403) return;
  response
    .clone()
    .text()
    .then(inspectForbiddenBody)
    .catch(() => {});
};

/**
 * Surveille toutes les réponses XHR (donc toutes les instances axios) et émet PROFESSOR_NOT_VALIDATED_EVENT sur un 403
 * PROFIL_PROFESSEUR_NON_VALIDE. Retourne la fonction de désinstallation.
 */
export const installProfessorVerificationNetworkHook = () => {
  const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
  const originalSend = proto ? proto.send : null;
  if (proto && originalSend) {
    proto.send = function patchedSend(...args) {
      this.addEventListener("loadend", () => {
        if (this.status !== 403) return;
        if (this.responseType && this.responseType !== "text") {
          if (this.responseType === "json") {
            if (isProfessorNotValidatedPayload(this.response)) {
              notifyProfessorNotValidated(this.response.message);
            }
          }
          return;
        }
        try {
          inspectForbiddenBody(this.responseText);
        } catch {
          // responseText inaccessible
        }
      });
      return originalSend.apply(this, args);
    };
  }

  return () => {
    if (proto && originalSend) proto.send = originalSend;
  };
};
