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
  Lock,
  Shield,
  Check,
  X,
  Loader,
  Smartphone,
} from "lucide-react";
import { classService, EtatClasse } from "../../../../../services/ClassService";
import establishmentService from "../../../../../services/EstablishmentService";
import { scholchatService } from "../../../../../services/ScholchatService";
import { useNavigate } from "react-router-dom";
import PublicationRightsService from "../../../../../services/PublicationRightsService";

// Composant de modale de paiement
const PaymentModal = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  classData,
  isLoading,
}) => {
  const [paymentStep, setPaymentStep] = useState(1); // 1: Choix méthode, 2: Formulaire, 3: Processing, 4: Success
  const [paymentMethod, setPaymentMethod] = useState(""); // "orange", "mtn", "card"
  const [paymentData, setPaymentData] = useState({
    phone: "",
    operator: "",
  });
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [paymentErrors, setPaymentErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setPaymentStep(1);
      setPaymentMethod("");
      setPaymentData({ phone: "", operator: "" });
      setCardData({ number: "", expiry: "", cvv: "", name: "" });
      setPaymentErrors({});
    }
  }, [isOpen]);

  const validateMobilePayment = () => {
    const errors = {};

    if (!paymentData.phone.trim()) {
      errors.phone = "Le numéro de téléphone est requis";
    } else if (!paymentData.phone.match(/^(6|7)\d{7}$/)) {
      errors.phone =
        "Numéro de téléphone invalide (8 chiffres, commence par 6 ou 7)";
    }

    if (!paymentData.operator) {
      errors.operator = "Veuillez sélectionner un opérateur";
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCard = () => {
    const errors = {};

    if (
      !cardData.number.trim() ||
      cardData.number.replace(/\s/g, "").length !== 16
    ) {
      errors.number = "Numéro de carte invalide (16 chiffres requis)";
    }

    if (!cardData.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      errors.expiry = "Format invalide (MM/AA)";
    }

    if (!cardData.cvv.match(/^\d{3}$/)) {
      errors.cvv = "CVV invalide (3 chiffres requis)";
    }

    if (!cardData.name.trim() || cardData.name.length < 2) {
      errors.name = "Nom complet requis";
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    let isValid = false;

    if (paymentMethod === "orange" || paymentMethod === "mtn") {
      isValid = validateMobilePayment();
    } else if (paymentMethod === "card") {
      isValid = validateCard();
    }

    if (!isValid) return;

    setPaymentStep(3); // Processing

    // Simulation du traitement de paiement
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setPaymentStep(4); // Success

    await new Promise((resolve) => setTimeout(resolve, 1000));
    onPaymentSuccess();
  };

  const handlePhoneInputChange = (value) => {
    // Nettoyer et formater le numéro
    const cleaned = value.replace(/\D/g, "").slice(0, 8);
    setPaymentData((prev) => ({ ...prev, phone: cleaned }));

    if (paymentErrors.phone) {
      setPaymentErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  const handleCardInputChange = (field, value) => {
    let formattedValue = value;

    switch (field) {
      case "number":
        formattedValue = value
          .replace(/\s/g, "")
          .replace(/(\d{4})/g, "$1 ")
          .trim()
          .slice(0, 19);
        break;
      case "expiry":
        formattedValue = value
          .replace(/\D/g, "")
          .replace(/(\d{2})(\d)/, "$1/$2")
          .slice(0, 5);
        break;
      case "cvv":
        formattedValue = value.replace(/\D/g, "").slice(0, 3);
        break;
      default:
        break;
    }

    setCardData((prev) => ({ ...prev, [field]: formattedValue }));

    if (paymentErrors[field]) {
      setPaymentErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-white" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Paiement Sécurisé
                </h3>
                <p className="text-orange-100 text-sm">
                  Création de classe premium
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Résumé de la commande */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              Résumé de la commande
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Création de classe premium
                </span>
                <span className="font-medium">6.500 FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frais de service</span>
                <span className="font-medium">500 FCFA</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-orange-600">5000.000 FCFA</span>
              </div>
            </div>
          </div>

          {/* Étapes de paiement */}
          {paymentStep === 1 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">
                Choisissez votre méthode de paiement
              </h4>

              {/* Orange Money */}
              <button
                onClick={() => {
                  setPaymentMethod("orange");
                  setPaymentStep(2);
                  setPaymentData((prev) => ({ ...prev, operator: "orange" }));
                }}
                className="w-full p-4 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Orange Money
                    </div>
                    <div className="text-sm text-gray-600">
                      Paiement par mobile
                    </div>
                  </div>
                </div>
              </button>

              {/* MTN Mobile Money */}
              <button
                onClick={() => {
                  setPaymentMethod("mtn");
                  setPaymentStep(2);
                  setPaymentData((prev) => ({ ...prev, operator: "mtn" }));
                }}
                className="w-full p-4 border-2 border-yellow-500 rounded-lg hover:bg-yellow-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      MTN Mobile Money
                    </div>
                    <div className="text-sm text-gray-600">
                      Paiement par mobile
                    </div>
                  </div>
                </div>
              </button>

              {/* Carte bancaire */}
              <button
                onClick={() => {
                  setPaymentMethod("card");
                  setPaymentStep(2);
                }}
                className="w-full p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Carte bancaire
                    </div>
                    <div className="text-sm text-gray-600">
                      Visa, Mastercard
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {paymentStep === 2 && (
            <form onSubmit={handlePaymentSubmit}>
              {paymentMethod === "orange" || paymentMethod === "mtn" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de téléphone{" "}
                      {paymentMethod === "orange" ? "Orange" : "MTN"} *
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={paymentData.phone}
                        onChange={(e) => handlePhoneInputChange(e.target.value)}
                        placeholder="6X XX XX XX ou 7X XX XX XX"
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          paymentErrors.phone
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    {paymentErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {paymentErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      💡 Vous recevrez une demande de confirmation sur votre
                      mobile pour valider le paiement de 5000.000 FCFA.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Numéro de carte */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de carte
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={(e) =>
                          handleCardInputChange("number", e.target.value)
                        }
                        placeholder="1234 5678 9012 3456"
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          paymentErrors.number
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    {paymentErrors.number && (
                      <p className="mt-1 text-sm text-red-600">
                        {paymentErrors.number}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Date d'expiration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiration
                      </label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) =>
                          handleCardInputChange("expiry", e.target.value)
                        }
                        placeholder="MM/AA"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          paymentErrors.expiry
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {paymentErrors.expiry && (
                        <p className="mt-1 text-sm text-red-600">
                          {paymentErrors.expiry}
                        </p>
                      )}
                    </div>

                    {/* CVV */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardData.cvv}
                        onChange={(e) =>
                          handleCardInputChange("cvv", e.target.value)
                        }
                        placeholder="123"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          paymentErrors.cvv
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {paymentErrors.cvv && (
                        <p className="mt-1 text-sm text-red-600">
                          {paymentErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nom sur la carte */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom sur la carte
                    </label>
                    <input
                      type="text"
                      value={cardData.name}
                      onChange={(e) =>
                        handleCardInputChange("name", e.target.value)
                      }
                      placeholder="JEAN DUPONT"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                        paymentErrors.name
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {paymentErrors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {paymentErrors.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sécurité */}
              <div className="flex items-center gap-2 mt-6 p-3 bg-blue-50 rounded-lg">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Paiement sécurisé par SSL - Vos données sont cryptées
                </span>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setPaymentStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Payer 5000.000 FCFA
                </button>
              </div>
            </form>
          )}

          {paymentStep === 3 && (
            <div className="text-center py-8">
              <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">
                Traitement du paiement
              </h4>
              <p className="text-gray-600">
                {paymentMethod === "orange" || paymentMethod === "mtn"
                  ? "Validation en cours via mobile money..."
                  : "Vérification de la carte en cours..."}
              </p>
            </div>
          )}

          {paymentStep === 4 && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">
                Paiement accepté !
              </h4>
              <p className="text-gray-600">
                Votre classe va être créée et approuvée automatiquement...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateClassContent = ({ onNavigateToClassesList, setActiveTab, isDark, currentTheme, themes, colorSchemes }) => {
  const [formData, setFormData] = useState({
    nom: "",
    niveau: "",
    etablissement: "",
    etablissementToken: "",
    moderator: "",
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const navigate = useNavigate();
  const [selectedProfessorName, setSelectedProfessorName] = useState("");
  const [establishments, setEstablishments] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);
  const [loadingProfessors, setLoadingProfessors] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [createdClassId, setCreatedClassId] = useState(null);

  const currentUserId =
    localStorage.getItem("userId") || sessionStorage.getItem("userId");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingEstablishments(true);
        setLoadingProfessors(true);

        const establishmentsData =
          await establishmentService.getAllEstablishments();
        setEstablishments(establishmentsData || []);

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

    if (name === "moderator") {
      const selectedProfessor = professors.find((prof) => prof.id === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setSelectedProfessorName(
        selectedProfessor
          ? `${selectedProfessor.nom} ${selectedProfessor.prenom}`
          : ""
      );
    } else if (name === "etablissement") {
      const establishment = establishments.find((etab) => etab.id === value);
      setSelectedEstablishment(establishment);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        etablissementToken: "",
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
      newErrors.nom = "Le nom de la classe est requis";
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.niveau.trim()) {
      newErrors.niveau = "Le niveau est requis";
    }

    if (!formData.moderator) {
      newErrors.moderator = "Un modérateur est requis";
    }

    if ((selectedEstablishment?.optionTokenGeneral || selectedEstablishment?.codeUnique) && !formData.etablissementToken.trim()) {
      newErrors.etablissementToken = "Le token est requis pour cet établissement";
    } else if (selectedEstablishment?.optionTokenGeneral && formData.etablissementToken.trim().length !== 8) {
      newErrors.etablissementToken = "Le token général doit contenir exactement 8 caractères";
    } else if (selectedEstablishment?.codeUnique && formData.etablissementToken.trim().length !== 6) {
      newErrors.etablissementToken = "Le code unique doit contenir exactement 6 caractères";
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

  const createClass = async (shouldAutoApprove = false) => {
    setLoading(true);
    try {
      let classData = {
        nom: formData.nom.trim(),
        niveau: formData.niveau.trim(),
        moderator: formData.moderator,
        parents: [],
        eleves: []
      };

      // Only add etablissement if one is selected
      if (formData.etablissement) {
        classData.etablissement = {
          id: formData.etablissement
        };
        
        // Add etablissementToken based on establishment options
        if (selectedEstablishment?.optionTokenGeneral || selectedEstablishment?.codeUnique) {
          classData.etablissementToken = formData.etablissementToken;
        }
      }

      console.log("Creating class with data:", classData);
      const createdClass = await classService.creerClasse(classData);
      console.log("Class created:", createdClass);
      setCreatedClassId(createdClass.id);

      // Assign publication rights to creator
      if (currentUserId) {
        const rightsAssigned = await assignPublicationRightsToCreator(
          createdClass.id
        );
        if (!rightsAssigned) {
          console.warn(
            "Class created but publication rights assignment failed"
          );
        }
      }

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
      await createClass(false);
    } else {
      // No establishment selected - show payment modal
      setShowPaymentModal(true);
    }
  };

  // MODIFIED: Updated handlePaymentSuccess to auto-approve the class
  const handlePaymentSuccess = async () => {
    setIsProcessingPayment(true);
    setShowPaymentModal(false);

    console.log("Payment successful, creating and auto-approving class...");

    // Create class with auto-approval since payment was successful
    await createClass(true);

    setIsProcessingPayment(false);
  };

  if (success) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'} flex items-center justify-center p-4`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8 max-w-md w-full text-center`}>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Classe créée avec succès!
          </h2>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            {formData.etablissement
              ? "Votre classe a été créée et est en attente d'approbation."
              : "Votre classe premium a été créée et approuvée automatiquement!"}
            {currentUserId && (
              <span className="block mt-2 text-sm text-green-600">
                Les droits de publication vous ont été automatiquement
                attribués.
              </span>
            )}
            Redirection automatique vers la gestion des classes dans {countdown}{" "}
            seconde{countdown !== 1 ? "s" : ""}.
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
    <>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} py-8 px-4`}>
        <div className="max-w-6xl mx-auto">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden`}>
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

                    {/* Token Field - Only show if establishment is selected and requires it */}
                    {formData.etablissement && (selectedEstablishment?.optionTokenGeneral || selectedEstablishment?.codeUnique) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Token d'établissement *
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="etablissementToken"
                            value={formData.etablissementToken}
                            onChange={handleInputChange}
                            maxLength={selectedEstablishment?.optionTokenGeneral ? "8" : "6"}
                            className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                              errors.etablissementToken
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder={selectedEstablishment?.optionTokenGeneral ? "A1B2C3D4" : "A1B2C3"}
                          />
                        </div>
                        {errors.etablissementToken && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.etablissementToken}
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
                              : "Aucun établissement (Classe indépendante)"}
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
                        Modérateur *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          name="moderator"
                          value={formData.moderator}
                          onChange={handleInputChange}
                          disabled={loadingProfessors}
                          className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${
                            errors.moderator ? "border-red-500" : "border-gray-300"
                          }`}
                        >
                          <option value="">
                            {loadingProfessors
                              ? "Chargement des professeurs..."
                              : "Sélectionner un modérateur"}
                          </option>
                          {professors.map((professor) => (
                            <option key={professor.id} value={professor.id}>
                              {professor.nom} {professor.prenom}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.moderator && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.moderator}
                        </p>
                      )}
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
                        <div className="text-sm text-blue-700">
                          <p className="font-semibold mb-1">
                            Information importante
                          </p>
                          <p>
                            Les champs marqués d'un * sont obligatoires. 
                            {selectedEstablishment?.optionEnvoiMailVersClasse && (
                              <span className="block mt-1">✉️ Cet établissement envoie des emails aux classes.</span>
                            )}
                            {selectedEstablishment?.optionTokenGeneral && (
                              <span className="block mt-1">🔑 Un token général est requis pour cet établissement.</span>
                            )}
                            {selectedEstablishment?.codeUnique && (
                              <span className="block mt-1">🎯 Un code unique est requis pour cet établissement.</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Avertissement paiement */}
                    {!formData.etablissement && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">
                              Aucun établissement sélectionné - Paiement requis
                            </p>
                            <p>
                              La création d'une classe sans établissement
                              nécessite un paiement unique de 5000 FCFA pour
                              l'activation immédiate.
                            </p>
                          </div>
                        </div>
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
                        loadingProfessors ||
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
                        ? "Traitement en cours..."
                        : !formData.etablissement
                        ? "Procéder au paiement (5000.000 FCFA)"
                        : "Créer la classe"}
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
        onPaymentSuccess={handlePaymentSuccess}
        classData={formData}
        isLoading={isProcessingPayment}
      />
    </>
  );
};

export default CreateClassContent;
