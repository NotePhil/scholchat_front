// "Changer d'offre" confirmation helpers (class/establishment offer panel and renewal page).
//
// Behaviour of POST /contrats/.../changer-offre and /contrats/renouvellement/{token}/changer-offre
// (ContratBusiness#appliquerRenouvellement): the new contract starts NOW (the current one is cancelled)
// and ends at (current end date if the current contract is still running, otherwise now) + the new
// offer's duration — i.e. the remaining time of the current offer is carried over, not lost.

export const formatDateFr = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

export const contratEnCours = (contrat) =>
  contrat?.statut === "ACTIF" &&
  !!contrat?.dateFin &&
  new Date(contrat.dateFin).getTime() > Date.now();

export const finPrevueApresChangement = (contrat, offre, periodicite) => {
  if (!offre) return null;
  const minutes =
    periodicite === "ANNUEL" ? offre.dureeAnnuelleMinutes : offre.dureeMensuelleMinutes;
  if (minutes == null || Number.isNaN(Number(minutes))) return null;
  const base = contratEnCours(contrat) ? new Date(contrat.dateFin).getTime() : Date.now();
  return new Date(base + Number(minutes) * 60000);
};

/** Paragraphs of the confirmation dialog shown before the payment of an offer change. */
export const texteConfirmationChangement = ({ contrat, offre, montant, periodicite }) => {
  const fin = finPrevueApresChangement(contrat, offre, periodicite);
  const intro =
    `La nouvelle offre « ${offre?.nom || "Nouvelle offre"} » (${Number(montant || 0).toLocaleString("fr-FR")} FCFA, ` +
    `${periodicite === "ANNUEL" ? "annuelle" : "mensuelle"}) prendra effet immédiatement après le paiement et ` +
    `remplacera l'offre actuelle « ${contrat?.offreNom || "—"} »` +
    (contrat?.dateFin ? ` (fin prévue le ${formatDateFr(contrat.dateFin)})` : "") +
    ".";
  const reste =
    (contratEnCours(contrat)
      ? "Le temps restant de l'offre actuelle est reporté : il s'ajoute à la durée de la nouvelle offre"
      : "L'offre actuelle n'est plus en cours : la nouvelle offre démarre maintenant") +
    (fin ? ` (nouvelle fin prévue le ${formatDateFr(fin)}).` : ".");
  return [intro, reste];
};
