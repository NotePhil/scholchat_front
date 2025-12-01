import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { XCircle, AlertCircle, Loader } from "lucide-react";
import axios from "axios";

const ClassRejection = () => {
  const { classeId: pathClasseId, etablissementId: pathEtablissementId } = useParams();
  const [searchParams] = useSearchParams();
  
  const classeId = pathClasseId || searchParams.get("classeId");
  const etablissementId = pathEtablissementId || searchParams.get("etablissementId");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const rejectClass = async () => {
      try {
        const response = await axios.post(
          `http://localhost:8486/scholchat/etablissements/reject-class/${classeId}/${etablissementId}`
        );

        setStatus("success");
        setMessage("Classe rejetée avec succès par l'établissement !");
      } catch (error) {
        setStatus("error");
        console.error("Rejection error:", error);
        if (error.response?.status === 404) {
          setMessage("Classe introuvable. Vérifiez que l'ID de la classe est correct.");
        } else {
          setMessage(
            error.response?.data?.message || "Erreur lors du rejet de la classe"
          );
        }
      }
    };

    if (classeId && etablissementId) {
      rejectClass();
    }
  }, [classeId, etablissementId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader className="w-16 h-16 text-red-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Rejet en cours...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant que l'établissement rejette la classe.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Rejet effectué !
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              La classe a été rejetée par l'établissement.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Erreur de rejet
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Veuillez contacter l'administrateur si le problème persiste.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ClassRejection;
