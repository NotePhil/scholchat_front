/**
 * ScholChat role rules (enforced by the backend too):
 *  - one account may hold the parent, professor and student profiles;
 *  - from a STUDENT session nothing can be switched or added: POST /auth/switch-role and
 *    "Ajouter un profil" answer 403 {code: "CHANGEMENT_PROFIL_INTERDIT_ELEVE"} — the user logs
 *    out and picks the other profile on the login screen;
 *  - from a PARENT / PROFESSOR session the user can switch to any active profile (student
 *    included) and add the profiles he lacks (parent: immediate; professor: identity
 *    documents + admin validation; student: class code + teacher approval).
 * A role awaiting validation counts as held (it can't be requested twice).
 */
export const ADDABLE_ROLES = ["PARENT", "PROFESSOR", "STUDENT"];

export const STUDENT_SWITCH_FORBIDDEN_CODE = "CHANGEMENT_PROFIL_INTERDIT_ELEVE";

export const STUDENT_SWITCH_HINT =
  "Pour utiliser un autre profil, déconnectez-vous puis choisissez-le à la connexion.";

export const normalizeRoleName = (r) => {
  const clean = String(r || "")
    .toUpperCase()
    .replace(/^ROLE_/, "");
  if (clean === "ELEVE") return "STUDENT";
  if (clean === "PROFESSEUR") return "PROFESSOR";
  return clean;
};

/** Role of the current session (STUDENT, PARENT, PROFESSOR…). */
export const getSessionRole = () => normalizeRoleName(localStorage.getItem("userRole"));

export const isStudentSession = () => getSessionRole() === "STUDENT";

/** Roles the account may still add, given every role it holds and the session role. */
export const getAddableRoles = (heldRoles = [], sessionRole = getSessionRole()) => {
  const session = normalizeRoleName(sessionRole);
  if (session === "STUDENT" || session === "ADMIN" || session === "GESTIONNAIRE") return [];
  const held = new Set(heldRoles.filter(Boolean).map(normalizeRoleName));
  if (held.has("ADMIN")) return [];
  return ADDABLE_ROLES.filter((r) => !held.has(r));
};

const readJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};

/** Active roles of the account (session payload availableRoles, else the session role). */
export const getStoredActiveRoles = () => {
  const available = readJSON("availableRoles", []) || [];
  const current = localStorage.getItem("userRole");
  const list = available.length > 0 ? available : current ? [current] : [];
  return [...new Set(list.map(normalizeRoleName).filter(Boolean))];
};

/** Active + pending roles of the logged-in account, from the stored session. */
export const getStoredHeldRoles = () => {
  const auth = readJSON("authResponse", {}) || {};
  const pending = Array.isArray(auth.pendingRoles) ? auth.pendingRoles : [];
  return [...new Set([...getStoredActiveRoles(), ...pending.map(normalizeRoleName)])];
};

export const getStoredAddableRoles = () => getAddableRoles(getStoredHeldRoles());

/** True when the account holds other profiles than the current session's one. */
export const accountHasOtherRoles = () => {
  const session = getSessionRole();
  return getStoredHeldRoles().some((r) => r !== session);
};

/** Is this API error the "student session can't switch / add" refusal? */
export const isStudentSwitchForbidden = (errOrData) => {
  const data = errOrData?.response?.data || errOrData?.data || errOrData;
  return String(data?.code || errOrData?.code || "").toUpperCase() === STUDENT_SWITCH_FORBIDDEN_CODE;
};
