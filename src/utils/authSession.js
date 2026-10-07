// Mise à jour de la session locale après POST /auth/switch-role (changement de
// profil avec mot de passe depuis Principal, ou ré-émission silencieuse du
// jeton quand un professeur vient d'être validé).

const DASHBOARD_BY_ROLE = {
  ADMIN: "AdminDashboard",
  PROFESSOR: "ProfessorDashboard",
  PARENT: "ParentDashboard",
  STUDENT: "StudentDashboard",
  TUTOR: "ProfessorDashboard",
  GESTIONNAIRE: "GestionnaireDashboard",
};

export const dashboardNameForRole = (role) =>
  DASHBOARD_BY_ROLE[String(role || "").toUpperCase().replace(/^ROLE_/, "")] ||
  "AdminDashboard";

/** Stocke la réponse d'authentification ; retourne le rôle sélectionné (sans ROLE_). */
export const storeSwitchRoleResponse = (authData, requestedRole) => {
  const newRole = String(authData.selectedRole || requestedRole)
    .toUpperCase()
    .replace(/^ROLE_/, "");

  // Le jeton porte tous les rôles actifs du compte
  localStorage.setItem("accessToken", authData.accessToken);
  localStorage.setItem("authToken", authData.accessToken);
  localStorage.setItem("userRole", "ROLE_" + newRole);
  try {
    const decoded = JSON.parse(
      atob(authData.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    localStorage.setItem("decodedToken", JSON.stringify(decoded));
    if (Array.isArray(decoded.roles))
      localStorage.setItem("userRoles", JSON.stringify(decoded.roles));
  } catch {
    // conserve le jeton décodé précédent
  }
  if (Array.isArray(authData.expiredEntities) && authData.expiredEntities.length > 0) {
    localStorage.setItem("expiredOfferEntities", JSON.stringify(authData.expiredEntities));
  } else {
    localStorage.removeItem("expiredOfferEntities");
  }
  // Contient aussi professeurStatutVerification / professeurMotifRejet
  localStorage.setItem("authResponse", JSON.stringify(authData));
  localStorage.setItem("availableRoles", JSON.stringify(authData.availableRoles || []));
  if (authData.children)
    localStorage.setItem("children", JSON.stringify(authData.children));
  return newRole;
};

/**
 * Changement de profil sans mot de passe pour l'utilisateur déjà connecté
 * (jeton Bearer). Lève une Error portant le message du serveur en cas d'échec.
 */
export const switchRoleWithToken = async (selectedRole) => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/switch-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ selectedRole }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const err = new Error(errData.message || "Impossible de changer de profil.");
    err.code = errData.code; // e.g. CHANGEMENT_PROFIL_INTERDIT_ELEVE (403, student session)
    err.status = response.status;
    throw err;
  }
  const authData = await response.json();
  storeSwitchRoleResponse(authData, selectedRole);
  return authData;
};

/**
 * Silent refresh of the session payload (active / pending roles, professor status) with the
 * current token — e.g. on the profile page after a PROFESSOR_ROLE_VALIDATED notification.
 * Never called from a STUDENT session (the backend refuses switch-role there). Resolves the new
 * auth payload or null (errors are ignored).
 */
export const refreshSessionRoles = async () => {
  const current = String(localStorage.getItem("userRole") || "")
    .toUpperCase()
    .replace(/^ROLE_/, "");
  if (!current || current === "STUDENT") return null;
  try {
    return await switchRoleWithToken(current);
  } catch {
    return null;
  }
};
