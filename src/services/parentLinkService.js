// Parental follow-up of an adult student (own account), PER CLASS. Each follow request (parent, class) is
// validated by that class's managers (professors) or an administrator — never by the student.
//  Student (read-only):
//   GET  /eleves/{id}/suivi-parental → one item per (parent, class)
//        [{parentId, parentPrenom, parentNom, parentEmail, classeId, classeNom, depuis}]
//  Class managers / admin:
//   GET  /classes/{classeId}/demandes-suivi → pending requests for THAT class [{id, parentId, parent*, eleveId,
//        eleve*, classeId, classeNom, etat, dateDemande}]
//   POST /demandes-suivi/{id}/approuver | /refuser?motif=… (409 already handled, 403 not a manager)
//   GET  /classes/{classeId}/suivis-parentaux → accepted follows of THAT class [{id (follow id), …, depuis}]
//   DELETE /demandes-suivi/{id} → removes that class's follow (204; 403 for parent / student / other professor);
//        the parent link disappears when no class remains
// Errors: {code, message}.

const API = process.env.REACT_APP_API_BASE_URL;

/** sessionStorage flag: open Paramètres on the « Suivi parental » card (e-mail link before / after login). */
export const FOCUS_PARENT_LINKS_KEY = "focusParentLinkRequests";

const authHeaders = () => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export class ParentLinkError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code || null;
    this.status = status || null;
  }
}

const call = async (path, options, fallback) => {
  let resp;
  try {
    resp = await fetch(`${API}${path}`, {
      ...options,
      headers: { Accept: "application/json", ...(options?.headers || {}), ...authHeaders() },
    });
  } catch {
    throw new ParentLinkError("Impossible de contacter le serveur. Vérifiez votre connexion.", "RESEAU", 0);
  }
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const code = String(data?.code || "").toUpperCase() || null;
    let message = (typeof data?.message === "string" && data.message) || fallback;
    if (resp.status === 409 && !data?.message) message = "Cette demande a déjà été traitée.";
    throw new ParentLinkError(message, code, resp.status);
  }
  return data;
};

const fullName = (prenom, nom, email, fallback) => `${prenom || ""} ${nom || ""}`.trim() || email || fallback;

export const normalizeFollow = (d) => ({
  id: d?.id || null,
  parentId: d?.parentId || null,
  parentNom: fullName(d?.parentPrenom, d?.parentNom, d?.parentEmail, "Un parent"),
  parentEmail: d?.parentEmail || "",
  eleveId: d?.eleveId || null,
  eleveNom: fullName(d?.elevePrenom, d?.eleveNom, d?.eleveEmail, "Un élève"),
  eleveEmail: d?.eleveEmail || "",
  classeId: d?.classeId || null,
  classeNom: d?.classeNom || "",
  etat: String(d?.etat || "").toUpperCase(),
  dateDemande: d?.dateDemande || null,
  depuis: d?.depuis || null,
  motif: d?.motif || null,
});

const list = (data) => (Array.isArray(data) ? data : []).map(normalizeFollow);

/** Parents who follow the student (read-only for the student). */
export const fetchMyParentFollows = async (eleveId = localStorage.getItem("userId")) =>
  list(await call(`/eleves/${eleveId}/suivi-parental`, { method: "GET" }, "Impossible de charger votre suivi parental."));

/** Pending follow requests of a class's students (class managers / admin). */
export const fetchClassFollowRequests = async (classeId) =>
  list(await call(`/classes/${classeId}/demandes-suivi`, { method: "GET" }, "Impossible de charger les demandes de suivi."));

/** Active follows of a class's adult students (class managers / admin). */
export const fetchClassParentFollows = async (classeId) =>
  list(await call(`/classes/${classeId}/suivis-parentaux`, { method: "GET" }, "Impossible de charger les suivis parentaux."));

export const approveFollowRequest = async (demandeId) =>
  normalizeFollow(await call(`/demandes-suivi/${demandeId}/approuver`, { method: "POST" }, "Impossible d'approuver la demande."));

export const rejectFollowRequest = async (demandeId, motif) => {
  const q = motif && motif.trim() ? `?motif=${encodeURIComponent(motif.trim())}` : "";
  return normalizeFollow(await call(`/demandes-suivi/${demandeId}/refuser${q}`, { method: "POST" }, "Impossible de refuser la demande."));
};

/** Removes the follow of one class (class manager / admin only): DELETE /demandes-suivi/{id}. */
export const removeParentFollow = async (followId) => {
  await call(`/demandes-suivi/${followId}`, { method: "DELETE" }, "Impossible de retirer le suivi.");
  return true;
};

/** Student view: follows grouped by parent → [{parentId, parentNom, parentEmail, classes:[{classeId, classeNom, depuis}]}]. */
export const groupFollowsByParent = (follows) => {
  const byParent = new Map();
  (follows || []).forEach((f) => {
    const key = f.parentId || f.parentEmail || f.parentNom;
    if (!byParent.has(key)) {
      byParent.set(key, { parentId: f.parentId, parentNom: f.parentNom, parentEmail: f.parentEmail, classes: [] });
    }
    byParent.get(key).classes.push({ classeId: f.classeId, classeNom: f.classeNom, depuis: f.depuis });
  });
  return [...byParent.values()];
};
