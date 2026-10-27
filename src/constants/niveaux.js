// Single source of truth for valid education levels. Every form that lets a
// user pick/type a "niveau" (class level) must import this instead of
// hardcoding its own copy - duplicated lists had already drifted (some
// missing CP/CE1/CE2, letting invalid values like "CM44" slip through
// wherever the list was incomplete or the field was free text).
export const NIVEAUX = [
  "CP",
  "CE1",
  "CE2",
  "CM1",
  "CM2",
  "6ème",
  "5ème",
  "4ème",
  "3ème",
  "2nde",
  "1ère",
  "Terminale",
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
];

// Option "Autre" proposée en fin de liste dans les formulaires de CLASSE : elle révèle un champ
// libre et c'est le texte saisi (pas "Autre") qui est envoyé comme niveau. Le backend accepte
// n'importe quel niveau de classe. (Les exercices, eux, restent limités à NIVEAUX.)
export const NIVEAU_AUTRE = "Autre";

/** true si le niveau fait partie de la liste standard (sinon : niveau personnalisé → "Autre"). */
export const isNiveauStandard = (niveau) => NIVEAUX.includes(niveau);
