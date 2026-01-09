import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  School,
  Calendar,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { scholchatService } from "../../../../services/ScholchatService";
import axios from "axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const StudentModal = ({
  showModal,
  setShowModal,
  modalMode,
  selectedStudent,
  classes,
  loadData,
  setError,
  setLoading,
  loading,
}) => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    dateNaissance: "",
    classe: null,
  });

  const [selectedCountry, setSelectedCountry] = useState("CM");
  const [submitError, setSubmitError] = useState("");

  // Initialize form data when modal opens or selectedStudent changes
  useEffect(() => {
    if (showModal) {
      setSubmitError(""); // Reset error when opening modal
      if (modalMode === "create") {
        // Reset form for create mode
        setFormData({
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          adresse: "",
          dateNaissance: "",
          classe: null,
        });
      } else if (
        (modalMode === "edit" || modalMode === "view") &&
        selectedStudent
      ) {
        // Populate form with existing student data
        setFormData({
          nom: selectedStudent.nom || "",
          prenom: selectedStudent.prenom || "",
          email: selectedStudent.email || "",
          telephone: selectedStudent.telephone || "",
          adresse: selectedStudent.adresse || "",
          dateNaissance: selectedStudent.dateNaissance || "",
          classe: selectedStudent.classe || null,
        });

        // Set country based on phone number
        if (selectedStudent.telephone) {
          if (selectedStudent.telephone.startsWith("+237")) {
            setSelectedCountry("CM");
          } else if (selectedStudent.telephone.startsWith("+33")) {
            setSelectedCountry("FR");
          }
        }
      }
    }
  }, [showModal, modalMode, selectedStudent]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
  };

  const CountrySelect = ({ value, onChange, options, ...restProps }) => {
    const countryToFlag = (countryCode) => {
      return countryCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(127397 + char.charCodeAt())
        );
    };

    return (
      <select
        {...restProps}
        value={value}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="border border-gray-300 rounded-l-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        style={{
          width: "70px",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.25rem center",
          backgroundSize: "0.8rem",
          appearance: "none",
        }}
      >
        {options?.map(({ value, label }) => (
          <option key={value} value={value}>
            {countryToFlag(value)}
          </option>
        ))}
      </select>
    );
  };

  const handleClassSelection = (e) => {
    const classId = e.target.value;
    if (!classId) {
      setFormData((prev) => ({
        ...prev,
        classe: null,
      }));
      return;
    }

    const selectedClass = classes.find((c) => c.id === classId);
    if (!selectedClass) return;

    setFormData((prev) => ({
      ...prev,
      classe: selectedClass,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setSubmitError("");

      // Prepare data according to the API requirements
      let studentData = {
        type: "eleve",
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone,
        adresse: formData.adresse.trim(),
        dateNaissance: formData.dateNaissance,
        classeId: formData.classe?.id || null,
      };

      if (modalMode === "create") {
        // Create new student
        await scholchatService.createStudent(studentData);
      } else {
        // Update existing student using patchUser method
        await scholchatService.patchUser(selectedStudent.id, studentData);
      }

      await loadData();
      setShowModal(false);
    } catch (err) {
      console.error("Error details:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de l'enregistrement";
      setSubmitError("Erreur lors de l'enregistrement: " + errorMessage);
      setError("Erreur lors de l'enregistrement: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setSubmitError("");
  };

  if (!showModal) return null;

  // View Mode Component - Updated with responsive structure
  if (modalMode === "view") {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
          {/* Header - Fixed and sticky */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
                <User className="mr-2 sm:mr-3 text-blue-600" size={24} />
                <span className="hidden sm:inline">Profil Élève</span>
                <span className="sm:hidden">Élève</span>
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Name Section */}
              <div className="text-center pb-6 border-b border-gray-100">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formData.prenom} {formData.nom}
                </h2>
              </div>

              {/* Information Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Email */}
                <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium text-sm sm:text-base break-all">
                      {formData.email}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                      Téléphone
                    </p>
                    <p className="text-gray-900 font-medium text-sm sm:text-base">
                      {formData.telephone || "Non renseigné"}
                    </p>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                      Date de naissance
                    </p>
                    <p className="text-gray-900 font-medium text-sm sm:text-base">
                      {formData.dateNaissance || "Non renseignée"}
                    </p>
                  </div>
                </div>

                {/* Class */}
                <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">Classe</p>
                    <p className="text-gray-900 font-medium text-sm sm:text-base">
                      {formData.classe
                        ? `${formData.classe.nom} (${formData.classe.niveau})`
                        : "Aucune classe"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address (full width) */}
              <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Adresse</p>
                  <p className="text-gray-900 font-medium text-sm sm:text-base">
                    {formData.adresse || "Non renseignée"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex-shrink-0 sticky bottom-0 rounded-b-2xl">
            <button
              onClick={handleClose}
              className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit/Create Mode Component - Updated with responsive structure
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
        {/* Header - Fixed and sticky */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
              <User className="mr-2 sm:mr-3 text-blue-600" size={24} />
              <span className="hidden sm:inline">
                {modalMode === "create" ? "Nouvel Élève" : "Modifier Élève"}
              </span>
              <span className="sm:hidden">
                {modalMode === "create" ? "Nouveau" : "Modifier"}
              </span>
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error display in header */}
          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
              <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form
            id="student-form"
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-6"
          >
            {/* Personal Information Section */}
            <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Informations personnelles
              </h3>

              {/* Personal Information Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez le prénom"
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez le nom"
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="exemple@email.com"
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Numéro de téléphone
                  </label>
                  <div className="phone-input-container">
                    <PhoneInput
                      defaultCountry={selectedCountry}
                      value={formData.telephone}
                      onChange={handlePhoneChange}
                      countrySelectComponent={CountrySelect}
                      placeholder="Entrez le numéro"
                      international
                      countryCallingCodeEditable={false}
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date de naissance <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateNaissance"
                    value={formData.dateNaissance}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  />
                </div>

                {/* Class */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Classe
                  </label>
                  <select
                    name="classe"
                    value={formData.classe?.id || ""}
                    onChange={handleClassSelection}
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  >
                    <option value="">Sélectionnez une classe</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.nom} ({cls.niveau})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address (full width) */}
              <div className="mt-4 sm:mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse complète
                </label>
                <textarea
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Entrez l'adresse complète"
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer with Action Buttons */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex-shrink-0 sticky bottom-0 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors rounded-lg hover:bg-slate-200 flex items-center justify-center order-2 sm:order-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="student-form"
              disabled={loading}
              className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="hidden sm:inline">Enregistrement...</span>
                  <span className="sm:hidden">En cours...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 w-5 h-5" />
                  <span className="hidden sm:inline">Enregistrer</span>
                  <span className="sm:hidden">Sauver</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentModal;
