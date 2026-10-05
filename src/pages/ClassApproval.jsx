import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ClassLinkDecision from "./ClassLinkDecision";

/** Emailed class-approval link: asks for confirmation before approving. */
const ClassApproval = () => {
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
      ? `${process.env.REACT_APP_API_BASE_URL}/etablissements/approve-class/${classeId}/${etablissementId}${tokenQuery}`
      : null;
  return (
    <ClassLinkDecision
      action="approve"
      requestUrl={requestUrl}
      className={className}
      successTitle="Validation réussie !"
      successMessage="Classe validée avec succès par l'établissement !"
      successHint="La classe est maintenant approuvée par l'établissement et active."
      errorTitle="Erreur de validation"
      errorMessage="Erreur lors de la validation de la classe"
    />
  );
};
export default ClassApproval;
