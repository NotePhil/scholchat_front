import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Save,
  X,
  AlertCircle,
  Loader,
  School,
  Users,
  Calendar,
  FileText,
  Settings,
  CheckCircle,
  User,
} from "lucide-react";
import {
  classService,
  EtatClasse,
  DroitPublication,
} from "../../../../services/ClassService";
import { scholchatService } from "../../../../services/ScholchatService";

const ClassEditModal = ({
  classe,
  onClose,
  onSave = () => {},
  userRole = "professeur",
  loading: actionLoading,
}) => {
  const [classData, setClassData] = useState({
    id: "",
    nom: "",
    niveau: "",
    dateCreation: new Date().toISOString(),
    codeActivation: "",
    etat: EtatClasse.EN_ATTENTE_APPROBATION,
    etablissement: null,
    moderator: null, // This will store the moderator ID
    parents: [],
    eleves: [],
    droitPublication: DroitPublication.PARENTS_ET_MODERATEUR,
  });

  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [availableModerators, setAvailableModerators] = useState([]);
  const [availableEtablissements, setAvailableEtablissements] = useState([]);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (classe) {
      loadClassData();
      loadModerators();
      loadEtablissements();
    }
  }, [classe]);

  useEffect(() => {
    if (originalData) {
      const changes =
        JSON.stringify(classData) !== JSON.stringify(originalData);
      setHasChanges(changes);
    }
  }, [classData, originalData]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const data = await classService.obtenirClasseParId(classe.id);

      const completeData = {
        id: data.id,
        nom: data.nom || "",
        niveau: data.niveau || "",
        dateCreation: data.dateCreation || new Date().toISOString(),
        codeActivation: data.codeActivation || "",
        etat: data.etat || EtatClasse.EN_ATTENTE_APPROBATION,
        etablissement: data.etablissement || null,
        // Store only the moderator ID
        moderator: data.moderator?.id || null,
        parents: data.parents || [],
        eleves: data.eleves || [],
        droitPublication:
          data.droitPublication || DroitPublication.PARENTS_ET_MODERATEUR,
      };

      setClassData(completeData);
      setOriginalData(completeData);
      setError("");
    } catch (error) {
      console.error("Error loading class:", error);
      setError("Erreur lors du chargement de la classe");
    } finally {
      setLoading(false);
    }
  };

  const loadModerators = async () => {
    try {
      // Fetch actual professors from the backend
      const professors = await scholchatService.getAllProfessors();
      setAvailableModerators(professors);
    } catch (error) {
      console.error("Error loading moderators:", error);
      // Fallback to empty array
      setAvailableModerators([]);
    }
  };

  const loadEtablissements = async () => {
    try {
      // Fetch actual establishments from the backend
      const etablissements = await scholchatService.getAllEstablishments();
      setAvailableEtablissements(etablissements);
    } catch (error) {
      console.error("Error loading establishments:", error);
      // Fallback to empty array
      setAvailableEtablissements([]);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!classData.nom.trim()) {
      errors.nom = "Le nom de la classe est requis";
    } else if (classData.nom.length < 2) {
      errors.nom = "Le nom doit contenir au moins 2 caractères";
    }

    if (!classData.niveau.trim()) {
      errors.niveau = "Le niveau est requis";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setClassData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleModeratorChange = (moderatorId) => {
    // Only store the moderator ID
    handleInputChange("moderator", moderatorId || null);
  };

  const handleEtablissementChange = (etablissementId) => {
    const selectedEtablissement = availableEtablissements.find(
      (e) => e.id === etablissementId
    );
    handleInputChange("etablissement", selectedEtablissement || null);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Prepare the data to send to the backend
      const dataToSend = {
        ...classData,
        // Send only the ID for relationships
        etablissement: classData.etablissement
          ? { id: classData.etablissement.id }
          : null,
        // Send moderator as just the ID string (not an object)
        moderator: classData.moderator,
        parents: classData.parents.map((p) => ({ id: p.id })),
        eleves: classData.eleves.map((e) => ({ id: e.id })),
      };

      const savedClass = await classService.modifierClasse(
        classe.id,
        dataToSend
      );

      // Success message with refresh recommendation
      setSuccess(
        "Classe modifiée avec succès ! Veuillez rafraîchir la page pour voir les changements."
      );
      onSave(savedClass);

      // Optional: auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error saving class:", error);
      setError(error.message || "Erreur lors de l'enregistrement de la classe");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (
        window.confirm(
          "Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?"
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!classe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Modifier la Classe
                </h2>
                <p className="text-blue-100 text-sm">
                  Modification de {classData.nom || "classe"}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-8 flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700">{success}</p>
              </div>
            )}
            {/* Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Informations de base
                  </h3>
                </div>

                {/* Class Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la classe *
                  </label>
                  <input
                    type="text"
                    value={classData.nom}
                    onChange={(e) => handleInputChange("nom", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.nom
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Ex: 6ème A, CM2 B..."
                  />
                  {validationErrors.nom && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.nom}
                    </p>
                  )}
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau *
                  </label>
                  <select
                    value={classData.niveau}
                    onChange={(e) =>
                      handleInputChange("niveau", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.niveau
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Sélectionner un niveau</option>
                    <option value="CP">CP</option>
                    <option value="CE1">CE1</option>
                    <option value="CE2">CE2</option>
                    <option value="CM1">CM1</option>
                    <option value="CM2">CM2</option>
                    <option value="6ème">6ème</option>
                    <option value="5ème">5ème</option>
                    <option value="4ème">4ème</option>
                    <option value="3ème">3ème</option>
                    <option value="2nde">2nde</option>
                    <option value="1ère">1ère</option>
                    <option value="Terminale">Terminale</option>
                  </select>
                  {validationErrors.niveau && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.niveau}
                    </p>
                  )}
                </div>

                {/* Activation Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code d'activation
                  </label>
                  <input
                    type="text"
                    value={classData.codeActivation || ""}
                    onChange={(e) =>
                      handleInputChange("codeActivation", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Code d'activation"
                  />
                </div>

                {/* Establishment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Établissement
                  </label>
                  <select
                    value={classData.etablissement?.id || ""}
                    onChange={(e) => handleEtablissementChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un établissement</option>
                    {availableEtablissements.map((etab) => (
                      <option key={etab.id} value={etab.id}>
                        {etab.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Paramètres
                  </h3>
                </div>

                {/* Moderator */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modérateur
                  </label>
                  <select
                    value={classData.moderator || ""}
                    onChange={(e) => handleModeratorChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un modérateur</option>
                    {availableModerators.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.prenom} {mod.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Publication Rights */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Droits de publication
                  </label>
                  <select
                    value={classData.droitPublication}
                    onChange={(e) =>
                      handleInputChange("droitPublication", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={DroitPublication.TOUS}>
                      {classService.getDroitPublicationDisplayName(
                        DroitPublication.TOUS
                      )}
                    </option>
                    <option value={DroitPublication.PARENTS_ET_MODERATEUR}>
                      {classService.getDroitPublicationDisplayName(
                        DroitPublication.PARENTS_ET_MODERATEUR
                      )}
                    </option>
                    <option value={DroitPublication.MODERATEUR_SEULEMENT}>
                      {classService.getDroitPublicationDisplayName(
                        DroitPublication.MODERATEUR_SEULEMENT
                      )}
                    </option>
                  </select>
                </div>

                {/* Status (only for admin/establishment) */}
                {(userRole === "administrateur" ||
                  userRole === "etablissement") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      value={classData.etat}
                      onChange={(e) =>
                        handleInputChange("etat", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={EtatClasse.EN_ATTENTE_APPROBATION}>
                        {classService.getEtatDisplayName(
                          EtatClasse.EN_ATTENTE_APPROBATION
                        )}
                      </option>
                      <option value={EtatClasse.ACTIF}>
                        {classService.getEtatDisplayName(EtatClasse.ACTIF)}
                      </option>
                      <option value={EtatClasse.INACTIF}>
                        {classService.getEtatDisplayName(EtatClasse.INACTIF)}
                      </option>
                    </select>
                  </div>
                )}

                {/* Creation Date (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {new Date(classData.dateCreation).toLocaleDateString(
                        "fr-FR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                </div>

                {/* Current Statistics */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Statistiques actuelles
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Élèves</p>
                        <p className="font-semibold">
                          {classData.eleves?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Parents</p>
                        <p className="font-semibold">
                          {classData.parents?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges || actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassEditModal;
