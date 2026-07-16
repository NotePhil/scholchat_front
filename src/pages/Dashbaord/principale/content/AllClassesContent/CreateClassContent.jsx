import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  GraduationCap,
  School,
  BookOpen,
  Key,
  User,
  CreditCard,
  Check,
} from "lucide-react";
import { classService, EtatClasse } from "../../../../../services/ClassService";
import establishmentService from "../../../../../services/EstablishmentService";
import { offerService, PeriodiciteContrat, TypeCibleOffre } from "../../../../../services/OfferService";
import { scholchatService } from "../../../../../services/ScholchatService";
import { useNavigate } from "react-router-dom";
import PublicationRightsService from "../../../../../services/PublicationRightsService";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useAuth } from "../../../../../hooks/useAuth";
import PaymentModal from "../../../../../components/modals/PaymentModal";

const CreateClassContent = ({
  onNavigateToClassesList,
  setActiveTab,
  isDark,
  currentTheme,
  themes,
  colorSchemes,
}) => {
  const { t } = useTranslation();
  const {
    user: currentUser,
    isProfessor,
    isGestionnaire,
  } = useAuth();

  const [formData, setFormData] = useState({
    nom: "",
    niveau: "",
    etablissement: "",
    codeUnique: "",
    accesMajeur: false,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);
  const [offres, setOffres] = useState([]);
  const [loadingOffres, setLoadingOffres] = useState(true);
  const [selectedOffreId, setSelectedOffreId] = useState("");
  const [periodicite, setPeriodicite] = useState(PeriodiciteContrat.MENSUEL);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [createdClassId, setCreatedClassId] = useState(null);

  const currentUserId = currentUser?.id ||
    localStorage.getItem("userId") || sessionStorage.getItem("userId");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingEstablishments(true);
        const establishmentsData = await establishmentService.getAllEstablishments();
        setEstablishments(establishmentsData || []);
      } catch (error) {
        console.error("Error loading data:", error);
        setEstablishments([]);
      } finally {
        setLoadingEstablishments(false);
      }
    };

    loadData();
  }, [currentUser]);

  useEffect(() => {
    const loadOffres = async () => {
      try {
        setLoadingOffres(true);
        const data = await offerService.obtenirOffresActives(TypeCibleOffre.CLASSE);
        setOffres(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading offres:", error);
        setOffres([]);
      } finally {
        setLoadingOffres(false);
      }
    };
    loadOffres();
  }, []);

  const selectedOffre = offres.find((o) => o.id === selectedOffreId) || null;
  const offreReduction = selectedOffre ? offerService.calculerReduction(selectedOffre) : null;
  const montantSelectionne = selectedOffre
    ? Number(periodicite === PeriodiciteContrat.ANNUEL ? selectedOffre.prixAnnuel : selectedOffre.prixMensuel) || 0
    : 0;

  const handleOffreChange = (e) => {
    const offreId = e.target.value;
    setSelectedOffreId(offreId);
    const offre = offres.find((o) => o.id === offreId);
    // Si l'offre choisie ne propose pas l'annuel, on retombe sur le mensuel.
    if (offre && periodicite === PeriodiciteContrat.ANNUEL && offre.prixAnnuel == null) {
      setPeriodicite(PeriodiciteContrat.MENSUEL);
    }
    if (errors.offre) {
      setErrors((prev) => ({ ...prev, offre: null }));
    }
  };

  const generateToken = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let token = "";
    for (let i = 0; i < 6; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
  };

  const handleManualRedirect = () => {
    if (setActiveTab) {
      setActiveTab("manage-class");
    } else if (onNavigateToClassesList) {
      onNavigateToClassesList();
    } else {
      navigate("/manage-class");
    }
  };

  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (success && countdown === 0) {
      handleManualRedirect();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success, countdown, setActiveTab, onNavigateToClassesList, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "accesMajeur") {
      setFormData((prev) => ({ ...prev, accesMajeur: e.target.checked }));
    } else if (name === "etablissement") {
      const establishment = establishments.find((etab) => etab.id === value);
      setSelectedEstablishment(establishment);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        codeUnique: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = t('classes.create.validation.nameRequired', "Le nom de la classe est requis");
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = t('classes.create.validation.nameLength', "Le nom doit contenir au moins 2 caractères");
    }

    if (!formData.niveau.trim()) {
      newErrors.niveau = t('classes.create.validation.levelRequired', "Le niveau est requis");
    }

    if (
      formData.etablissement &&
      selectedEstablishment?.optionTokenGeneral &&
      !formData.codeUnique.trim()
    ) {
      newErrors.codeUnique = t('classes.create.validation.codeRequired', "Le code unique de l'établissement est requis");
    }

    if (!formData.etablissement && !selectedOffreId) {
      newErrors.offre = t('classes.create.validation.offreRequired', "Veuillez sélectionner une offre pour votre classe");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const assignPublicationRightsToCreator = async (classId) => {
    if (!currentUserId) {
      console.error("Cannot assign publication rights: No user ID found");
      return false;
    }

    try {
      const response = await PublicationRightsService.assignPublicationRights(
        currentUserId,
        classId,
        true,
        true
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

  const createClass = async (paymentInfo = null) => {
    setLoading(true);
    try {
      let classData = {
        nom: formData.nom.trim(),
        niveau: formData.niveau.trim(),
      };

      classData.creatorId = currentUserId;
      classData.moderatorId = currentUserId;

      // Add accesMajeur flag
      classData.accesMajeur = formData.accesMajeur;

      // Add etablissementId if one is selected
      if (formData.etablissement) {
        classData.etablissementId = formData.etablissement;

        // Add codeUnique if establishment requires it (optionTokenGeneral)
        if (selectedEstablishment?.optionTokenGeneral && formData.codeUnique) {
          classData.codeUnique = formData.codeUnique;
        }
      } else if (paymentInfo) {
        // Add payment info for classes without establishment
        classData.paymentInfo = paymentInfo;
        classData.offreId = selectedOffreId;
        classData.periodicite = periodicite;
      }

      console.log("Creating class with data:", classData);
      const response = await classService.creerClasse(classData);
      console.log("Class created response:", response);
      
      // Extract class ID from response (it's nested in response.classe)
      const createdClassId = response.classe?.id || response.id;
      console.log("Extracted class ID:", createdClassId);
      setCreatedClassId(createdClassId);

      setSuccess(true);
      setCountdown(5);
    } catch (error) {
      console.error("Error creating class:", error);
      setErrors({
        submit: error.message || "Erreur lors de la création de la classe",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (formData.etablissement) {
      // Class with establishment
      await createClass();
    } else {
      // No establishment selected - show payment modal
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async (paymentInfo) => {
    setIsProcessingPayment(true);
    setShowPaymentModal(false);

    // paymentInfo est déjà au bon format ({ paymentMethod, amount, ... }) — voir PaymentModal partagé
    await createClass(paymentInfo);

    setIsProcessingPayment(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center py-20 p-4">
        <div
          className={`${
            isDark ? "bg-gray-800" : "bg-white"
          } rounded-2xl shadow-xl p-8 max-w-md w-full text-center`}
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            } mb-4`}
          >
            {t('classes.create.success.title', "Classe créée avec succès!")}
          </h2>
          <p className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-6`}>
            {formData.etablissement
              ? "Votre classe a ete creee et est en attente d'approbation."
              : "Votre classe a ete creee et approuvee automatiquement!"}
            {currentUserId && (
              <span className="block mt-2 text-sm text-green-600">
                Les droits de publication vous ont ete automatiquement attribues.
              </span>
            )}
            <span className="block mt-2">Redirection dans {countdown} seconde{countdown > 1 ? "s" : ""}...</span>
          </p>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            ></div>
          </div>

          <button
            onClick={handleManualRedirect}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 mb-4"
          >
            {t('classes.create.success.button', "Aller à la gestion des classes maintenant")}
          </button>

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="py-4 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <div
            className={`${
              isDark ? "bg-gray-800" : "bg-white"
            } rounded-2xl shadow-xl overflow-hidden`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {t('classes.create.title', "Créer une Classe")}
                  </h1>
                  <p className="text-blue-100">
                    {t('classes.create.header.subtitle', "Ajoutez une nouvelle classe à votre système")}
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
                        {t('classes.create.form.name', "Nom de la classe")} *
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
                          placeholder={t('classes.create.form.namePlaceholder', "Ex: Classe de 3ème A")}
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
                        {t('classes.create.form.level', "Niveau")} *
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
                          <option value="">{t('classes.create.form.select.level', "Sélectionner un niveau")}</option>
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
                          <option value="AUTRE">Autre</option>
                        </select>
                      </div>
                      {errors.niveau && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.niveau}
                        </p>
                      )}
                    </div>

                    {/* accesMajeur toggle */}
                    <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="accesMajeur"
                        name="accesMajeur"
                        checked={formData.accesMajeur}
                        onChange={handleInputChange}
                        className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="accesMajeur" className="text-sm text-purple-800 cursor-pointer">
                        <span className="font-semibold block">Classe Majeure</span>
                        <span className="text-purple-600">Les élèves rejoignent par recherche d'email</span>
                      </label>
                    </div>

                    {/* Code Unique Field */}
                    {formData.etablissement &&
                      selectedEstablishment?.optionTokenGeneral && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('classes.create.form.codeUnique', "Code Unique de l'établissement")} *
                          </label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              name="codeUnique"
                              value={formData.codeUnique}
                              onChange={handleInputChange}
                              className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                errors.codeUnique ? "border-red-500" : "border-gray-300"
                              }`}
                              placeholder="ABC123"
                            />
                          </div>
                          {errors.codeUnique && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.codeUnique}
                            </p>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Establishment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('classes.create.form.school', "Établissement (Optionnel)")}
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
                              ? t('classes.create.form.loading.establishments', "Chargement des établissements...")
                              : t('classes.create.form.select.noEstablishment', "Aucun établissement (Classe indépendante)")}
                          </option>
                          {establishments.map((establishment) => (
                            <option
                              key={establishment.id}
                              value={establishment.id}
                            >
                              {establishment.nom}
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

                    {/* Information Panel */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-700">
                          <p className="font-semibold mb-1">
                            {t('classes.create.form.info.title', "Information importante")}
                          </p>
                          <p>
                            {t('classes.create.form.info.required', "Les champs marqués d'un * sont obligatoires.")}
                            {selectedEstablishment?.optionEnvoiMailVersClasse && (
                              <span className="block mt-1">
                                {t('classes.create.form.info.email', "✉️ Cet établissement envoie des emails aux classes.")}
                              </span>
                            )}
                            {selectedEstablishment?.optionTokenGeneral && (
                              <span className="block mt-1">
                                {t('classes.create.form.info.token', "🔑 Un token général est requis pour cet établissement.")}
                              </span>
                            )}
                            {selectedEstablishment?.codeUnique && (
                              <span className="block mt-1">
                                {t('classes.create.form.info.code', "🎯 Un code unique est requis pour cet établissement.")}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Offre / Forfait (classe sans établissement) */}
                    {!formData.etablissement && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Offre / Forfait *
                          </label>
                          <select
                            value={selectedOffreId}
                            onChange={handleOffreChange}
                            disabled={loadingOffres}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 ${
                              errors.offre ? "border-red-500" : "border-gray-300"
                            }`}
                          >
                            <option value="">
                              {loadingOffres ? "Chargement des offres..." : "Choisir une offre..."}
                            </option>
                            {offres.map((offre) => {
                              const prix = offre.prixMensuel != null
                                ? `${Number(offre.prixMensuel).toLocaleString("fr-FR")} FCFA/mois`
                                : offre.prixAnnuel != null
                                ? `${Number(offre.prixAnnuel).toLocaleString("fr-FR")} FCFA/an`
                                : "";
                              return (
                                <option key={offre.id} value={offre.id}>
                                  {offre.nom}{offre.estTest ? " (TEST)" : ""}{prix ? ` — ${prix}` : ""}
                                </option>
                              );
                            })}
                          </select>
                          {errors.offre && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.offre}
                            </p>
                          )}
                        </div>

                        {selectedOffre && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Périodicité</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setPeriodicite(PeriodiciteContrat.MENSUEL)}
                                disabled={selectedOffre.prixMensuel == null}
                                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 ${
                                  periodicite === PeriodiciteContrat.MENSUEL
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                Mensuel{selectedOffre.prixMensuel != null ? ` - ${Number(selectedOffre.prixMensuel).toLocaleString("fr-FR")} FCFA` : ""}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPeriodicite(PeriodiciteContrat.ANNUEL)}
                                disabled={selectedOffre.prixAnnuel == null}
                                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 ${
                                  periodicite === PeriodiciteContrat.ANNUEL
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                Annuel{selectedOffre.prixAnnuel != null ? ` - ${Number(selectedOffre.prixAnnuel).toLocaleString("fr-FR")} FCFA` : ""}
                              </button>
                            </div>
                            {periodicite === PeriodiciteContrat.ANNUEL && offreReduction != null && offreReduction > 0 && (
                              <p className="mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                🎉 Réduction de {offreReduction > 1 ? Math.round(offreReduction) : Math.round(offreReduction * 100)}% pour l'offre annuelle !
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
                        loading ||
                        loadingEstablishments ||
                        isProcessingPayment
                      }
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                    >
                      {loading || isProcessingPayment ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : !formData.etablissement ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {loading || isProcessingPayment
                        ? t('classes.create.form.loading.processing', "Traitement en cours...")
                        : !formData.etablissement
                        ? `${t('classes.create.form.actions.proceed', "Procéder au paiement")} (${montantSelectionne.toLocaleString("fr-FR")} FCFA)`
                        : t('classes.create.form.actions.create', "Créer la classe")}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modale de paiement */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        montant={montantSelectionne}
        label={selectedOffre?.nom || "Création de classe"}
        subLabel={selectedOffre ? (periodicite === PeriodiciteContrat.ANNUEL ? "Périodicité annuelle" : "Périodicité mensuelle") : ""}
        isDark={isDark}
      />
    </>
  );
};

export default CreateClassContent;
