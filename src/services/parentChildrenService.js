// Parent ↔ children (« Mes enfants »):
//  GET  /parents/{id}/enfants/statuts
//       → [{enfantId, prenom, nom, niveau, classes:[{classeId, classeNom, statut: APPROUVEE|EN_ATTENTE|REJETEE,
//            motifRejet, dateDemande}]}]
//  POST /parents/{id}/enfants/inscription {prenom, nom, codeClasse} → child entry (new child + class request)
//  POST /parents/{id}/enfants/majeur {email, codesClasse:[…]} → adult child (own account): one follow request per
//       class, validated by that class's professor (404 ELEVE_INTROUVABLE: no student account; 400
//       ELEVE_PAS_DANS_CLASSE: not a member of that class; 409 LIEN_PARENT_DEJA_DEMANDE)
//       → {…, classesSuivi:[{classeId, classeNom, statut, demandeSuiviId}]}
//  POST /demandes-suivi/{id}/annuler → the parent cancels his own pending follow request (one class)
//  Adult child in statuts: classes[] = one entry per requested class (APPROUVEE = follow accepted, EN_ATTENTE =
//       pending professor, REJETEE + motifRejet), with demandeSuiviId; lienStatut LIE once one class is accepted.
//  existing child joining another class: POST /acceder/demandes (estParent=true, eleveAssocieId)
//  statuts items also carry: majeur, email, lienStatut (LIE | EN_ATTENTE_VALIDATION_PROFESSEUR | REFUSE),
//       demandeLienId, motifRefusLien. Only LIE children can be followed.
// Errors: {code, message}.

import AccederService from "./accederService";

const API = process.env.REACT_APP_API_BASE_URL;

/** Link between the parent and a child (statuts.lienStatut). Minor children are always LIE. */
export const LINK_STATUS = {
  LIE: "LIE",
  EN_ATTENTE_VALIDATION_PROFESSEUR: "EN_ATTENTE_VALIDATION_PROFESSEUR",
  REFUSE: "REFUSE",
};

export const CHILD_TYPE = { MINEUR: "MINEUR", MAJEUR: "MAJEUR" };

export const CHILD_STATUS = {
  APPROUVEE: "APPROUVEE",
  EN_ATTENTE: "EN_ATTENTE",
  REJETEE: "REJETEE",
};

const FALLBACK_MESSAGES = {
  CODE_CLASSE_INVALIDE: "Aucune classe ne correspond à ce code.",
  CLASSE_NON_ACTIVE: "Cette classe n'est pas encore active.",
  CODE_CLASSE_REQUIS: "Le code de la classe est requis.",
  ENFANT_INVALIDE: "Les informations de l'enfant sont invalides.",
  ENFANT_EN_DOUBLE: "Cet enfant est déjà enregistré.",
  DEMANDE_EXISTANTE: "Une demande est déjà en cours pour cette classe.",
  COMPTE_NON_ELEVE: "Cette adresse e-mail appartient à un compte qui n'est pas un compte élève.",
  LIEN_PARENT_DEJA_DEMANDE: "Une demande de suivi est déjà en attente de validation par son professeur.",
  ELEVE_PAS_DANS_CLASSE: "Cet élève n'est pas inscrit dans cette classe.",
  ELEVE_INTROUVABLE:
    "Aucun élève avec cette adresse e-mail. Votre enfant majeur doit d'abord créer son compte élève ; vous pourrez ensuite demander à suivre sa scolarité.",
  ELEVE_EXISTE_AVEC_COMPTE:
    "Un élève portant ce nom et ayant son propre compte existe déjà dans cette classe. S'il s'agit de votre enfant majeur, ajoutez-le avec son adresse e-mail.",
};

/** Simple e-mail format check (the backend validates again). */
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

/** Normalizes the various spellings of a request status to APPROUVEE / EN_ATTENTE / REJETEE. */
export const normalizeChildStatus = (value) => {
  const s = String(value || "").toUpperCase();
  if (/APPROU|ACCEPT|APPROV|VALID/.test(s)) return CHILD_STATUS.APPROUVEE;
  if (/REJET|REFUS|REJECT/.test(s)) return CHILD_STATUS.REJETEE;
  return CHILD_STATUS.EN_ATTENTE;
};

