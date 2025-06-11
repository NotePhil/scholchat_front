import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  BookOpen,
  School,
} from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
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
    etat: "INACTIVE",
    niveau: "",
    classes: [],
  });

  const [selectedCountry, setSelectedCountry] = useState("CM");

  // Initialize form data when modal opens or selectedStudent changes
  useEffect(() => {
    if (showModal) {
      if (modalMode === "create") {
        // Reset form for create mode
        setFormData({
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          adresse: "",
          etat: "INACTIVE",
          niveau: "",
          classes: [],
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
          etat: selectedStudent.etat || "INACTIVE",
          niveau: selectedStudent.niveau || "",
          classes: selectedStudent.classes || [],
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
        style={{
          width: "60px",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-chevron-down'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1rem",
          appearance: "none",
        }}
      >
        {options?.map(({ value, label }) => (
          <option key={value} value={value}>
            {countryToFlag(value)} {label}
          </option>
        ))}
        <option value={value} style={{ display: "none" }}>
          {value ? countryToFlag(value) : ""}
        </option>
      </select>
    );
  };

  const handleClassSelection = (e) => {
    const classId = e.target.value;
    if (!classId) return;

    const selectedClass = classes.find((c) => c.id === classId);
    if (!selectedClass) return;

    // Check if class is already added
    if (formData.classes.some((c) => c.id === classId)) return;

    setFormData((prev) => ({
      ...prev,
      classes: [...prev.classes, selectedClass],
    }));
  };

  const removeClass = (classId) => {
    setFormData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== classId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      let studentData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone,
        adresse: formData.adresse.trim(),
        etat: formData.etat || "INACTIVE",
        niveau: formData.niveau.trim(),
        classesIds: formData.classes.map((c) => c.id),
        type: "eleve", // Add type field
      };

      if (modalMode === "create") {
        // Create new student
        await scholchatService.createStudent(studentData);
      } else {
        // Update existing student
        await scholchatService.updateStudent(selectedStudent.id, studentData);
      }

      await loadData();
      setShowModal(false);
    } catch (err) {
      console.error("Error details:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de l'enregistrement";
      setError("Erreur lors de l'enregistrement: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getLevelText = (level) => {
    const levels = {
      primaire: "Primaire",
      college: "Collège",
      lycee: "Lycée",
      superieur: "Supérieur",
    };
    return levels[level] || level;
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setShowModal(false)}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {modalMode === "create"
                    ? "Nouvel Élève"
                    : modalMode === "edit"
                    ? "Modifier Élève"
                    : "Détails Élève"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <User className="mr-2 w-5 h-5" />
                    Informations Personnelles
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        required
                        disabled={modalMode === "view"}
                        placeholder="Entrez le prénom"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        required
                        disabled={modalMode === "view"}
                        placeholder="Entrez le nom"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="Email"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de téléphone{" "}
                      <span className="text-red-500">*</span>
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
                        disabled={modalMode === "view"}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      placeholder="Entrez l'adresse"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Niveau d'éducation <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="niveau"
                      value={formData.niveau}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "view"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Sélectionnez un niveau</option>
                      <option value="primaire">Primaire</option>
                      <option value="college">Collège</option>
                      <option value="lycee">Lycée</option>
                      <option value="superieur">Supérieur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      name="etat"
                      value={formData.etat}
                      onChange={handleInputChange}
                      disabled={modalMode === "view"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="INACTIVE">Inactif</option>
                      <option value="ACTIVE">Actif</option>
                      <option value="PENDING">En attente</option>
                    </select>
                  </div>
                </div>

                {/* Classes Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <School className="mr-2 w-5 h-5" />
                    Classes Associées
                  </h4>

                  {modalMode !== "view" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ajouter une classe
                      </label>
                      <select
                        onChange={handleClassSelection}
                        disabled={modalMode === "view"}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Sélectionnez une classe</option>
                        {classes
                          .filter(
                            (cls) =>
                              !formData.classes.some((c) => c.id === cls.id)
                          )
                          .map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.nom} - {cls.niveau}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    {formData.classes.length > 0 ? (
                      formData.classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{cls.nom}</p>
                            <p className="text-sm text-gray-600">
                              {cls.niveau}
                            </p>
                          </div>
                          {modalMode !== "view" && (
                            <button
                              type="button"
                              onClick={() => removeClass(cls.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 py-2">
                        Aucune classe associée
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {modalMode !== "view" && (
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  <Save className="mr-2 w-4 h-4" />
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentModal;
