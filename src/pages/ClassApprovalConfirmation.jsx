import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ClassLinkDecision from "./ClassLinkDecision";

/**
 * Legacy emailed approval link (/scholchat/etablissements/approve-class/:a/:b).
 * Path segments are forwarded in the order received. Asks for confirmation
 * before approving. The backend only exposes this endpoint as POST (the old
 * page sent a GET, which the API never accepted).
 */
const ClassApprovalConfirmation = () => {
  const { establishmentId, classId } = useParams();
  const [searchParams] = useSearchParams();
  const className =
    searchParams.get("nom") || searchParams.get("className") || undefined;
  // Signed token from the e-mailed link: lets the backend accept the decision without a login.
  const token = searchParams.get("token");
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
  const requestUrl =
    establishmentId && classId
      ? `${process.env.REACT_APP_API_BASE_URL}/etablissements/approve-class/${establishmentId}/${classId}${tokenQuery}`
      : null;
  return (
    <ClassLinkDecision
      action="approve"
      requestUrl={requestUrl}
      method="post"
      className={className}
      successTitle="Validation réussie !"
      successMessage="Classe validée avec succès par l'établissement !"
      successHint="La classe est maintenant approuvée par l'établissement et active."
      errorTitle="Erreur de validation"
      errorMessage="Erreur lors de la validation de la classe"
    />
  );
};
export default ClassApprovalConfirmation;