const authHeaders = () => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Error carrying the backend `code` and HTTP `status`. */
export class ParentChildrenError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code || null;
    this.status = status || null;
  }
}

const toError = async (resp, fallback) => {
  const data = await resp.json().catch(() => ({}));
  const code = String(data?.code || "").toUpperCase() || null;
  const message =
    (typeof data?.message === "string" && data.message) || (code && FALLBACK_MESSAGES[code]) || fallback;
  return new ParentChildrenError(message, code, resp.status);
};

const normalizeClass = (c) => ({
  classeId: c?.classeId || c?.id || c?.classe?.id || null,
  classeNom: c?.classeNom || c?.nom || c?.classe?.nom || "",
  statut: normalizeChildStatus(c?.statut || c?.etat),
  motifRejet: c?.motifRejet || null,
  dateDemande: c?.dateDemande || null,
  demandeSuiviId: c?.demandeSuiviId || null,
});

export const normalizeChildEntry = (e) => ({
  id: e?.enfantId || e?.id || null,
  prenom: e?.prenom || "",
  nom: e?.nom || "",
  niveau: e?.niveau || "",
  email: e?.email || null,
  // Adult child = has (or will have) his own account: the parent only follows him (read-only).
  majeur: e?.majeur === true || String(e?.type || "").toUpperCase() === CHILD_TYPE.MAJEUR || !!e?.email,
  lienStatut: String(e?.lienStatut || LINK_STATUS.LIE).toUpperCase(),
  demandeLienId: e?.demandeLienId || null,
  motifRefusLien: e?.motifRefusLien || null,
  classes: Array.isArray(e?.classes)
    ? e.classes.map(normalizeClass)
    : Array.isArray(e?.classesSuivi)
      ? e.classesSuivi.map(normalizeClass)
      : e?.classeId
      ? [normalizeClass(e)]
      : [],
});

/** The parent follows this child (minor, or adult whose follow request was validated by a professor). */
export const isLinkedChild = (child) => !child?.lienStatut || child.lienStatut === LINK_STATUS.LIE;

export const childHasApprovedClass = (child) =>
  isLinkedChild(child) && (child?.classes || []).some((c) => c.statut === CHILD_STATUS.APPROUVEE);

/**
 * Children with their per-class request status. Falls back to GET /parents/{id}/enfants (no statuses)
 * when the statuses endpoint is not available. Resolves { children, withStatuses }.
 */
export const fetchChildrenStatuses = async (parentId = localStorage.getItem("userId")) => {
  let resp;
  try {
    resp = await fetch(`${API}/parents/${parentId}/enfants/statuts`, { headers: authHeaders() });
  } catch {
    throw new ParentChildrenError("Impossible de contacter le serveur. Vérifiez votre connexion.", "RESEAU", 0);
  }
  if (resp.ok) {
    const data = await resp.json().catch(() => []);
    const children = (Array.isArray(data) ? data : []).map(normalizeChildEntry);
    // Best effort: the plain list carries the child's own e-mail (adult with an account → read-only
    // homework) and level, absent from the statuses.
    try {
      const plain = await fetch(`${API}/parents/${parentId}/enfants`, { headers: authHeaders() });
      if (plain.ok) {
        const list = await plain.json().catch(() => []);
        const byId = new Map((Array.isArray(list) ? list : []).map((k) => [String(k.id), k]));
        children.forEach((c) => {
          const k = byId.get(String(c.id));
          if (!k) return;
          c.email = c.email || k.email || null;
          c.niveau = c.niveau || k.niveau || "";
        });
      }
    } catch {
      // ignore
    }
    return { children, withStatuses: true };
  }
  if (resp.status === 404 || resp.status === 405) {
    const legacy = await fetch(`${API}/parents/${parentId}/enfants`, { headers: authHeaders() }).catch(() => null);
    if (legacy && legacy.ok) {
      const data = await legacy.json().catch(() => []);
      return { children: (Array.isArray(data) ? data : []).map(normalizeChildEntry), withStatuses: false };
    }
  }
  throw await toError(resp, "Impossible de charger vos enfants.");
};

