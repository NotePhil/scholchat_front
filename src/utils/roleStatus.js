// Per-profile status shown in "Mes profils" (active / en attente / documents manquants /
// refusé + motif). The backend extends the profile & auth payloads with a per-role status;
// its exact shape is read defensively from several candidate fields:
//   profile|authResponse . roles | roleStatuses | rolesStatuts | profils  →
//     [ "PARENT" | { role|roleType|type|nom|code, statut|status|statutVerification|roleStatus|etat,
//                    isActive|actif|active, motif|motifRejet|motifRejetVerification|raison } ]
//     or { PROFESSOR: "EN_ATTENTE_VALIDATION", … }
// completed by availableRoles (active), pendingRoles (pending) and the professor
// verification status (professeurStatutVerification / statutVerification + motif).
import { normalizeRoleName } from "./roleRules";

export const ROLE_STATUS = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  DOCS_MISSING: "DOCS_MISSING",
  REJECTED: "REJECTED",
};

export const ROLE_STATUS_META = {
  ACTIVE: { label: "Actif", tone: "success" },
  PENDING: { label: "En attente de validation", tone: "warning" },
  DOCS_MISSING: { label: "Documents manquants", tone: "neutral" },
  REJECTED: { label: "Refusé", tone: "danger" },
};

export const normalizeRoleStatus = (raw) => {
  if (raw === true) return ROLE_STATUS.ACTIVE;
  if (raw === false || raw === null || raw === undefined) return null;
  const s = String(raw).toUpperCase().replace(/[\s-]/g, "_");
  if (!s) return null;
  if (/DOCUMENT|MISSING|MANQUANT|REQUIS|INCOMPLET/.test(s)) return ROLE_STATUS.DOCS_MISSING;
  if (/REJET|REFUS|REJECT|DENIED/.test(s)) return ROLE_STATUS.REJECTED;
  if (/ATTENTE|PENDING|AWAIT|WAITING|SOUMIS|SUBMITTED|REVIEW/.test(s)) return ROLE_STATUS.PENDING;
  if (/^(ACTIVE|ACTIF|ACTIVE_ROLE|VALIDE|VALIDEE|VALIDATED|VALID|APPROUVE|APPROUVEE|APPROVED|OK|TRUE)$/.test(s))
    return ROLE_STATUS.ACTIVE;
  return null;
};

const ROLE_KEYS = ["role", "roleType", "type", "nom", "name", "code", "profil"];
const STATUS_KEYS = ["statut", "status", "roleStatus", "statutRole", "statutVerification", "etat", "state"];
const MOTIF_KEYS = ["motif", "motifRejet", "motifRejetVerification", "motifRefus", "raison", "reason"];

const pick = (obj, keys) => {
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null && obj?.[k] !== "") return obj[k];
  return undefined;
};

const parseEntries = (source) => {
  if (!source) return [];
  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (typeof item === "string") return { role: normalizeRoleName(item), status: null, motif: null };
        if (!item || typeof item !== "object") return null;
        const role = normalizeRoleName(pick(item, ROLE_KEYS));
        if (!role) return null;
        let status = normalizeRoleStatus(pick(item, STATUS_KEYS));
        if (!status) {
          const active = pick(item, ["isActive", "actif", "active"]);
          if (active === true) status = ROLE_STATUS.ACTIVE;
          else if (active === false) status = ROLE_STATUS.PENDING;
        }
        return { role, status, motif: pick(item, MOTIF_KEYS) || null, classeNom: item.classeNom || null };
      })
      .filter(Boolean);
  }
  if (typeof source === "object") {
    return Object.entries(source).map(([role, value]) =>
      value && typeof value === "object"
        ? { role: normalizeRoleName(role), status: normalizeRoleStatus(pick(value, STATUS_KEYS)), motif: pick(value, MOTIF_KEYS) || null }
        : { role: normalizeRoleName(role), status: normalizeRoleStatus(value), motif: null },
    );
  }
  return [];
};

const EXPLICIT_FIELDS = ["roleStatuses", "rolesStatuts", "statutsRoles", "profils", "roles"];

/**
 * Builds [{ role, status, motif }] (ordered: active first) from the profile (GET /utilisateurs/{id})
 * and the stored auth payload.
 */
export const buildRoleStatuses = ({ profile = null, authResponse = {}, availableRoles = [], sessionRole = null } = {}) => {
  const map = new Map();
  const set = (role, status, motif, force = false, classeNom = null) => {
    if (!role || ["USER", "UTILISATEUR"].includes(role)) return;
    const prev = map.get(role);
    if (!prev || force || (!prev.status && status)) {
      map.set(role, {
        role,
        status: status || prev?.status || null,
        motif: motif || prev?.motif || null,
        classeNom: classeNom || prev?.classeNom || null,
      });
    } else if (motif && !prev.motif) {
      prev.motif = motif;
    }
  };

  // 1. explicit per-role statuses (most reliable)
  const explicit = [];
  for (const src of [profile, authResponse]) {
    for (const f of EXPLICIT_FIELDS) explicit.push(...parseEntries(src?.[f]));
  }
  // (backend: profils[] = {role, actif, statut: ACTIF|EN_ATTENTE_VALIDATION|DOCUMENTS_MANQUANTS|REFUSE|
  //  EN_ATTENTE_APPROBATION_CLASSE, statutVerification?, motifRejet?, classeNom?})
  explicit.filter((e) => e.status).forEach((e) => set(e.role, e.status, e.motif, true, e.classeNom));

  // 2. active roles of the session payload
  (availableRoles || []).forEach((r) => set(normalizeRoleName(r), ROLE_STATUS.ACTIVE));
  if (sessionRole) set(normalizeRoleName(sessionRole), ROLE_STATUS.ACTIVE);
  // 3. pending roles
  (authResponse?.pendingRoles || []).forEach((r) => set(normalizeRoleName(r), ROLE_STATUS.PENDING));
  // roles listed without a status
  explicit.filter((e) => !e.status).forEach((e) => set(e.role, null, e.motif));

  // 4. professor verification refines PROFESSOR (unless an explicit status was given)
  const hasExplicitProf = explicit.some((e) => e.role === "PROFESSOR" && e.status);
  const verif = normalizeRoleStatus(
    authResponse?.professeurStatutVerification || profile?.statutVerification || null,
  );
  const verifMotif = authResponse?.professeurMotifRejet || profile?.motifRejetVerification || null;
  if (!hasExplicitProf && verif && map.has("PROFESSOR")) {
    if (verif !== ROLE_STATUS.ACTIVE || map.get("PROFESSOR").status === ROLE_STATUS.ACTIVE) {
      set("PROFESSOR", verif, verif === ROLE_STATUS.REJECTED ? verifMotif : null, true);
    }
  } else if (!hasExplicitProf && verif && verif !== ROLE_STATUS.ACTIVE && verif !== null && profile?.type === "professeur") {
    set("PROFESSOR", verif, verif === ROLE_STATUS.REJECTED ? verifMotif : null, true);
  }

  const order = { ACTIVE: 0, PENDING: 1, DOCS_MISSING: 2, REJECTED: 3 };
  return [...map.values()]
    .map((e) => ({ ...e, status: e.status || ROLE_STATUS.PENDING }))
    .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
};
