import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import CountrySelect from "../../../../../components/common/CountrySelectSearchable";
import establishmentService from "../../../../../services/EstablishmentService";
import gestionnaireService from "../../../../../services/GestionnaireService";
import {
  offerService,
  PeriodiciteContrat,
  TypeCibleOffre,
} from "../../../../../services/OfferService";
import { useNavigate } from "react-router-dom";
import PaymentModal from "../../../../../components/modals/PaymentModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faChevronDown,
  faCircleCheck,
  faCircleExclamation,
  faEnvelope,
  faGear,
  faGlobe,
  faLocationDot,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
const CreateEstablishmentContent = ({
  onNavigateToManage,
  setActiveTab,
  editingEstablishment = null,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    localisation: "",
    pays: "",
    email: "",
    telephone: "",
    optionEnvoiMailNewClasse: false,
    optionTokenGeneral: false,
    gestionnaire: null,
  });
  const isEditMode = !!editingEstablishment;
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("CM");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [offres, setOffres] = useState([]);
  const [loadingOffres, setLoadingOffres] = useState(true);
  const [selectedOffreId, setSelectedOffreId] = useState("");
  const [periodicite, setPeriodicite] = useState(PeriodiciteContrat.MENSUEL);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load users on component mount and populate form if editing
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const usersData = await gestionnaireService.getAllGestionnaires();
        setUsers(usersData);

        // If editing, populate form with existing data
        if (editingEstablishment) {
          setFormData({
            nom: editingEstablishment.nom || "",
            localisation: editingEstablishment.localisation || "",
            pays: editingEstablishment.pays || "",
            email: editingEstablishment.email || "",
            telephone: editingEstablishment.telephone || "",
            optionEnvoiMailNewClasse:
              editingEstablishment.optionEnvoiMailNewClasse || false,
            optionTokenGeneral:
              editingEstablishment.optionTokenGeneral || false,
            gestionnaire: null, // Will be loaded separately
          });

          // Load gestionnaire data
          try {
            const gestionnaireData =
              await establishmentService.getEstablishmentGestionnaire(
                editingEstablishment.id,
              );
            setFormData((prev) => ({
              ...prev,
              gestionnaire: gestionnaireData,
            }));
          } catch (error) {
            console.error("Error loading gestionnaire:", error);
          }
        }
        // Pre-fill gestionnaire and email for gestionnaire role (not editing)
        if (!editingEstablishment) {
          const selectedRole = (
            localStorage.getItem("userRole") || ""
          ).toUpperCase();
          if (selectedRole.includes("GESTIONNAIRE")) {
            const userId = localStorage.getItem("userId");
            const userEmail = localStorage.getItem("userEmail") || "";
            const userName =
              localStorage.getItem("userName") ||
              localStorage.getItem("username") ||
              "";
            // Find current user in gestionnaires list
            const currentUser = (usersData || []).find((u) => u.id === userId);
            if (currentUser) {
              setFormData((prev) => ({
                ...prev,
                email: currentUser.email || userEmail,
                gestionnaire: currentUser,
              }));
            } else {
              // Fallback: create a basic user object
              setFormData((prev) => ({
                ...prev,
                email: userEmail,
                gestionnaire: {
                  id: userId,
                  nom: userName.split(" ")[1] || "",
                  prenom: userName.split(" ")[0] || "",
                  email: userEmail,
                },
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error loading users:", error);
        setErrors({
          users: "Erreur lors du chargement des utilisateurs",
        });
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [editingEstablishment]);
  useEffect(() => {
    const loadOffres = async () => {
      try {
        setLoadingOffres(true);
        const data = await offerService.obtenirOffresActives(
          TypeCibleOffre.ETABLISSEMENT,
        );
        setOffres(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading offres etablissement:", error);
        setOffres([]);
      } finally {
        setLoadingOffres(false);
      }
    };
    loadOffres();
  }, []);
  const selectedOffre = offres.find((o) => o.id === selectedOffreId) || null;
  const offreReduction = selectedOffre
    ? offerService.calculerReduction(selectedOffre)
    : null;
  const montantSelectionne = selectedOffre
    ? Number(
        periodicite === PeriodiciteContrat.ANNUEL
          ? selectedOffre.prixAnnuel
          : selectedOffre.prixMensuel,
      ) || 0
    : 0;
  const handleOffreChange = (e) => {
    const offreId = e.target.value;
    setSelectedOffreId(offreId);
    const offre = offres.find((o) => o.id === offreId);
    if (
      offre &&
      periodicite === PeriodiciteContrat.ANNUEL &&
      offre.prixAnnuel == null
    ) {
      setPeriodicite(PeriodiciteContrat.MENSUEL);
    }
    if (errors.offre) {
      setErrors((prev) => ({
        ...prev,
        offre: null,
      }));
    }
  };

  // Manual redirect function for the button
  const handleManualRedirect = () => {
    if (setActiveTab) {
      // If setActiveTab is available, use it to navigate to manage-establishment tab
      setActiveTab("manage-establishment");
    } else if (onNavigateToManage) {
      // Fallback to the original callback
      onNavigateToManage();
    } else {
      // Final fallback: navigate to manage-establishment route
      navigate("/manage-establishment");
    }
  };

  // Success countdown and redirect effect
  React.useEffect(() => {
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
  }, [success, countdown, setActiveTab, onNavigateToManage, navigate]);
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };
  const handleUserSelect = (user) => {
    setFormData((prev) => ({
      ...prev,
      gestionnaire: user,
    }));
    setShowUserDropdown(false);
    if (errors.gestionnaire) {
      setErrors((prev) => ({
        ...prev,
        gestionnaire: null,
      }));
    }
  };
  const handlePhoneChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      telephone: value || "",
    }));
    if (value) {
      if (value.startsWith("+237")) {
        setSelectedCountry("CM");
      } else if (value.startsWith("+33")) {
        setSelectedCountry("FR");
      }
    }
    if (errors.telephone) {
      setErrors((prev) => ({
        ...prev,
        telephone: null,
      }));
    }
  };
  const validateForm = () => {
    const validation = establishmentService.validateEstablishment(formData);
    const newErrors = {};
    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        if (error.includes("Name")) newErrors.nom = error;
        if (error.includes("email")) newErrors.email = error;
        if (error.includes("phone")) newErrors.telephone = error;
      });
    }
    if (!formData.localisation.trim()) {
      newErrors.localisation = "La localisation est requise";
    }
    if (!formData.pays.trim()) {
      newErrors.pays = "Le pays est requis";
    }
    if (!formData.gestionnaire) {
      newErrors.gestionnaire = "Un gestionnaire est requis";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const buildEstablishmentData = () => ({
    nom: formData.nom,
    localisation: formData.localisation,
    pays: formData.pays,
    email: formData.email,
    telephone: formData.telephone,
    optionEnvoiMailNewClasse: formData.optionEnvoiMailNewClasse,
    optionTokenGeneral: formData.optionTokenGeneral,
    gestionnaire: {
      type: formData.gestionnaire.type,
      id: formData.gestionnaire.id,
    },
  });
  const submitEstablishment = async (establishmentData) => {
    setLoading(true);
    try {
      if (isEditMode) {
        await establishmentService.updateEstablishment(
          editingEstablishment.id,
          establishmentData,
        );
      } else {
        await establishmentService.createEstablishment(establishmentData);
      }
      setSuccess(true);
      setCountdown(5);
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} establishment:`,
        error,
      );
      setErrors({
        submit: `Erreur lors de ${isEditMode ? "la modification" : "la création"} de l'établissement`,
      });
      setShowPaymentModal(false);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Un forfait est sélectionné : on passe par l'étape de paiement (simulé) avant de créer
    // l'établissement, comme pour la création de classe.
    if (!isEditMode && selectedOffreId) {
      setShowPaymentModal(true);
      return;
    }
    await submitEstablishment(buildEstablishmentData());
  };
  const handlePaymentSuccess = async (paymentInfo) => {
    setShowPaymentModal(false);
    const establishmentData = buildEstablishmentData();
    establishmentData.offreId = selectedOffreId;
    establishmentData.periodicite = periodicite;
    establishmentData.paymentInfo = paymentInfo;
    await submitEstablishment(establishmentData);
  };
  if (success) {
    return (
      <div className="flex items-center justify-center py-20 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="w-10 h-10 text-green-600"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Établissement {isEditMode ? "modifié" : "créé"} avec succès!
          </h2>
          <p className="text-gray-600 mb-6">
            Votre établissement a été {isEditMode ? "modifié" : "créé"} avec
            succès. Redirection automatique vers la gestion des établissements
            dans {countdown} seconde
            {countdown !== 1 ? "s" : ""}.
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${((5 - countdown) / 5) * 100}%`,
              }}
            ></div>
          </div>

          {/* Manual redirect button */}
          <button
            onClick={handleManualRedirect}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 mb-4"
          >
            Aller à la gestion des établissements maintenant
          </button>

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-8 py-5 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon
                  icon={faBuilding}
                  className="w-6 h-6 text-white"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {isEditMode
                    ? "Modifier l'Établissement"
                    : "Créer un Établissement"}
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  {isEditMode
                    ? "Modifiez les informations de l'établissement"
                    : "Ajoutez un nouvel établissement à votre système"}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-4 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Informations Générales
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'établissement *
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    />
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.nom ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Nom de l'établissement"
                    />
                  </div>
                  {errors.nom && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="w-4 h-4"
                      />
                      {errors.nom}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localisation *
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    />
                    <input
                      type="text"
                      name="localisation"
                      value={formData.localisation}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.localisation ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Adresse ou localisation"
                    />
                  </div>
                  {errors.localisation && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="w-4 h-4"
                      />
                      {errors.localisation}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays *
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faGlobe}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    />
                    <input
                      type="text"
                      name="pays"
                      value={formData.pays}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.pays ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Pays"
                    />
                  </div>
                  {errors.pays && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="w-4 h-4"
                      />
                      {errors.pays}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact & Options */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Contact & Options
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.email ? "border-red-500" : "border-gray-300"}`}
                      placeholder="contact@etablissement.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="w-4 h-4"
                      />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div
                    className={`relative phone-input-container ${errors.telephone ? "border-red-500" : "border-gray-300"}`}
                  >
                    <PhoneInput
                      defaultCountry={selectedCountry}
                      value={formData.telephone}
                      onChange={handlePhoneChange}
                      countrySelectComponent={CountrySelect}
                      placeholder="Entrez le numéro de téléphone"
                      international
                      countryCallingCodeEditable={false}
                      className="w-full"
                    />
                  </div>
                  {errors.telephone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="w-4 h-4"
                      />
                      {errors.telephone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gestionnaire *
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className={`w-full pl-12 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left ${errors.gestionnaire ? "border-red-500" : "border-gray-300"}`}
                    >
                      {formData.gestionnaire
                        ? `${formData.gestionnaire.nom} ${formData.gestionnaire.prenom} (${formData.gestionnaire.email}) - ${formData.gestionnaire.type || "N/A"}`
                        : "Sélectionner un gestionnaire"}
                    </button>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    />

                    {showUserDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-gray-500">
                            Chargement des utilisateurs...
                          </div>
                        ) : users.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            Aucun utilisateur disponible
                          </div>
                        ) : (
                          users.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleUserSelect(user)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {user.nom} {user.prenom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                {user.type || "Type non défini"}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {errors.gestionnaire && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="w-4 h-4"
                      />
                      {errors.gestionnaire}
                    </p>
                  )}
                  {errors.users && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="w-4 h-4"
                      />
                      {errors.users}
                    </p>
                  )}
                </div>

                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faGear}
                      className="w-5 h-5 text-gray-600"
                    />
                    <h4 className="font-medium text-gray-900">
                      Options de Configuration
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="optionEnvoiMailNewClasse"
                        checked={formData.optionEnvoiMailNewClasse}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Validation nouvelle classe
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="optionTokenGeneral"
                        checked={formData.optionTokenGeneral}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Code unique</span>
                    </label>
                  </div>
                </div>

                {!isEditMode && (
                  <div className="space-y-4 bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Offre / Forfait (optionnel)
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Choisissez un forfait pour définir le quota de classes
                        et la durée de vie de votre établissement. Sans forfait,
                        l'établissement est créé sans restriction ; un
                        administrateur pourra vous en associer un plus tard.
                      </p>
                      <select
                        value={selectedOffreId}
                        onChange={handleOffreChange}
                        disabled={loadingOffres}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      >
                        <option value="">
                          {loadingOffres
                            ? "Chargement des offres..."
                            : "Aucun forfait pour le moment"}
                        </option>
                        {offres.map((offre) => (
                          <option key={offre.id} value={offre.id}>
                            {offre.nom}
                            {offre.nombreClassesInclues != null
                              ? ` - ${offre.nombreClassesInclues}${offre.classesBonus ? `+${offre.classesBonus}` : ""} classes`
                              : ""}
                            {offre.estTest ? " (TEST)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedOffre && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Périodicité
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPeriodicite(PeriodiciteContrat.MENSUEL)
                              }
                              disabled={selectedOffre.prixMensuel == null}
                              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 ${periodicite === PeriodiciteContrat.MENSUEL ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                            >
                              Mensuel
                              {selectedOffre.prixMensuel != null
                                ? ` - ${Number(selectedOffre.prixMensuel).toLocaleString("fr-FR")} FCFA`
                                : ""}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPeriodicite(PeriodiciteContrat.ANNUEL)
                              }
                              disabled={selectedOffre.prixAnnuel == null}
                              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 ${periodicite === PeriodiciteContrat.ANNUEL ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                            >
                              Annuel
                              {selectedOffre.prixAnnuel != null
                                ? ` - ${Number(selectedOffre.prixAnnuel).toLocaleString("fr-FR")} FCFA`
                                : ""}
                            </button>
                          </div>
                          {periodicite === PeriodiciteContrat.ANNUEL &&
                            offreReduction != null &&
                            offreReduction > 0 && (
                              <p className="mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                🎉 Réduction de{" "}
                                {Math.round(offreReduction * 100)}% en optant
                                pour l'annuel !
                              </p>
                            )}
                        </div>

                        <p className="text-xs text-amber-700 border-t border-amber-200 pt-3">
                          💳 Le paiement (
                          {montantSelectionne.toLocaleString("fr-FR")} FCFA,
                          simulé) vous sera demandé à l'étape suivante, après
                          validation du formulaire.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className="w-5 h-5 text-red-600"
                  />
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleManualRedirect}
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Annuler
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {loading
                  ? `${isEditMode ? "Modification" : "Création"} en cours...`
                  : !isEditMode && selectedOffreId
                    ? "Continuer vers le paiement"
                    : `${isEditMode ? "Modifier les informations" : "Créer l'établissement"}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        montant={montantSelectionne}
        label={selectedOffre?.nom || "Souscription établissement"}
        subLabel={
          periodicite === PeriodiciteContrat.ANNUEL
            ? "Périodicité annuelle"
            : "Périodicité mensuelle"
        }
      />
    </div>
  );
};
export default CreateEstablishmentContent;