/** Adds a child + request for the class (POST /parents/{id}/enfants/inscription). */
export const registerChild = async ({ prenom, nom, codeClasse }, parentId = localStorage.getItem("userId")) => {
  let resp;
  try {
    resp = await fetch(`${API}/parents/${parentId}/enfants/inscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
      body: JSON.stringify({ prenom: prenom.trim(), nom: nom.trim(), codeClasse: String(codeClasse || "").trim() }),
    });
  } catch {
    throw new ParentChildrenError("Impossible de contacter le serveur. Vérifiez votre connexion.", "RESEAU", 0);
  }
  if (!resp.ok) throw await toError(resp, "Impossible d'ajouter l'enfant.");
  const data = await resp.json().catch(() => null);
  return data ? normalizeChildEntry(data) : null;
};

/** Non-empty, trimmed, distinct class codes. */
export const cleanClassCodes = (codes) => [
  ...new Set((Array.isArray(codes) ? codes : [codes]).map((c) => String(c || "").trim()).filter(Boolean)),
];

/**
 * Adult child (own student account): POST /parents/{id}/enfants/majeur {email, codesClasse} → one follow request
 * per class, validated by that class's professor.
 */
export const registerAdultChild = async ({ email, codesClasse }, parentId = localStorage.getItem("userId")) => {
  const body = { email: String(email || "").trim(), codesClasse: cleanClassCodes(codesClasse) };
  let resp;
  try {
    resp = await fetch(`${API}/parents/${parentId}/enfants/majeur`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ParentChildrenError("Impossible de contacter le serveur. Vérifiez votre connexion.", "RESEAU", 0);
  }
  if (!resp.ok) throw await toError(resp, "Impossible d'ajouter votre enfant.");
  const data = await resp.json().catch(() => null);
  return data ? normalizeChildEntry({ ...data, type: CHILD_TYPE.MAJEUR }) : null;
};

/** The parent cancels his own pending follow request (POST /demandes-suivi/{id}/annuler). */
export const cancelFollowRequest = async (demandeId) => {
  let resp;
  try {
    resp = await fetch(`${API}/demandes-suivi/${demandeId}/annuler`, {
      method: "POST",
      headers: { Accept: "application/json", ...authHeaders() },
    });
  } catch {
    throw new ParentChildrenError("Impossible de contacter le serveur. Vérifiez votre connexion.", "RESEAU", 0);
  }
  if (!resp.ok) throw await toError(resp, "Impossible d'annuler la demande.");
  return resp.json().catch(() => null);
};

/** Existing child joins another class: access request made by the parent for that child. */
export const requestClassForChild = async (childId, preview, parentId = localStorage.getItem("userId")) => {
  try {
    return await AccederService.demanderAcces({
      utilisateurId: parentId,
      classeId: preview.id,
      codeActivation: preview.code,
      estParent: true,
      eleveAssocieId: childId,
    });
  } catch (e) {
    const data = e?.response?.data || {};
    const code = String(data.code || "").toUpperCase() || null;
    throw new ParentChildrenError(
      (typeof data.message === "string" && data.message) ||
        (code && FALLBACK_MESSAGES[code]) ||
        e?.message ||
        "Impossible d'envoyer la demande.",
      code,
      e?.response?.status,
    );
  }
};

/** Makes `child` the selected child (header selector, classes, devoirs…). */
export const storeSelectedChild = (child) => {
  if (!child?.id) return;
  localStorage.removeItem("childClasses");
  localStorage.removeItem("childCourses");
  localStorage.setItem("selectedChildId", child.id);
  localStorage.setItem("selectedChildName", `${child.prenom || ""} ${child.nom || ""}`);
  localStorage.setItem("selectedChildNiveau", child.niveau || "");
  localStorage.setItem("selectedChildHasAccount", child.email || child.majeur ? "true" : "false");
};
