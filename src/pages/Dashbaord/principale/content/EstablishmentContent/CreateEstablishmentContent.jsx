import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";
import establishmentService from "../../../../../services/EstablishmentService";
import { userService } from "../../../../../services/userService";
import { useNavigate } from "react-router-dom";

const CreateEstablishmentContent = ({ onNavigateToManage, setActiveTab }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    localisation: "",
    pays: "",
    email: "",
    telephone: "",
    optionEnvoiMailVersClasse: false,
    optionTokenGeneral: false,
    codeUnique: false,
    gestionnaire: null,
  });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const usersData = await userService.getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Error loading users:", error);
        setErrors({ users: "Erreur lors du chargement des utilisateurs" });
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

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
      // For boolean options, make them mutually exclusive
      const booleanOptions = ['optionEnvoiMailVersClasse', 'optionTokenGeneral', 'codeUnique'];
      
      if (booleanOptions.includes(name)) {
        // If checking this option, uncheck all others
        if (checked) {
          const newFormData = { ...formData };
          booleanOptions.forEach(option => {
            newFormData[option] = option === name;
          });
          setFormData(newFormData);
        } else {
          // If unchecking, just uncheck this one
          setFormData((prev) => ({
            ...prev,
            [name]: false,
          }));
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
        }));
      }
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

  const handleUserSelect = (user) => {
    setFormData((prev) => ({ ...prev, gestionnaire: user }));
    setShowUserDropdown(false);
    if (errors.gestionnaire) {
      setErrors((prev) => ({ ...prev, gestionnaire: null }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const establishmentData = {
        ...formData,
        gestionnaire: {
          type: formData.gestionnaire.type,
          id: formData.gestionnaire.id
        }
      };
      await establishmentService.createEstablishment(establishmentData);
      setSuccess(true);
      setCountdown(5);
    } catch (error) {
      console.error("Error creating establishment:", error);
      setErrors({ submit: "Erreur lors de la création de l'établissement" });
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
            Établissement créé avec succès!
          </h2>
          <p className="text-gray-600 mb-6">
            Votre établissement a été créé avec succès. Redirection automatique
            vers la gestion des établissements dans {countdown} seconde
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Créer un Établissement
                </h1>
                <p className="text-blue-100">
                  Ajoutez un nouvel établissement à votre système
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.nom ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Nom de l'établissement"
                    />
                  </div>
                  {errors.nom && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.nom}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localisation *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="localisation"
                      value={formData.localisation}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.localisation
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Adresse ou localisation"
                    />
                  </div>
                  {errors.localisation && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.localisation}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="pays"
                      value={formData.pays}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.pays ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Pays"
                    />
                  </div>
                  {errors.pays && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
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
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="contact@etablissement.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.telephone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                  {errors.telephone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.telephone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gestionnaire *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className={`w-full pl-12 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left ${
                        errors.gestionnaire ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      {formData.gestionnaire
                        ? `${formData.gestionnaire.nom} ${formData.gestionnaire.prenom} (${formData.gestionnaire.email}) - ${formData.gestionnaire.type || 'N/A'}`
                        : "Sélectionner un gestionnaire"}
                    </button>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    
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
                                {user.type || 'Type non défini'}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {errors.gestionnaire && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.gestionnaire}
                    </p>
                  )}
                  {errors.users && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.users}
                    </p>
                  )}
                </div>

                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900">
                      Options de Configuration
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600">
                    Sélectionnez une seule option. Les tokens/codes seront générés automatiquement.
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="optionEnvoiMailVersClasse"
                        checked={formData.optionEnvoiMailVersClasse}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Envoi d'email vers les classes
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
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">
                          Token général
                        </span>
                        <p className="text-xs text-gray-500">
                          Un token général sera généré automatiquement
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="codeUnique"
                        checked={formData.codeUnique}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">Code unique</span>
                        <p className="text-xs text-gray-500">
                          Un code unique sera généré automatiquement
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {loading ? "Création en cours..." : "Créer l'établissement"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEstablishmentContent;
