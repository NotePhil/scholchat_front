import React, { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Settings,
} from "lucide-react";
import establishmentService from "../../../../../services/EstablishmentService";
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
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5); // Add countdown state

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
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
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
      await establishmentService.createEstablishment(formData);
      setSuccess(true);
      setCountdown(5); // Reset countdown to 5 seconds
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

                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900">
                      Options de Configuration
                    </h4>
                  </div>

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
                      <span className="text-sm text-gray-700">
                        Token général
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="codeUnique"
                        checked={formData.codeUnique}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Code unique</span>
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
