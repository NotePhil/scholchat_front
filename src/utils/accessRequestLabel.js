// Display helpers for class access requests (DemandeAccesDto). A parent's request for
// a child carries eleveAssocieId / eleveAssocieNom / eleveAssociePrenom.

export const requesterName = (r) =>
  `${r?.prenom || r?.utilisateurPrenom || ""} ${r?.nom || r?.utilisateurNom || ""}`.trim();

export const associatedChildName = (r) => `${r?.eleveAssociePrenom || ""} ${r?.eleveAssocieNom || ""}`.trim();

export const isChildAccessRequest = (r) =>
  !!(r && (r.eleveAssocieId || r.eleveAssociePrenom || r.eleveAssocieNom));

/** "<Parent> pour l'enfant <Enfant>" for a parent's request, else the requester's name. */
export const accessRequestLabel = (r) => {
  const who = requesterName(r) || "Demandeur";
  if (!isChildAccessRequest(r)) return who;
  return `${who} pour l'enfant ${associatedChildName(r) || "(enfant)"}`;
};
