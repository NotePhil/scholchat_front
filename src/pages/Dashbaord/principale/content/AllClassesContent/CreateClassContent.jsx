import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  GraduationCap,
  School,
  BookOpen,
  Key,
  User,
} from "lucide-react";
import { classService, EtatClasse } from "../../../../../services/ClassService";
import establishmentService from "../../../../../services/EstablishmentService";
import { scholchatService } from "../../../../../services/ScholchatService";
import { useNavigate } from "react-router-dom";
import PublicationRightsService from "../../../../../services/PublicationRightsService";

const CreateClassContent = ({ onNavigateToClassesList, setActiveTab }) => {
  const [formData, setFormData] = useState({
    nom: "",
    niveau: "",
    etablissement: "",
    codeActivation: "",
    moderator: "", // Will store professor ID
  });
  const navigate = useNavigate();
  const [selectedProfessorName, setSelectedProfessorName] = useState(""); // For displaying selected professor name
  const [establishments, setEstablishments] = useState([]);
  const [professors, setProfessors] = useState([]); // Store professors list
  const [loading, setLoading] = useState(false);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);
  const [loadingProfessors, setLoadingProfessors] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5); // Add countdown state
  const [createdClassId, setCreatedClassId] = useState(null); // Store the ID of the created class

  // Get current user ID
  const currentUserId =
    localStorage.getItem("userId") || sessionStorage.getItem("userId");

  // Load establishments and professors on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingEstablishments(true);
        setLoadingProfessors(true);

        // Load establishments
        const establishmentsData =
          await establishmentService.getAllEstablishments();
        setEstablishments(establishmentsData || []);

        // Load professors
        const professorsData = await scholchatService.getAllProfessors();
        setProfessors(professorsData || []);
      } catch (error) {
        console.error("Error loading data:", error);
        setEstablishments([]);
        setProfessors([]);
      } finally {
        setLoadingEstablishments(false);
        setLoadingProfessors(false);
      }
    };

    loadData();
  }, []);

  // Generate random activation code
  const generateActivationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData((prev) => ({ ...prev, codeActivation: code }));
  };

  // Auto-generate code on component mount
  useEffect(() => {
    generateActivationCode();
  }, []);

  // Manual redirect function for the button
  const handleManualRedirect = () => {
    if (setActiveTab) {
      // If setActiveTab is available, use it to navigate to manage-class tab
      setActiveTab("manage-class");
    } else if (onNavigateToClassesList) {
      // Fallback to the original callback
      onNavigateToClassesList();
    } else {
      // Final fallback: navigate to manage-class route
      navigate("/manage-class");
    }
  };

  // Success countdown and redirect effect
  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (success && countdown === 0) {
      // Redirect when countdown reaches 0
      handleManualRedirect();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success, countdown, setActiveTab, onNavigateToClassesList, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "moderator") {
      // Find the selected professor to get both ID and name
      const selectedProfessor = professors.find((prof) => prof.id === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value, // Store the ID
      }));
      setSelectedProfessorName(
        selectedProfessor
          ? `${selectedProfessor.nom} ${selectedProfessor.prenom}`
          : ""
      );
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom de la classe est requis";
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.niveau.trim()) {
      newErrors.niveau = "Le niveau est requis";
    }

    if (!formData.codeActivation.trim()) {
      newErrors.codeActivation = "Le code d'activation est requis";
    } else if (formData.codeActivation.length !== 6) {
      newErrors.codeActivation =
        "Le code d'activation doit contenir 6 chiffres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to assign publication rights to the creator
  const assignPublicationRightsToCreator = async (classId) => {
    if (!currentUserId) {
      console.error("Cannot assign publication rights: No user ID found");
      return false;
    }

    try {
      console.log(
        `Assigning publication rights to user ${currentUserId} for class ${classId}`
      );

      const response = await PublicationRightsService.assignPublicationRights(
        currentUserId,
        classId,
        true, // peutPublier
        true // peutModerer
      );

      if (response.success) {
        console.log("Publication rights assigned successfully");
        return true;
      } else {
        console.error("Failed to assign publication rights:", response.error);
        return false;
      }
    } catch (error) {
      console.error("Error assigning publication rights:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data for submission
      const classData = {
        nom: formData.nom.trim(),
        niveau: formData.niveau.trim(),
        dateCreation: new Date().toISOString(),
        codeActivation: formData.codeActivation.trim(),
        etat: EtatClasse.EN_ATTENTE_APPROBATION,
        ...(formData.etablissement && {
          etablissement: { id: formData.etablissement },
        }),
        ...(formData.moderator && {
          moderator: { id: formData.moderator }, // Send as object with id
        }),
        parents: [],
        eleves: [],
      };

      // Create the class
      const createdClass = await classService.creerClasse(classData);
      setCreatedClassId(createdClass.id);

      // Automatically assign publication rights to the creator
      if (currentUserId) {
        const rightsAssigned = await assignPublicationRightsToCreator(
          createdClass.id
        );

        if (!rightsAssigned) {
          console.warn(
            "Class created but publication rights assignment failed"
          );
          // We still consider this a success since the class was created
        }
      }

      setSuccess(true);
      setCountdown(5); // Reset countdown to 5 seconds
    } catch (error) {
      console.error("Error creating class:", error);
      setErrors({
        submit: error.message || "Erreur lors de la création de la classe",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Classe créée avec succès!
          </h2>
          <p className="text-gray-600 mb-6">
            Votre classe a été créée et est en attente d'approbation.
            {currentUserId && (
              <span className="block mt-2 text-sm text-green-600">
                Les droits de publication vous ont été automatiquement
                attribués.
              </span>
            )}
            Redirection automatique vers la gestion des classes dans {countdown}{" "}
            seconde
            {countdown !== 1 ? "s" : ""}.
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            ></div>
          </div>

          {/* Manual redirect button */}
          <button
            onClick={handleManualRedirect}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 mb-4"
          >
            Aller à la gestion des classes maintenant
          </button>

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Créer une Classe
                </h1>
                <p className="text-blue-100">
                  Ajoutez une nouvelle classe à votre système
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Class Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la classe *
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.nom ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Ex: Classe de 3ème A"
                      />
                    </div>
                    {errors.nom && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.nom}
                      </p>
                    )}
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau *
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="niveau"
                        value={formData.niveau}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.niveau ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="">Sélectionner un niveau</option>
                        <option value="CP">CP (Cours Préparatoire)</option>
                        <option value="CE1">CE1 (Cours Élémentaire 1)</option>
                        <option value="CE2">CE2 (Cours Élémentaire 2)</option>
                        <option value="CM1">CM1 (Cours Moyen 1)</option>
                        <option value="CM2">CM2 (Cours Moyen 2)</option>
                        <option value="6ème">6ème</option>
                        <option value="5ème">5ème</option>
                        <option value="4ème">4ème</option>
                        <option value="3ème">3ème</option>
                        <option value="2nde">2nde (Seconde)</option>
                        <option value="1ère">1ère (Première)</option>
                        <option value="Terminale">Terminale</option>
                      </select>
                    </div>
                    {errors.niveau && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.niveau}
                      </p>
                    )}
                  </div>

                  {/* Activation Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code d'activation *
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="codeActivation"
                        value={formData.codeActivation}
                        onChange={handleInputChange}
                        maxLength="6"
                        className={`w-full pl-12 pr-20 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.codeActivation
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="123456"
                      />
                      <button
                        type="button"
                        onClick={generateActivationCode}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        Générer
                      </button>
                    </div>
                    {errors.codeActivation && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.codeActivation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Establishment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Établissement (Optionnel)
                    </label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="etablissement"
                        value={formData.etablissement}
                        onChange={handleInputChange}
                        disabled={loadingEstablishments}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {loadingEstablishments
                            ? "Chargement des établissements..."
                            : "Aucun établissement (Optionnel)"}
                        </option>
                        {establishments.map((establishment) => (
                          <option
                            key={establishment.id}
                            value={establishment.id}
                          >
                            {establishment.nom} - {establishment.localisation}
                          </option>
                        ))}
                      </select>
                    </div>
                    {loadingEstablishments && (
                      <p className="mt-1 text-sm text-gray-500">
                        Chargement des établissements disponibles...
                      </p>
                    )}
                  </div>

                  {/* Moderator (Professor) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modérateur (Optionnel)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="moderator"
                        value={formData.moderator}
                        onChange={handleInputChange}
                        disabled={loadingProfessors}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {loadingProfessors
                            ? "Chargement des professeurs..."
                            : "Aucun modérateur (Optionnel)"}
                        </option>
                        {professors.map((professor) => (
                          <option key={professor.id} value={professor.id}>
                            {professor.nom} {professor.prenom}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.moderator && (
                      <p className="mt-1 text-xs text-gray-500">
                        Sélectionné: {selectedProfessorName}
                      </p>
                    )}
                  </div>

                  {/* Information Panel */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">
                          Information importante
                        </p>
                        <ul className="space-y-1 text-blue-700">
                          <li>
                            • La classe sera créée avec le statut "En attente
                            d'approbation"
                          </li>
                          <li>
                            • Le code d'activation permet aux utilisateurs de
                            rejoindre la classe
                          </li>
                          <li>
                            • Vous pourrez ajouter des parents et élèves après
                            la création
                          </li>
                          <li>
                            • Vous recevrez automatiquement les droits de
                            publication pour cette classe
                          </li>
                          <li>• Les champs marqués avec * sont obligatoires</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message and Submit Button */}
              <div className="mt-8">
                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-700">{errors.submit}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      loading || loadingEstablishments || loadingProfessors
                    }
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {loading ? "Création en cours..." : "Créer la classe"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClassContent;
