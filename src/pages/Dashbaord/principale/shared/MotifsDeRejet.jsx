import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Users,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { rejectionService } from "../../../../services/RejectionService";
import { rejectionServiceClass } from "../../../../services/RejectionServiceClass"; // Import the new service
import { themes, colorSchemes } from "../../theme";

const ProfessorsContent = ({ isDark = false, currentTheme = "blue" }) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("prof"); // "prof" or "classe"
  const [motifs, setMotifs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMotifForm, setShowMotifForm] = useState(false);
  const [currentMotif, setCurrentMotif] = useState({
    code: "",
    descriptif: "",
    dateCreation: new Date().toISOString(),
  });
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Theme variables
  const theme = isDark ? themes.dark : themes.light;
  const colors = colorSchemes[currentTheme];

  // Fetch motifs from API using the appropriate service
  const fetchMotifs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (selectedType === "prof") {
        const data = await rejectionService.getAllMotifs();
        setMotifs(data);
      } else {
        const data = await rejectionServiceClass.getAllClassRejectionMotifs();
        setMotifs(data);
      }
    } catch (err) {
      console.error("Failed to load motifs:", err);
      setError(err.message || "Échec du chargement des motifs de rejet");
    } finally {
      setIsLoading(false);
    }
  };

  // Create new motif using the appropriate service
  const createMotif = async (motifData) => {
    try {
      if (selectedType === "prof") {
        const newMotif = await rejectionService.createMotif(motifData);
        return newMotif;
      } else {
        const newMotif = await rejectionServiceClass.createClassRejectionMotif(
          motifData
        );
        return newMotif;
      }
    } catch (err) {
      console.error("Failed to create motif:", err);
      setError(err.message || "Échec de la création du motif");
      throw err;
    }
  };

  // Update motif using the appropriate service
  const updateMotif = async (id, motifData) => {
    try {
      if (selectedType === "prof") {
        const updatedMotif = await rejectionService.updateMotif(id, motifData);
        return updatedMotif;
      } else {
        // For class motifs, we might need to implement update in the service if needed
        // Currently the API doesn't support update, so we'll just return the data
        return motifData;
      }
    } catch (err) {
      console.error("Failed to update motif:", err);
      setError(err.message || "Échec de la mise à jour du motif");
      throw err;
    }
  };

  // Delete motif using the appropriate service
  const deleteMotif = async (id) => {
    try {
      if (selectedType === "prof") {
        await rejectionService.deleteMotif(id);
      } else {
        await rejectionServiceClass.deleteClassRejectionMotif(id);
      }
    } catch (err) {
      console.error("Failed to delete motif:", err);
      setError(err.message || "Échec de la suppression du motif");
      throw err;
    }
  };

  useEffect(() => {
    fetchMotifs();
  }, [selectedType]); // Re-fetch when type changes

  // Form validation
  const validateMotif = () => {
    const errors = {};
    if (!currentMotif.code.trim()) {
      errors.code = "Le code est requis";
    } else if (!/^[A-Z0-9_]+$/.test(currentMotif.code)) {
      errors.code =
        "Le code doit contenir uniquement des majuscules, chiffres et underscores";
    }

    if (!currentMotif.descriptif.trim()) {
      errors.descriptif = "La description est requise";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleMotifSubmit = async (e) => {
    e.preventDefault();

    if (!validateMotif()) {
      return;
    }

    try {
      if (isEditing) {
        const updatedMotif = await updateMotif(currentMotif.id, currentMotif);
        setMotifs(
          motifs.map((motif) =>
            motif.id === currentMotif.id ? updatedMotif : motif
          )
        );
      } else {
        const response = await createMotif(currentMotif);
        setMotifs([...motifs, response]);
      }
      resetMotifForm();
    } catch (err) {
      // Error already handled in the API functions
    }
  };

  // Delete motif handler
  const handleDeleteMotif = async (id) => {
    const confirmMessage =
      selectedType === "prof"
        ? "Êtes-vous sûr de vouloir supprimer ce motif de rejet de professeur ?"
        : "Êtes-vous sûr de vouloir supprimer ce motif de rejet de classe ?";

    if (window.confirm(confirmMessage)) {
      try {
        await deleteMotif(id);
        setMotifs(motifs.filter((motif) => motif.id !== id));
      } catch (err) {
        // Error already handled in the deleteMotif function
      }
    }
  };

  // Reset form
  const resetMotifForm = () => {
    setCurrentMotif({
      code: "",
      descriptif: "",
      dateCreation: new Date().toISOString(),
    });
    setShowMotifForm(false);
    setIsEditing(false);
    setValidationErrors({});
    setError(null);
  };

  // Edit motif
  const editMotif = (motif) => {
    setCurrentMotif({ ...motif });
    setIsEditing(true);
    setShowMotifForm(true);
    setError(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchMotifs();
  };

  // Handle type change
  const handleTypeChange = (type) => {
    setSelectedType(type);
    resetMotifForm();
    setError(null);
  };

  // Get current section title
  const getCurrentSectionTitle = () => {
    return selectedType === "prof"
      ? "Motifs de Rejet de Professeur"
      : "Motifs de Rejet de Classe";
  };

  // Get placeholder text based on type
  const getPlaceholderText = () => {
    if (selectedType === "prof") {
      return {
        code: "Ex: PHOTO_FLOU_RECTO",
        description: "Ex: Photo recto de la CNI floue ou illisible",
      };
    } else {
      return {
        code: "Ex: ABSENCE_NON_JUSTIFIEE",
        description: "Ex: Absence non justifiée sans document valable",
      };
    }
  };

  return (
    <div className={`flex-1 p-4 sm:p-6 ${theme.background}`}>
      <div className="flex flex-col">
        {/* Header - Responsive */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${theme.text}`}>
              Gestion des Motifs de Rejet
            </h1>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              } mt-1`}
            >
              {getCurrentSectionTitle()}
            </p>
          </div>
          <button
            className={`p-2 rounded text-black hover:bg-gray-100 transition-colors duration-200 ${isLoading ? 'animate-spin' : ''}`}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selection - Responsive */}
        <div className="mb-6">
          <div
            className={`flex rounded-lg ${
              isDark ? "bg-gray-700" : "bg-gray-100"
            } p-1 w-full overflow-hidden`}
          >
            <button
              className={`flex items-center justify-center px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex-1 ${
                selectedType === "prof"
                  ? `text-white shadow-sm`
                  : `${theme.text} hover:${
                      isDark ? "bg-gray-600" : "bg-gray-200"
                    }`
              }`}
              style={
                selectedType === "prof"
                  ? { backgroundColor: colors.primary }
                  : {}
              }
              onClick={() => handleTypeChange("prof")}
            >
              <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Rejet du Professeur</span>
              <span className="sm:hidden">Professeur</span>
            </button>
            <button
              className={`flex items-center justify-center px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex-1 ${
                selectedType === "classe"
                  ? `text-white shadow-sm`
                  : `${theme.text} hover:${
                      isDark ? "bg-gray-600" : "bg-gray-200"
                    }`
              }`}
              style={
                selectedType === "classe"
                  ? { backgroundColor: colors.primary }
                  : {}
              }
              onClick={() => handleTypeChange("classe")}
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Rejet de Classe</span>
              <span className="sm:hidden">Classe</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`mb-4 p-4 rounded-md ${
              isDark ? "bg-red-900 text-red-100" : "bg-red-100 text-red-700"
            }`}
          >
            <div className="flex items-center">
              <AlertCircle className="mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg sm:text-xl font-semibold ${theme.text}`}>
              {getCurrentSectionTitle()}
            </h2>
            <button
              className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 rounded transition-colors duration-200 text-white hover:bg-opacity-90 text-sm sm:text-base`}
              style={{ backgroundColor: colors.primary }}
              onClick={() => {
                resetMotifForm();
                setShowMotifForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Motif
            </button>
          </div>

          {/* Form */}
          {showMotifForm && (
            <div className={`mb-6 p-4 rounded shadow-md ${theme.cardBg}`}>
              <h3
                className={`text-base sm:text-lg font-semibold mb-4 ${theme.text}`}
              >
                {isEditing ? "Modifier Motif" : "Ajouter Motif"} -{" "}
                {selectedType === "prof" ? "Professeur" : "Classe"}
              </h3>
              <form onSubmit={handleMotifSubmit}>
                <div className="mb-4">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-2 border rounded text-sm ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    } ${validationErrors.code ? "border-red-500" : ""}`}
                    value={currentMotif.code}
                    onChange={(e) =>
                      setCurrentMotif({
                        ...currentMotif,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder={getPlaceholderText().code}
                    required
                  />
                  {validationErrors.code && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.code}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className={`w-full p-2 border rounded text-sm ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    } ${validationErrors.descriptif ? "border-red-500" : ""}`}
                    value={currentMotif.descriptif}
                    onChange={(e) =>
                      setCurrentMotif({
                        ...currentMotif,
                        descriptif: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder={getPlaceholderText().description}
                    required
                  />
                  {validationErrors.descriptif && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.descriptif}
                    </p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded transition-colors duration-200 text-sm ${
                      isDark
                        ? "bg-gray-600 text-white hover:bg-gray-500"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                    onClick={resetMotifForm}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded text-white transition-colors duration-200 hover:bg-opacity-90 text-sm"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {isEditing ? "Mettre à jour" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table/Cards - Responsive */}
          {isLoading ? (
            <div
              className={`flex justify-center items-center p-8 ${theme.text}`}
            >
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: colors.primary }}
              ></div>
            </div>
          ) : (
            <>
              {/* Desktop Table - Hidden on small screens */}
              <div
                className={`hidden lg:block rounded shadow-md overflow-hidden ${theme.cardBg}`}
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={isDark ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium ${
                          isDark ? "text-gray-300" : "text-gray-500"
                        } uppercase tracking-wider`}
                      >
                        Code
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium ${
                          isDark ? "text-gray-300" : "text-gray-500"
                        } uppercase tracking-wider`}
                      >
                        Description
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium ${
                          isDark ? "text-gray-300" : "text-gray-500"
                        } uppercase tracking-wider`}
                      >
                        Date Création
                      </th>
                      <th
                        className={`px-6 py-3 text-right text-xs font-medium ${
                          isDark ? "text-gray-300" : "text-gray-500"
                        } uppercase tracking-wider`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme.border}`}>
                    {motifs.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className={`px-6 py-4 text-center ${
                            isDark ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {isLoading
                            ? "Chargement..."
                            : `Aucun motif de rejet ${
                                selectedType === "prof"
                                  ? "de professeur"
                                  : "de classe"
                              } trouvé`}
                        </td>
                      </tr>
                    ) : (
                      motifs.map((motif) => (
                        <tr
                          key={motif.id}
                          className={`${
                            isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                          }`}
                        >
                          <td
                            className={`px-6 py-4 whitespace-nowrap ${theme.text} font-mono`}
                          >
                            {motif.code}
                          </td>
                          <td className={`px-6 py-4 ${theme.text}`}>
                            {motif.descriptif}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap ${theme.text}`}
                          >
                            {formatDate(motif.dateCreation)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              className={`p-1 rounded mr-2 ${
                                isDark
                                  ? "text-blue-400 hover:bg-gray-600"
                                  : "text-blue-600 hover:bg-gray-100"
                              }`}
                              onClick={() => editMotif(motif)}
                              title="Modifier"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              className={`p-1 rounded ${
                                isDark
                                  ? "text-red-400 hover:bg-gray-600"
                                  : "text-red-600 hover:bg-gray-100"
                              }`}
                              onClick={() => handleDeleteMotif(motif.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - Shown on small screens */}
              <div className="lg:hidden space-y-4">
                {motifs.length === 0 ? (
                  <div
                    className={`p-6 rounded shadow-md ${theme.cardBg} text-center`}
                  >
                    <p
                      className={`${
                        isDark ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {isLoading
                        ? "Chargement..."
                        : `Aucun motif de rejet ${
                            selectedType === "prof"
                              ? "de professeur"
                              : "de classe"
                          } trouvé`}
                    </p>
                  </div>
                ) : (
                  motifs.map((motif) => (
                    <div
                      key={motif.id}
                      className={`p-4 rounded shadow-md ${
                        theme.cardBg
                      } border ${
                        isDark ? "border-gray-600" : "border-gray-200"
                      }`}
                    >
                      <div className="flex flex-col space-y-3">
                        {/* Code */}
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-medium uppercase tracking-wider ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Code
                          </span>
                          <span
                            className={`text-sm font-mono font-medium ${theme.text} mt-1`}
                          >
                            {motif.code}
                          </span>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-medium uppercase tracking-wider ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Description
                          </span>
                          <span className={`text-sm ${theme.text} mt-1`}>
                            {motif.descriptif}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-medium uppercase tracking-wider ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Date Création
                          </span>
                          <span className={`text-sm ${theme.text} mt-1`}>
                            {formatDate(motif.dateCreation)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <button
                            className={`flex items-center px-3 py-2 rounded text-sm font-medium transition-colors ${
                              isDark
                                ? "text-blue-400 hover:bg-gray-700"
                                : "text-blue-600 hover:bg-blue-50"
                            }`}
                            onClick={() => editMotif(motif)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Modifier
                          </button>
                          <button
                            className={`flex items-center px-3 py-2 rounded text-sm font-medium transition-colors ${
                              isDark
                                ? "text-red-400 hover:bg-gray-700"
                                : "text-red-600 hover:bg-red-50"
                            }`}
                            onClick={() => handleDeleteMotif(motif.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorsContent;
