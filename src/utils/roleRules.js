/**
 * ScholChat role-combination rule (also enforced by the backend: POST /utilisateurs → 409 ROLE_INCOMPATIBLE):
 *  - a student (élève) account holds no other profile and cannot add one;
 *  - parent and professor can be combined: an account may add whichever of the two it lacks;
 *  - nobody can add the student profile to an existing account.
 * A role awaiting validation (pending professor) counts as held.
 */
const COMBINABLE = ["PARENT", "PROFESSOR"];

export const normalizeRoleName = (r) => {
  const clean = String(r || "")
    .toUpperCase()
    .replace(/^ROLE_/, "");
  if (clean === "ELEVE") return "STUDENT";
  if (clean === "PROFESSEUR") return "PROFESSOR";
  return clean;
};

/** Roles (PARENT / PROFESSOR) the account may still add, given every role it holds. */
export const getAddableRoles = (heldRoles = []) => {
  const held = new Set(heldRoles.filter(Boolean).map(normalizeRoleName));
  if (held.has("STUDENT")) return [];
  return COMBINABLE.filter((r) => !held.has(r));
};

/** Active + pending roles of the logged-in account, from the stored session. */
export const getStoredHeldRoles = () => {
  let available = [];
  let pending = [];
  try {
    available = JSON.parse(localStorage.getItem("availableRoles") || "[]") || [];
  } catch {
    available = [];
  }
  try {
    pending =
      JSON.parse(localStorage.getItem("authResponse") || "{}").pendingRoles ||
      [];
  } catch {
    pending = [];
  }
  const current = localStorage.getItem("userRole");
  const held = [...available, ...pending];
  if (held.length === 0 && current) held.push(current);
  return held;
};

export const getStoredAddableRoles = () => getAddableRoles(getStoredHeldRoles());
