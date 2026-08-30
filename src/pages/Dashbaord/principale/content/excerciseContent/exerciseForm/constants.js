import React from "react";
import {
  CheckSquareOutlined, AlignLeftOutlined, FontSizeOutlined,
  FileTextOutlined, EditOutlined, LinkOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";

// ── Niveau ────────────────────────────────────────────────────────────────────
// Backend enum: MATERNELLE | PRIMAIRE | COLLEGE | LYCEE | UNIVERSITE | AUTRE
// We store the enum value directly — no mapping needed.
export const NIVEAUX = [
  { group: "Maternelle", enum: "MATERNELLE", items: [{ label: "Maternelle", value: "MATERNELLE" }] },
  { group: "Primaire",   enum: "PRIMAIRE",   items: [{ label: "CP",  value: "PRIMAIRE" }, { label: "CE1", value: "PRIMAIRE" }, { label: "CE2", value: "PRIMAIRE" }, { label: "CM1", value: "PRIMAIRE" }, { label: "CM2", value: "PRIMAIRE" }] },
  { group: "Collège",    enum: "COLLEGE",    items: [{ label: "6ème", value: "COLLEGE" }, { label: "5ème", value: "COLLEGE" }, { label: "4ème", value: "COLLEGE" }, { label: "3ème", value: "COLLEGE" }] },
  { group: "Lycée",      enum: "LYCEE",      items: [{ label: "2nde", value: "LYCEE" }, { label: "1ère", value: "LYCEE" }, { label: "Terminale", value: "LYCEE" }] },
  { group: "Université", enum: "UNIVERSITE", items: [{ label: "Licence 1", value: "UNIVERSITE" }, { label: "Licence 2", value: "UNIVERSITE" }, { label: "Licence 3", value: "UNIVERSITE" }, { label: "Master 1", value: "UNIVERSITE" }, { label: "Master 2", value: "UNIVERSITE" }] },
  { group: "Autre",      enum: "AUTRE",      items: [{ label: "Autre", value: "AUTRE" }] },
];

// Flat list of unique enum values for the Select
export const NIVEAU_OPTIONS = [
  { label: "Maternelle", value: "MATERNELLE" },
  { label: "Primaire",   value: "PRIMAIRE" },
  { label: "Collège",    value: "COLLEGE" },
  { label: "Lycée",      value: "LYCEE" },
  { label: "Université", value: "UNIVERSITE" },
  { label: "Autre",      value: "AUTRE" },
];

// ── Question types ─────────────────────────────────────────────────────────────
export const QUESTION_TYPES = [
  { value: "QCM",            label: "QCM",             desc: "Choix multiple",       icon: <CheckSquareOutlined /> },
  { value: "VRAI_FAUX",      label: "Vrai / Faux",     desc: "Deux options",         icon: <AlignLeftOutlined /> },
  { value: "REPONSE_COURTE", label: "Réponse courte",  desc: "Texte court",          icon: <FontSizeOutlined /> },
  { value: "REPONSE_LONGUE", label: "Réponse longue",  desc: "Texte développé",      icon: <FileTextOutlined /> },
  { value: "DEVELOPPEMENT",  label: "Développement",   desc: "Rédaction libre",      icon: <EditOutlined /> },
  { value: "ASSOCIATION",    label: "Association",     desc: "Relier les éléments",  icon: <LinkOutlined /> },
  { value: "CLASSEMENT",     label: "Classement",      desc: "Ordonner",             icon: <OrderedListOutlined /> },
  { value: "TROU",           label: "Texte à trous",   desc: "Compléter",            icon: <AlignLeftOutlined /> },
];

export const TYPES_WITH_CHOICES = ["QCM", "VRAI_FAUX", "ASSOCIATION", "CLASSEMENT", "TROU"];
export const TYPES_OPEN = ["REPONSE_COURTE", "REPONSE_LONGUE", "DEVELOPPEMENT"];

// ── Default choices per type ───────────────────────────────────────────────────
export const getDefaultChoix = (type) => {
  if (type === "VRAI_FAUX")
    return [
      { texte: "Vrai", estCorrect: false, ordreAffichage: 1 },
      { texte: "Faux", estCorrect: false, ordreAffichage: 2 },
    ];
  const allCorrect = type === "ASSOCIATION" || type === "CLASSEMENT";
  return [
    { texte: "", estCorrect: allCorrect, ordreAffichage: 1 },
    { texte: "", estCorrect: allCorrect, ordreAffichage: 2 },
  ];
};

export const emptyQuestion = (type = "QCM") => ({
  intitule: "",
  typeQuestion: type,
  points: 1,
  choixReponses: getDefaultChoix(type),
  reponse: "",
  medias: [],
});

// A question attachment is either an image or a PDF — same restriction the backend enforces.
export const QUESTION_MEDIA_ACCEPT = "image/*,application/pdf";
export const isAllowedQuestionMediaFile = (file) =>
  !!file && (file.type.startsWith("image/") || file.type === "application/pdf");

// ── Build API payload for a question ──────────────────────────────────────────
export const buildQuestionPayload = (q) => {
  const base = {
    intitule: q.intitule,
    typeQuestion: q.typeQuestion,
    points: q.points || 1,
    medias: q.medias || [],
  };
  if (TYPES_WITH_CHOICES.includes(q.typeQuestion))
    return { ...base, choixReponses: q.choixReponses };
  return { ...base, reponse: q.reponse };
};

// ── Validate a question before adding ─────────────────────────────────────────
export const validateQuestion = (q, messageApi) => {
  if (!q.intitule.trim()) { messageApi.warning("L'intitulé de la question est requis"); return false; }
  const type = q.typeQuestion;
  if (type === "VRAI_FAUX") {
    if (!q.choixReponses.some(c => c.estCorrect)) { messageApi.warning("Sélectionnez Vrai ou Faux"); return false; }
  } else if (TYPES_WITH_CHOICES.includes(type)) {
    if (q.choixReponses.length < 2) { messageApi.warning("Au moins 2 choix requis"); return false; }
    if (q.choixReponses.some(c => !c.texte.trim())) { messageApi.warning("Tous les choix doivent avoir un texte"); return false; }
    if (type === "QCM" && !q.choixReponses.some(c => c.estCorrect)) { messageApi.warning("Cochez au moins une bonne réponse"); return false; }
  } else if (TYPES_OPEN.includes(type)) {
    if (!q.reponse.trim()) { messageApi.warning("La réponse attendue est requise"); return false; }
  }
  return true;
};
