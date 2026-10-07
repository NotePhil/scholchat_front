import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCircleCheck,
  faCircleExclamation,
  faCircleXmark,
  faLinkSlash,
  faRotateLeft,
  faSchool,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { AuthShell, BrandLogo, Button, StatusIcon } from "../components/frontoffice/ui";
import { CLASS_CONFIRM_LABELS, getClassActionTexts } from "../utils/classActionConfirm";

/**
 * Shared body of the emailed class approval / rejection link pages
 * (ClassApproval, ClassRejection, ClassApprovalConfirmation). Nothing is sent
 * on page load: the page first explains what will happen and the request only
 * fires after an explicit "Confirmer" click ("Annuler" leaves the class
 * untouched).
 *
 * Props:
 * - action: "approve" | "reject"
 * - requestUrl: full URL of the backend endpoint to call
 * - method: HTTP method (default "post")
 * - className: optional class name (from the link's ?nom= / ?className=)
 * - successTitle / successMessage / successHint, errorTitle / errorMessage
 * - theme: front-office theme ("dark" | other)
 */
const ClassLinkDecision = ({
  action,
  requestUrl,
  method = "post",
  className,
  successTitle,
  successMessage,
  successHint,
  errorTitle,
  errorMessage,
  theme,
}) => {
  const isApprove = action === "approve";
  const texts = getClassActionTexts(action, className);
  const [status, setStatus] = useState(requestUrl ? "confirm" : "invalid");
  const [message, setMessage] = useState("");
  const submittingRef = useRef(false);

  const handleConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus("loading");
    try {
      await axios({ method, url: requestUrl });
      setStatus("success");
      setMessage(successMessage);
    } catch (error) {
      console.error(`Class ${action} error:`, error);
      setStatus("error");
      if (error.response?.status === 404) {
        setMessage("Classe introuvable. Vérifiez que l'ID de la classe est correct.");
      } else {
        setMessage(error.response?.data?.message || errorMessage);
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const decisionBtn = isApprove
    ? ""
    : "!bg-none !bg-[#EF4444] hover:!bg-red-600 !shadow-red-500/25";

  return (
    <AuthShell theme={theme}>
      <div className="max-w-md mx-auto text-center">
        <BrandLogo className="mb-8" />

        {status === "invalid" && (
          <>
            <StatusIcon icon={faLinkSlash} tone="error" />
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Lien invalide</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Ce lien est incomplet. Vérifiez l'adresse reçue par e-mail.</p>
          </>
        )}

        {(status === "confirm" || status === "loading") && (
          <>
            <StatusIcon icon={isApprove ? faCircleCheck : faTriangleExclamation} tone={isApprove ? "success" : "error"} />
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
              {status === "loading" ? (isApprove ? "Validation en cours…" : "Rejet en cours…") : texts.title}
            </h1>
            {className && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-[#4F46E5] dark:text-indigo-300">
                <FontAwesomeIcon icon={faSchool} /> {className}
              </p>
            )}
            <p className="mt-3 text-slate-500 dark:text-slate-400">{status === "loading" ? "Veuillez patienter." : texts.message}</p>
            <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
              <Button type="button" variant="subtle" className="sm:flex-1" onClick={() => setStatus("cancelled")} disabled={status === "loading"}>
                {CLASS_CONFIRM_LABELS.cancel}
              </Button>
              <Button
                type="button"
                className={`sm:flex-1 ${decisionBtn}`}
                onClick={handleConfirm}
                loading={status === "loading"}
                loadingLabel={CLASS_CONFIRM_LABELS.confirm}
              >
                {CLASS_CONFIRM_LABELS.confirm}
              </Button>
            </div>
          </>
        )}

        {status === "cancelled" && (
          <>
            <StatusIcon icon={faCircleExclamation} tone="neutral" />
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Action annulée</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Aucune modification n'a été apportée à la classe.</p>
            <Button type="button" variant="secondary" className="mt-6" onClick={() => setStatus("confirm")}>
              <FontAwesomeIcon icon={faRotateLeft} /> Revenir
            </Button>
          </>
        )}

        {status === "success" && (
          <>
            <StatusIcon icon={isApprove ? faCircleCheck : faCircleXmark} tone={isApprove ? "success" : "error"} />
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">{successTitle}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{message}</p>
            {successHint && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{successHint}</p>}
          </>
        )}

        {status === "error" && (
          <>
            <StatusIcon icon={faCircleExclamation} tone="error" />
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">{errorTitle}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{message}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Contactez l'administrateur si le problème persiste.</p>
            <Button type="button" variant="secondary" className="mt-6" onClick={() => setStatus("confirm")}>
              <FontAwesomeIcon icon={faRotateLeft} /> Réessayer
            </Button>
          </>
        )}

        <p className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#4F46E5] dark:text-indigo-300 hover:underline">
            <FontAwesomeIcon icon={faArrowLeft} /> Retour à l'accueil
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default ClassLinkDecision;
