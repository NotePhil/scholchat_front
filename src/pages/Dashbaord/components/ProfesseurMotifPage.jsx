import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { themes, colorSchemes } from "../Theme";

const ProfesseurMotifPage = ({ isDark = false, currentTheme = "blue" }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("motifs");
  const [motifs, setMotifs] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMotifForm, setShowMotifForm] = useState(false);
  const [currentMotif, setCurrentMotif] = useState({
    code: "",
    descriptif: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionCode, setRejectionCode] = useState("");
  const [additionalRemarks, setAdditionalRemarks] = useState("");

  // Theme variables
  const theme = isDark ? themes.dark : themes.light;
  const colors = colorSchemes[currentTheme];

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "admin") {
      navigate("/schoolchat/admin/dashboard");
    }
  }, [navigate]);

  // Fetch motifs
  useEffect(() => {
    const fetchMotifs = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8486/scholchat/motifsRejets"
        );
        setMotifs(response.data);
      } catch (err) {
        setError("Failed to fetch motifs");
        console.error("Error fetching motifs:", err);
      }
    };
    fetchMotifs();
  }, []);

  // Fetch professors
  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        setIsLoading(true);
        const allProfessorsResponse = await axios.get(
          "http://localhost:8486/scholchat/utilisateurs"
        );
        const professorsList = allProfessorsResponse.data.filter(
          (user) => user.role === "professor" || user.role === "repetiteur"
        );
        const pendingProfessorsResponse = await axios.get(
          "http://localhost:8486/scholchat/utilisateurs/professors/pending"
        );
        const allProfs = [...professorsList, ...pendingProfessorsResponse.data];
        const uniqueProfs = Array.from(
          new Map(allProfs.map((prof) => [prof.id, prof])).values()
        );
        setProfessors(uniqueProfs);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to fetch professors");
        console.error("Error fetching professors:", err);
        setIsLoading(false);
      }
    };
    fetchProfessors();
  }, []);

  // Form handlers (keep all your existing handler functions)
  const handleMotifSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.delete(
          `http://localhost:8486/scholchat/motifsRejets/${currentMotif.id}`
        );
      }
      const response = await axios.post(
        "http://localhost:8486/scholchat/motifsRejets",
        currentMotif
      );
      if (isEditing) {
        setMotifs(
          motifs.map((motif) =>
            motif.id === currentMotif.id ? response.data : motif
          )
        );
      } else {
        setMotifs([...motifs, response.data]);
      }
      resetMotifForm();
    } catch (err) {
      setError("Failed to save motif");
      console.error("Error saving motif:", err);
    }
  };

  const handleDeleteMotif = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this rejection reason?")
    ) {
      try {
        await axios.delete(
          `http://localhost:8486/scholchat/motifsRejets/${id}`
        );
        setMotifs(motifs.filter((motif) => motif.id !== id));
      } catch (err) {
        setError("Failed to delete motif");
        console.error("Error deleting motif:", err);
      }
    }
  };

  const handleValidateProfessor = async (professorId) => {
    try {
      await axios.post(
        `http://localhost:8486/scholchat/utilisateurs/professors/${professorId}/validate`
      );
      setProfessors(
        professors.map((prof) =>
          prof.id === professorId ? { ...prof, status: "VALIDATED" } : prof
        )
      );
    } catch (err) {
      setError("Failed to validate professor");
      console.error("Error validating professor:", err);
    }
  };

  const handleRejectProfessor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:8486/scholchat/utilisateurs/professeurs/${selectedProfessor.id}/rejet`,
        null,
        {
          params: {
            codeErreur: rejectionCode,
            motifSupplementaire: additionalRemarks,
          },
        }
      );
      setProfessors(
        professors.map((prof) =>
          prof.id === selectedProfessor.id
            ? { ...prof, status: "REJECTED" }
            : prof
        )
      );
      setShowRejectionForm(false);
      resetRejectionForm();
    } catch (err) {
      setError("Failed to reject professor");
      console.error("Error rejecting professor:", err);
    }
  };

  const resetMotifForm = () => {
    setCurrentMotif({ code: "", descriptif: "" });
    setShowMotifForm(false);
    setIsEditing(false);
  };

  const resetRejectionForm = () => {
    setSelectedProfessor(null);
    setRejectionCode("");
    setRejectionReason("");
    setAdditionalRemarks("");
  };

  const editMotif = (motif) => {
    setCurrentMotif({ ...motif });
    setIsEditing(true);
    setShowMotifForm(true);
  };

  const openRejectionForm = (professor) => {
    setSelectedProfessor(professor);
    setShowRejectionForm(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "REJECTED":
        return "text-red-500";
      case "VALIDATED":
        return "text-green-500";
      case "ACTIVE":
        return "text-blue-500";
      default:
        return "text-yellow-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "VALIDATED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "ACTIVE":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className={`flex-1 p-6 ${theme.background}`}>
      <div className="flex flex-col">
        <h1 className={`text-2xl font-bold ${theme.text} mb-6`}>
          Professeur et Motif
        </h1>

        {/* Tab navigation */}
        <div className={`flex border-b mb-6 ${theme.border}`}>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "motifs"
                ? `border-b-2 ${theme.text}`
                : isDark
                ? "text-gray-400"
                : "text-gray-500"
            }`}
            style={{
              borderColor:
                activeTab === "motifs" ? colors.primary : "transparent",
            }}
            onClick={() => setActiveTab("motifs")}
          >
            Motifs de Rejet
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "professors"
                ? `border-b-2 ${theme.text}`
                : isDark
                ? "text-gray-400"
                : "text-gray-500"
            }`}
            style={{
              borderColor:
                activeTab === "professors" ? colors.primary : "transparent",
            }}
            onClick={() => setActiveTab("professors")}
          >
            Professeurs
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Motifs de Rejet Tab Content */}
        {activeTab === "motifs" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${theme.text}`}>
                Motifs de Rejet
              </h2>
              <button
                className="flex items-center px-4 py-2 rounded"
                style={{ backgroundColor: colors.primary, color: "white" }}
                onClick={() => {
                  setCurrentMotif({ code: "", descriptif: "" });
                  setIsEditing(false);
                  setShowMotifForm(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Motif
              </button>
            </div>

            {showMotifForm && (
              <div className={`mb-6 p-4 rounded shadow-md ${theme.cardBg}`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>
                  {isEditing ? "Modifier Motif" : "Ajouter Motif"}
                </h3>
                <form onSubmit={handleMotifSubmit}>
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Code
                    </label>
                    <input
                      type="text"
                      className={`w-full p-2 border rounded ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      value={currentMotif.code}
                      onChange={(e) =>
                        setCurrentMotif({
                          ...currentMotif,
                          code: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Description
                    </label>
                    <textarea
                      className={`w-full p-2 border rounded ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      value={currentMotif.descriptif}
                      onChange={(e) =>
                        setCurrentMotif({
                          ...currentMotif,
                          descriptif: e.target.value,
                        })
                      }
                      rows="3"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded ${
                        isDark
                          ? "bg-gray-600 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                      onClick={resetMotifForm}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {isEditing ? "Mettre à jour" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div
              className={`rounded shadow-md overflow-hidden ${theme.cardBg}`}
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
                        Aucun motif de rejet trouvé
                      </td>
                    </tr>
                  ) : (
                    motifs.map((motif) => (
                      <tr key={motif.id}>
                        <td
                          className={`px-6 py-4 whitespace-nowrap ${theme.text}`}
                        >
                          {motif.code}
                        </td>
                        <td className={`px-6 py-4 ${theme.text}`}>
                          {motif.descriptif}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap ${theme.text}`}
                        >
                          {new Date(motif.dateCreation).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            onClick={() => editMotif(motif)}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteMotif(motif.id)}
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
          </div>
        )}

        {/* Professors Tab Content */}
        {activeTab === "professors" && (
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${theme.text}`}>
              Professeurs
            </h2>

            {isLoading ? (
              <div
                className={`flex justify-center items-center p-8 ${theme.text}`}
              >
                <div className="loader">Loading...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {professors.length === 0 ? (
                  <div
                    className={`col-span-full text-center p-8 ${theme.text}`}
                  >
                    Aucun professeur trouvé
                  </div>
                ) : (
                  professors.map((professor) => (
                    <div
                      key={professor.id}
                      className={`rounded-lg shadow-md overflow-hidden ${theme.cardBg}`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                              {professor.profileImage ? (
                                <img
                                  src={professor.profileImage}
                                  alt={`${professor.prenom} ${professor.nom}`}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span
                                  className={`text-xl font-bold ${
                                    isDark ? "text-gray-700" : "text-gray-500"
                                  }`}
                                >
                                  {professor.prenom?.[0] ||
                                    professor.nom?.[0] ||
                                    "P"}
                                </span>
                              )}
                            </div>
                            <div className="ml-3">
                              <h3 className={`font-medium ${theme.text}`}>
                                {professor.prenom} {professor.nom}
                              </h3>
                              <p
                                className={`text-sm ${
                                  isDark ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {professor.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {getStatusIcon(professor.status)}
                          </div>
                        </div>

                        <div
                          className={`text-sm mb-3 ${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          <p>
                            <span className="font-medium">Status:</span>{" "}
                            <span className={getStatusColor(professor.status)}>
                              {professor.status?.toUpperCase() || "PENDING"}
                            </span>
                          </p>
                          {professor.specialite && (
                            <p>
                              <span className="font-medium">Spécialité:</span>{" "}
                              {professor.specialite}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end mt-3">
                          {(!professor.status ||
                            professor.status.toUpperCase() === "PENDING") && (
                            <>
                              <button
                                className="flex items-center px-3 py-1 bg-green-500 text-white rounded mr-2 text-sm"
                                onClick={() =>
                                  handleValidateProfessor(professor.id)
                                }
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Valider
                              </button>
                              <button
                                className="flex items-center px-3 py-1 bg-red-500 text-white rounded text-sm"
                                onClick={() => openRejectionForm(professor)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeter
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {showRejectionForm && selectedProfessor && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div
                  className={`max-w-md w-full p-6 rounded-lg shadow-xl ${theme.cardBg}`}
                >
                  <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>
                    Rejeter la demande de {selectedProfessor.prenom}{" "}
                    {selectedProfessor.nom}
                  </h3>
                  <form onSubmit={handleRejectProfessor}>
                    <div className="mb-4">
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Motif de rejet
                      </label>
                      <select
                        className={`w-full p-2 border rounded ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                        value={rejectionCode}
                        onChange={(e) => {
                          setRejectionCode(e.target.value);
                          const selectedMotif = motifs.find(
                            (m) => m.code === e.target.value
                          );
                          setRejectionReason(
                            selectedMotif ? selectedMotif.descriptif : ""
                          );
                        }}
                        required
                      >
                        <option value="">Sélectionner un motif</option>
                        {motifs.map((motif) => (
                          <option key={motif.id} value={motif.code}>
                            {motif.code} - {motif.descriptif.substring(0, 30)}
                            ...
                          </option>
                        ))}
                      </select>
                    </div>

                    {rejectionReason && (
                      <div className="mb-4">
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Description du motif
                        </label>
                        <div
                          className={`p-2 border rounded ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-gray-100 border-gray-300 text-gray-700"
                          }`}
                        >
                          {rejectionReason}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Remarques supplémentaires (optionnel)
                      </label>
                      <textarea
                        className={`w-full p-2 border rounded ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                        value={additionalRemarks}
                        onChange={(e) => setAdditionalRemarks(e.target.value)}
                        rows="3"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        className={`px-4 py-2 rounded ${
                          isDark
                            ? "bg-gray-600 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                        onClick={() => setShowRejectionForm(false)}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-red-500 text-white"
                      >
                        Confirmer le rejet
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfesseurMotifPage;
