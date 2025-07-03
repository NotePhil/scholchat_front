import React, { useState, useEffect } from "react";
import { Check, X, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { rejectionService } from "../../../../services/RejectionService";

const UserViewModal = ({ user, onClose, onSuccess }) => {
  const [showRejectionOptions, setShowRejectionOptions] = useState(false);
  const [rejectionMotifs, setRejectionMotifs] = useState([]);
  const [selectedMotifs, setSelectedMotifs] = useState([]);
  const [customMotif, setCustomMotif] = useState("");
  const [isLoadingMotifs, setIsLoadingMotifs] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fonction simplifiée pour déterminer si les actions doivent être affichées
  const shouldShowActions = () => {
    return user?.etat === "AWAITING_VALIDATION";
  };

  useEffect(() => {
    // Only fetch rejection motifs if actions should be shown
    if (shouldShowActions()) {
      fetchRejectionMotifs();
    }
    fetchUserDocuments();
  }, [user]);

  const fetchRejectionMotifs = async () => {
    try {
      setIsLoadingMotifs(true);
      const motifs = await rejectionService.getAllMotifs();
      setRejectionMotifs(motifs);
    } catch (err) {
      console.error("Échec du chargement des motifs de rejet:", err);
      if (err.response?.status === 409 || err.response?.status === 500) {
        setError("Échec du chargement des motifs de rejet");
      }
    } finally {
      setIsLoadingMotifs(false);
    }
  };

  const fetchUserDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      const documents = [];

      const documentFields = [
        { field: "cniUrlFront", title: "CNI Recto" },
        { field: "cniUrlBack", title: "CNI Verso" },
        { field: "photoFullPicture", title: "Photo de profil" },
      ];

      documentFields.forEach(({ field, title }) => {
        if (user[field]) {
          documents.push({
            id: field,
            title,
            url: user[field],
          });
        }
      });

      setUserDocuments(documents);
    } catch (err) {
      console.error("Échec du chargement des documents:", err);
      if (err.response?.status === 409 || err.response?.status === 500) {
        setError("Échec du chargement des documents");
      }
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const toggleMotif = (motif) => {
    setSelectedMotifs((prev) =>
      prev.some((m) => m.id === motif.id)
        ? prev.filter((m) => m.id !== motif.id)
        : [...prev, motif]
    );
  };

  const handleSuccess = () => {
    if (typeof onSuccess === "function") {
      onSuccess();
    }
    onClose();
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const primaryMotif = selectedMotifs[0] || {
        code: "CUSTOM",
        descriptif: customMotif,
      };

      await rejectionService.rejectProfessor(user.id, {
        codeErreur: primaryMotif.code,
        motifSupplementaire: customMotif || primaryMotif.descriptif,
      });

      setSuccessMessage("Professeur rejeté avec succès");
      setTimeout(() => {
        handleSuccess();
      }, 2000);
    } catch (err) {
      console.error("Échec du rejet:", err);
      if (err.response?.status === 409 || err.response?.status === 500) {
        setError(
          err.message || "Échec du rejet du professeur. Veuillez réessayer."
        );
      } else {
        setSuccessMessage("Opération réussie (veuillez actualiser la page)");
        setTimeout(() => {
          handleSuccess();
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      await rejectionService.validateProfessor(user.id);

      setSuccessMessage("Professeur approuvé avec succès");
      setTimeout(() => {
        handleSuccess();
      }, 2000);
    } catch (err) {
      console.error("Échec de l'approbation:", err);
      if (err.response?.status === 409 || err.response?.status === 500) {
        setError(
          err.message ||
            "Échec de l'approbation du professeur. Veuillez réessayer."
        );
      } else {
        setSuccessMessage("Opération réussie (veuillez actualiser la page)");
        setTimeout(() => {
          handleSuccess();
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getVerificationStatusBadge = () => {
    const verificationStatus = user?.verificationStatus;
    const userState = user?.etat;
    const hasRejectionMotif = user?.motif;

    let status = "PENDING";
    let statusText = "En attente de vérification";
    let statusClass = "bg-yellow-100 text-yellow-800";

    if (userState === "ACTIVE") {
      status = "APPROVED";
      statusText = "Approuvé";
      statusClass = "bg-green-100 text-green-800";
    } else if (userState === "INACTIVE" && hasRejectionMotif) {
      status = "REJECTED";
      statusText = "Rejeté";
      statusClass = "bg-red-100 text-red-800";
    } else if (verificationStatus === "APPROVED") {
      status = "APPROVED";
      statusText = "Approuvé";
      statusClass = "bg-green-100 text-green-800";
    } else if (verificationStatus === "REJECTED") {
      status = "REJECTED";
      statusText = "Rejeté";
      statusClass = "bg-red-100 text-red-800";
    } else if (userState === "AWAITING_VALIDATION") {
      status = "AWAITING_VALIDATION";
      statusText = "En attente de validation";
      statusClass = "bg-yellow-100 text-yellow-800";
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
      >
        {statusText}
      </span>
    );
  };

  const getProcessingStatusMessage = () => {
    const verificationStatus = user?.verificationStatus;
    const userState = user?.etat;
    const hasRejectionMotif = user?.motif;

    if (userState === "ACTIVE") {
      return {
        type: "success",
        message: "Ce professeur a déjà été approuvé et validé.",
      };
    }

    if (userState === "INACTIVE" && hasRejectionMotif) {
      return {
        type: "error",
        message: `Ce professeur a déjà été rejeté pour le motif suivant: ${hasRejectionMotif}`,
      };
    }

    if (verificationStatus === "APPROVED") {
      return {
        type: "success",
        message: "Ce professeur a déjà été approuvé et validé.",
      };
    }

    if (verificationStatus === "REJECTED") {
      return {
        type: "error",
        message: `Ce professeur a déjà été rejeté${
          hasRejectionMotif
            ? ` pour le motif suivant: ${hasRejectionMotif}`
            : "."
        }`,
      };
    }

    return null;
  };

  if (successMessage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <Check className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Succès</h3>
            <div className="mt-2 text-sm text-gray-500">{successMessage}</div>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                onClick={handleSuccess}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusMessage = getProcessingStatusMessage();
  const showActions = shouldShowActions();

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            Détails de l'utilisateur
          </h2>
          <div className="flex items-center space-x-4">
            {getVerificationStatusBadge()}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div
              className={`mb-4 p-3 rounded-md flex items-center ${
                statusMessage.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{statusMessage.message}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* User details */}
            <div className="flex-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  Informations de l'utilisateur
                </h3>

                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-medium">
                    {user?.nom?.charAt(0)}
                    {user?.prenom?.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="text-xl font-semibold text-gray-900">
                      {user?.nom} {user?.prenom}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {user?.type}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">
                      {user?.telephone || "Non fourni"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className="font-medium">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user?.etat === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : user?.etat === "PENDING" ||
                              user?.etat === "AWAITING_VALIDATION"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user?.etat}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date d'inscription</p>
                    <p className="font-medium">
                      {user?.dateCreation
                        ? new Date(user.dateCreation).toLocaleDateString()
                        : "Non disponible"}
                    </p>
                  </div>
                  {user?.motif && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Motif de rejet</p>
                      <p className="font-medium text-red-600">{user.motif}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions - Only show for AWAITING_VALIDATION status */}
            {showActions && (
              <div className="flex-shrink-0 w-full lg:w-64">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Actions
                  </h3>

                  <div className="space-y-3">
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className={`w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center ${
                        isProcessing ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    >
                      {isProcessing ? (
                        <span className="animate-spin mr-2">↻</span>
                      ) : (
                        <Check className="w-5 h-5 mr-2" />
                      )}
                      Approuver
                    </button>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowRejectionOptions(!showRejectionOptions)
                        }
                        disabled={isProcessing}
                        className={`w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center justify-center ${
                          isProcessing ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                      >
                        <X className="w-5 h-5 mr-2" />
                        Rejeter
                        {showRejectionOptions ? (
                          <ChevronUp className="w-5 h-5 ml-2" />
                        ) : (
                          <ChevronDown className="w-5 h-5 ml-2" />
                        )}
                      </button>

                      {showRejectionOptions && (
                        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-md shadow-lg">
                          <h4 className="font-medium mb-2">
                            Sélectionnez les motifs:
                          </h4>

                          {isLoadingMotifs ? (
                            <div className="py-2 text-gray-500 text-sm">
                              Chargement des motifs...
                            </div>
                          ) : (
                            <div className="max-h-40 overflow-y-auto mb-3">
                              {rejectionMotifs.map((motif) => (
                                <label
                                  key={motif.id}
                                  className="flex items-center mb-2"
                                >
                                  <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={selectedMotifs.some(
                                      (m) => m.id === motif.id
                                    )}
                                    onChange={() => toggleMotif(motif)}
                                    disabled={isProcessing}
                                  />
                                  <span className="text-sm">
                                    {motif.descriptif}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}

                          <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">
                              Ajouter un motif personnalisé:
                            </label>
                            <textarea
                              value={customMotif}
                              onChange={(e) => setCustomMotif(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              rows="2"
                              placeholder="Détails supplémentaires..."
                              disabled={isProcessing}
                            ></textarea>
                          </div>

                          <button
                            onClick={handleReject}
                            disabled={
                              (selectedMotifs.length === 0 && !customMotif) ||
                              isProcessing
                            }
                            className={`w-full py-1 px-3 rounded-md text-white ${
                              (selectedMotifs.length === 0 && !customMotif) ||
                              isProcessing
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {isProcessing
                              ? "Traitement en cours..."
                              : "Confirmer le rejet"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Documents section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4 text-gray-800">
              Documents téléchargés
            </h3>

            {isLoadingDocuments ? (
              <div className="flex justify-center items-center p-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : userDocuments.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                Aucun document téléchargé
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userDocuments.map((doc) => (
                  <div key={doc.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="aspect-square relative overflow-hidden rounded-md mb-2">
                      <img
                        src={doc.url}
                        alt={doc.title}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/300x300?text=Document+Non+Trouvé";
                        }}
                      />
                    </div>
                    <h4 className="text-sm font-medium text-center">
                      {doc.title}
                    </h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserViewModal;
