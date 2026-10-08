import React from "react";
import { Tag } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faClock,
  faPaperPlane,
  faStop,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
export const STATUS_CONFIG = {
  ACTIF: {
    color: "#389e0d",
    bg: "#f6ffed",
    border: "#b7eb8f",
    label: "Actif",
    icon: <FontAwesomeIcon icon={faCircleCheck} />,
  },
  PUBLIE: {
    color: "#1677ff",
    bg: "#e6f4ff",
    border: "#91caff",
    label: "Publié",
    icon: <FontAwesomeIcon icon={faPaperPlane} />,
  },
  BROUILLON: {
    color: "#d48806",
    bg: "#fffbe6",
    border: "#ffe58f",
    label: "Brouillon",
    icon: <FontAwesomeIcon icon={faClock} />,
  },
  INACTIF: {
    color: "#8c8c8c",
    bg: "#fafafa",
    border: "#d9d9d9",
    label: "Inactif",
    icon: <FontAwesomeIcon icon={faStop} />,
  },
  CORRIGE: {
    color: "#531dab",
    bg: "#f9f0ff",
    border: "#d3adf7",
    label: "Corrigé",
    icon: <FontAwesomeIcon icon={faTrophy} />,
  },
  EN_ATTENTE_CORRECTION: {
    color: "#d46b08",
    bg: "#fff7e6",
    border: "#ffd591",
    label: "En attente",
    icon: <FontAwesomeIcon icon={faClock} />,
  },
  VALIDE: {
    color: "#389e0d",
    bg: "#f6ffed",
    border: "#b7eb8f",
    label: "Validé",
    icon: <FontAwesomeIcon icon={faCircleCheck} />,
  },
  ANNULE: {
    color: "#cf1322",
    bg: "#fff1f0",
    border: "#ffa39e",
    label: "Annulé",
    icon: <FontAwesomeIcon icon={faStop} />,
  },
};
export const TYPE_ASSIGNATION_CONFIG = {
  EXERCICE: {
    color: "#1677ff",
    bg: "#e6f4ff",
    border: "#91caff",
    label: "Exercice libre",
  },
  DEVOIR: {
    color: "#531dab",
    bg: "#f9f0ff",
    border: "#d3adf7",
    label: "Devoir",
  },
};
export const statusTag = (status) => {
  const s = STATUS_CONFIG[status];
  if (!s) return <Tag>{status}</Tag>;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.icon} {s.label}
    </span>
  );
};
export const typeAssignationTag = (type) => {
  const t = TYPE_ASSIGNATION_CONFIG[type];
  if (!t) return <Tag>{type || "—"}</Tag>;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        color: t.color,
        background: t.bg,
        border: `1px solid ${t.border}`,
      }}
    >
      {t.label}
    </span>
  );
};
export const restrictionTag = (restriction) => {
  if (restriction === "PUBLIC")
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          color: "#1d4ed8",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
        }}
      >
        Public
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        color: "#6d28d9",
        background: "#f5f3ff",
        border: "1px solid #ddd6fe",
      }}
    >
      Privé
    </span>
  );
};
export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
export const getUserId = () =>
  sessionStorage.getItem("userId") || localStorage.getItem("userId");
