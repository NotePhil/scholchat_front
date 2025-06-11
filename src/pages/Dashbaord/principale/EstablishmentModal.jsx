import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Settings,
} from "lucide-react";

const EstablishmentModal = ({
  showModal,
  setShowModal,
  modalMode,
  selectedEstablishment,
  onSave,
  loading,
}) => {
  const [formData, setFormData] = useState({
    nom: "",
    pays: "",
    localisation: "",
    email: "",
    telephone: "",
    optionEnvoiMailVersClasse: false,
    optionTokenGeneral: false,
    codeUnique: false,
  });

  // Initialize form data when modal opens or selectedEstablishment changes
  useEffect(() => {
    if (showModal) {
      if (modalMode === "create") {
        // Reset form for create mode
        setFormData({
          nom: "",
          pays: "",
          localisation: "",
          email: "",
          telephone: "",
          optionEnvoiMailVersClasse: false,
          optionTokenGeneral: false,
          codeUnique: false,
        });
      } else if (
        (modalMode === "edit" || modalMode === "view") &&
        selectedEstablishment
      ) {
        // Populate form with existing establishment data
        setFormData({
          nom: selectedEstablishment.nom || "",
          pays: selectedEstablishment.pays || "",
          localisation: selectedEstablishment.localisation || "",
          email: selectedEstablishment.email || "",
          telephone: selectedEstablishment.telephone || "",
          optionEnvoiMailVersClasse:
            selectedEstablishment.optionEnvoiMailVersClasse || false,
          optionTokenGeneral: selectedEstablishment.optionTokenGeneral || false,
          codeUnique: selectedEstablishment.codeUnique || false,
        });
      }
    }
  }, [showModal, modalMode, selectedEstablishment]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const establishmentData = {
      ...formData,
      nom: formData.nom.trim(),
      pays: formData.pays.trim(),
      localisation: formData.localisation.trim(),
      email: formData.email.trim(),
      telephone: formData.telephone.trim(),
    };

    await onSave(establishmentData);
  };

  if (!showModal) return null;

  // View Mode Component
  if (modalMode === "view") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Building2 className="mr-3 w-6 h-6" />
                  Détails de l'Établissement
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="space-y-6">
                {/* Name Section */}
                <div className="text-center pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {formData.nom}
                  </h2>
                </div>

                {/* Location Information - 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">
                        Localisation
                      </p>
                      <p className="text-gray-900 font-medium">
                        {formData.localisation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <Globe className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Pays</p>
                      <p className="text-gray-900 font-medium">
                        {formData.pays}
                      </p>
                    </div>
                  </div>

                  {formData.email && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">
                          Email
                        </p>
                        <p className="text-gray-900 font-medium">
                          {formData.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.telephone && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                        <Phone className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">
                          Téléphone
                        </p>
                        <p className="text-gray-900 font-medium">
                          {formData.telephone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Options Section - 3 Columns */}
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                      <Settings className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Options configurées
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Email vers classes
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          formData.optionEnvoiMailVersClasse
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formData.optionEnvoiMailVersClasse
                          ? "Activé"
                          : "Désactivé"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Token général
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          formData.optionTokenGeneral
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formData.optionTokenGeneral ? "Activé" : "Désactivé"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Code unique
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          formData.codeUnique
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formData.codeUnique ? "Activé" : "Désactivé"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit/Create Mode Component
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setShowModal(false)}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Building2 className="mr-3 w-6 h-6" />
                  {modalMode === "create"
                    ? "Nouvel Établissement"
                    : "Modifier l'Établissement"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information - 3 Columns */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Informations générales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nom de l'établissement{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        required
                        placeholder="Nom de l'établissement"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Pays <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pays"
                        value={formData.pays}
                        onChange={handleInputChange}
                        required
                        placeholder="Pays"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Localisation <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="localisation"
                        value={formData.localisation}
                        onChange={handleInputChange}
                        required
                        placeholder="Localisation"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information - 2 Columns */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Informations de contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Adresse email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="exemple@etablissement.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Numéro de téléphone
                      </label>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        placeholder="+237 6XX XXX XXX"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Configuration Options - 3 Columns */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Options de configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border hover:border-blue-200 transition-colors">
                      <input
                        type="checkbox"
                        name="optionEnvoiMailVersClasse"
                        checked={formData.optionEnvoiMailVersClasse}
                        onChange={handleInputChange}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          Email vers classes
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Envoi automatique d'emails
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border hover:border-blue-200 transition-colors">
                      <input
                        type="checkbox"
                        name="optionTokenGeneral"
                        checked={formData.optionTokenGeneral}
                        onChange={handleInputChange}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          Token général
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Token d'authentification
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border hover:border-blue-200 transition-colors">
                      <input
                        type="checkbox"
                        name="codeUnique"
                        checked={formData.codeUnique}
                        onChange={handleInputChange}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          Code unique
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Code d'identification
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1 sm:flex-none inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold text-white hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="mr-2 w-5 h-5" />
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 sm:flex-none inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstablishmentModal;
