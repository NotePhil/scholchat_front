import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ClassLinkDecision from "./ClassLinkDecision";

/** Emailed class-rejection link: asks for confirmation before rejecting. */
const ClassRejection = () => {
  const { classeId: pathClasseId, etablissementId: pathEtablissementId } =
    useParams();
  const [searchParams] = useSearchParams();
  const classeId = pathClasseId || searchParams.get("classeId");
  const etablissementId =
    pathEtablissementId || searchParams.get("etablissementId");
  const className =
    searchParams.get("nom") || searchParams.get("className") || undefined;
  // Signed token from the e-mailed link: lets the backend accept the decision without a login.
  const token = searchParams.get("token");
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
  const requestUrl =
    classeId && etablissementId
      ? `${process.env.REACT_APP_API_BASE_URL}/etablissements/reject-class/${classeId}/${etablissementId}${tokenQuery}`
      : null;
  return (
    <ClassLinkDecision
      action="reject"
      requestUrl={requestUrl}
      className={className}
      successTitle="Rejet effectué !"
      successMessage="Classe rejetée avec succès par l'établissement !"
      successHint="La classe a été rejetée par l'établissement."
      errorTitle="Erreur de rejet"
      errorMessage="Erreur lors du rejet de la classe"
    />
  );
};
export default ClassRejection;
