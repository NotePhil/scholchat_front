// Sign-up (POST /utilisateurs) — client e-mail check and mapping of the backend answers about the e-mail.

/**
 * E-mail check aligned with the backend validator (Apache Commons EmailValidator, no local domains):
 * dot-atom local part (≤ 64 chars, no leading / trailing / double dot, no space or special characters
 * ()<>,;:\"[]), domain made of labels (letters, digits, inner hyphens) and an alphabetic TLD
 * (or IDN "xn--…"). The backend also checks the TLD against the IANA list: an unknown TLD is still
 * refused by the server and mapped to the same French message below.
 */
const LOCAL_ATOM = "[^\\s@()<>,;:\\\\\"\\[\\].\\x00-\\x1F\\x7F]+";
const EMAIL_REGEX = new RegExp(
  `^(?=.{1,254}$)(?=[^@]{1,64}@)${LOCAL_ATOM}(?:\\.${LOCAL_ATOM})*@` +
    "(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$",
);

export const isValidEmail = (email) => EMAIL_REGEX.test(String(email || "").trim());

export const INVALID_EMAIL_MESSAGE = "Adresse e-mail invalide. Vérifiez son format (ex. nom@exemple.com).";
export const INVALID_PHONE_MESSAGE = "Le numéro de téléphone est invalide.";

export const EMAIL_ISSUE_MESSAGES = {
  exists: "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.",
  pending: "Une inscription avec cet e-mail est déjà en attente d'approbation par le professeur de la classe.",
  inactive:
    "Un compte existe déjà avec cet e-mail mais il n'est pas encore activé. Utilisez « Vérifier mon compte ? » sur la page de connexion pour l'activer.",
  awaitingValidation:
    "Un compte existe déjà avec cet e-mail mais il est en attente de validation. Vous recevrez un e-mail dès qu'il sera validé.",
};

/**
 * Maps a failed sign-up answer to an e-mail / phone field error, or null when it's not about them.
 * Returns { field: "email" | "telephone", message, issue? } — issue: "exists" | "pending" | "inactive" | "other"
 * drives the actions shown under the e-mail field (log in / forgot password / verify my account).
 */
export const mapSignupFieldError = (err) => {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const code = String((data && data.code) || "").toUpperCase();
  const msg = (data && typeof data === "object" && typeof data.message === "string" && data.message) || "";

  if (code === "EMAIL_DEJA_UTILISE") return { field: "email", issue: "exists", message: EMAIL_ISSUE_MESSAGES.exists };
  // Existing account that is not active (never activated / awaiting validation): refused, nothing changed.
  if (code === "COMPTE_NON_ACTIVE") return { field: "email", issue: "inactive", message: msg || EMAIL_ISSUE_MESSAGES.inactive };
  if (code === "COMPTE_EN_ATTENTE_VALIDATION") {
    return { field: "email", issue: "inactive", message: msg || EMAIL_ISSUE_MESSAGES.awaitingValidation };
  }
  if (code === "INSCRIPTION_EN_ATTENTE") return { field: "email", issue: "pending", message: EMAIL_ISSUE_MESSAGES.pending };
  if (code === "ROLE_INCOMPATIBLE") {
    return {
      field: "email",
      issue: "other",
      message: msg || "Ce compte ne peut pas recevoir ce profil. Utilisez une autre adresse e-mail.",
    };
  }
  // Existing account (not active) that already has / requested this profile.
  if (code === "DUPLICATE_RESOURCE" || (status === 409 && /mail|compte|profil/i.test(msg))) {
    return { field: "email", issue: "exists", message: msg || EMAIL_ISSUE_MESSAGES.exists };
  }
  if (/invalid email|email is required/i.test(msg)) return { field: "email", message: INVALID_EMAIL_MESSAGE };
  if (/invalid phone/i.test(msg)) return { field: "telephone", message: INVALID_PHONE_MESSAGE };
  return null;
};
