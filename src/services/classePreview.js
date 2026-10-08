// Aperçu public d'une classe à partir de son code (inscription parent / élève,
// « Rejoindre une classe », ajout du profil élève).
// GET /public/classes/apercu?code=XXXX&type=parent|eleve
//   200 {classeId, nom, niveau, etablissementNom|null, accesMajeur, professeurNom|null}
//   erreurs {code, message} : 404 CODE_CLASSE_INVALIDE, 400 CLASSE_NON_ACTIVE,
//   400 CLASSE_RESERVEE_MINEURS, 400 CODE_CLASSE_REQUIS, 429 TROP_DE_TENTATIVES.

const API = process.env.REACT_APP_API_BASE_URL;

export const CLASS_CODE_MIN_LENGTH = 4;

// Used only when the backend sends no `message` (the backend text is always preferred).
const FALLBACK_MESSAGES = {
  CODE_CLASSE_INVALIDE: "Aucune classe ne correspond à ce code. Vérifiez-le auprès de votre professeur.",
  CLASSE_NON_ACTIVE: "Cette classe n'est pas encore active. Réessayez plus tard ou contactez le professeur.",
  CLASSE_RESERVEE_MINEURS:
    "Cette classe est réservée aux élèves mineurs : c'est le parent qui doit faire la demande pour son enfant.",
  CODE_CLASSE_REQUIS: "Le code de la classe est requis.",
  TROP_DE_TENTATIVES: "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
};

// Codes are matched exactly by the backend (6 digits today): only surrounding spaces are removed.
export const normalizeClassCode = (code) => String(code || "").trim();

/** Error carrying the backend `code` and HTTP `status`. */
export class ClassPreviewError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code || null;
    this.status = status || null;
  }
}

/**
 * Resolves the class preview (normalized: id, nom, niveau, etablissementNom, professeurNom,
 * accesMajeur, code) or throws a ClassPreviewError with a user-facing message.
 */
export const fetchClassPreview = async (code, type = "eleve", { signal } = {}) => {
  const clean = normalizeClassCode(code);
  if (!clean) throw new ClassPreviewError(FALLBACK_MESSAGES.CODE_CLASSE_REQUIS, "CODE_CLASSE_REQUIS", 400);
  let resp;
  try {
    const params = new URLSearchParams({ code: clean, type: type === "parent" ? "parent" : "eleve" });
    resp = await fetch(`${API}/public/classes/apercu?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new ClassPreviewError("Impossible de contacter le serveur. Vérifiez votre connexion.", "RESEAU", 0);
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const errCode = String(data?.code || "").toUpperCase() || (resp.status === 404 ? "CODE_CLASSE_INVALIDE" : resp.status === 429 ? "TROP_DE_TENTATIVES" : "");
    const message =
      (data && typeof data.message === "string" && data.message) ||
      FALLBACK_MESSAGES[errCode] ||
      "Impossible de vérifier ce code pour le moment.";
    throw new ClassPreviewError(message, errCode, resp.status);
  }
  return {
    id: data.classeId || data.id || null,
    nom: data.nom || data.classeNom || "",
    niveau: data.niveau || "",
    etablissementNom: data.etablissementNom || data.etablissement?.nom || null,
    professeurNom: data.professeurNom || null,
    accesMajeur: data.accesMajeur ?? null,
    code: clean,
  };
};
