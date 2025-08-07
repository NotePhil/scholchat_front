// CoursProgrammerUtils.js
import {
  Calendar,
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import * as yup from "yup";
export const SCHEDULED_COURSE_STATES = {
  PLANIFIE: "PLANIFIE",
  EN_COURS: "EN_COURS",
  TERMINE: "TERMINE",
  ANNULE: "ANNULE",
};

export const schedulingSchema = yup.object().shape({
  coursId: yup.string().required("Le cours est requis"),
  classeId: yup.string().nullable(),
  dateCoursPrevue: yup.date().required("La date prévue est requise"),
  dateDebutEffectif: yup.date().required("La date de début est requise"),
  dateFinEffectif: yup.date().required("La date de fin est requise"),
  lieu: yup.string().required("Le lieu est requis"),
  description: yup.string().nullable(),
  capaciteMax: yup
    .number()
    .nullable()
    .min(1, "La capacité doit être supérieure à 0"),
  participantsIds: yup.array().of(yup.string()).nullable(),
});

export const getStatusBadge = (status) => {
  const badges = {
    PLANIFIE: "bg-blue-50 text-blue-700 border-blue-200",
    EN_COURS: "bg-green-50 text-green-700 border-green-200",
    TERMINE: "bg-gray-50 text-gray-700 border-gray-200",
    ANNULE: "bg-red-50 text-red-700 border-red-200",
  };
  return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
};

export const getStatusText = (status) => {
  const texts = {
    PLANIFIE: "Planifié",
    EN_COURS: "En cours",
    TERMINE: "Terminé",
    ANNULE: "Annulé",
  };
  return texts[status] || status;
};

export const getStatusIcon = (status) => {
  switch (status) {
    case "PLANIFIE":
      return <Calendar className="w-4 h-4 text-blue-500" />;
    case "EN_COURS":
      return <PlayCircle className="w-4 h-4 text-green-500" />;
    case "TERMINE":
      return <CheckCircle className="w-4 h-4 text-gray-500" />;
    case "ANNULE":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return "Non défini";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getInitials = (title) => {
  return (
    title
      ?.split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase() || "CO"
  );
};
