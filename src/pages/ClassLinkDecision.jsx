import React, { useRef, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleXmark,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
  CLASS_CONFIRM_LABELS,
  getClassActionTexts,
} from "../utils/classActionConfirm";

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
        setMessage(
          "Classe introuvable. Vérifiez que l'ID de la classe est correct.",
        );
      } else {
        setMessage(error.response?.data?.message || errorMessage);
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const gradient = isApprove
    ? "from-blue-50 to-indigo-100"
    : "from-red-50 to-pink-100";

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${gradient} flex items-center justify-center p-4`}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === "invalid" && (
          <>
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className="w-16 h-16 text-red-600 mx-auto mb-4"
            />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Lien invalide
            </h2>
            <p className="text-gray-600">
              Ce lien est incomplet. Vérifiez l'adresse reçue par email.
            </p>
          </>
        )}

        {status === "confirm" && (
          <>
            <FontAwesomeIcon
              icon={isApprove ? faCircleCheck : faTriangleExclamation}
              className={`w-16 h-16 mx-auto mb-4 ${isApprove ? "text-green-600" : "text-red-600"}`}
            />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {texts.title}
            </h2>
            <p className="text-gray-600 mb-6">{texts.message}</p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setStatus("cancelled")}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                {CLASS_CONFIRM_LABELS.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2 rounded-lg text-white font-semibold transition ${isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {CLASS_CONFIRM_LABELS.confirm}
              </button>
            </div>
          </>
        )}

        {status === "loading" && (
          <>
            <FontAwesomeIcon
              icon={faSpinner}
              className={`w-16 h-16 animate-spin mx-auto mb-4 ${isApprove ? "text-blue-600" : "text-red-600"}`}
            />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isApprove ? "Validation en cours..." : "Rejet en cours..."}
            </h2>
            <p className="text-gray-600 mb-6">Veuillez patienter.</p>
            <button
              type="button"
              disabled
              className={`px-5 py-2 rounded-lg text-white font-semibold opacity-60 cursor-not-allowed inline-flex items-center gap-2 ${isApprove ? "bg-green-600" : "bg-red-600"}`}
            >
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              {CLASS_CONFIRM_LABELS.confirm}
            </button>
          </>
        )}

        {status === "cancelled" && (
          <>
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
            />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Action annulée
            </h2>
            <p className="text-gray-600 mb-6">
              Aucune modification n'a été apportée à la classe.
            </p>
            <button
              type="button"
              onClick={() => setStatus("confirm")}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Revenir
            </button>
          </>
        )}

        {status === "success" && (
          <>
            <FontAwesomeIcon
              icon={isApprove ? faCircleCheck : faCircleXmark}
              className={`w-16 h-16 mx-auto mb-4 ${isApprove ? "text-green-600" : "text-red-600"}`}
            />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {successTitle}
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {successHint && (
              <p className="text-sm text-gray-500">{successHint}</p>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className="w-16 h-16 text-red-600 mx-auto mb-4"
            />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {errorTitle}
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500 mb-4">
              Veuillez contacter l'administrateur si le problème persiste.
            </p>
            <button
              type="button"
              onClick={() => setStatus("confirm")}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Réessayer
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ClassLinkDecision;
