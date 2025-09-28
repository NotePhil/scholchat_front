import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { scholchatService } from "../../services/ScholchatService";

const ClassesPage = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    niveau: "",
    dateCreation: new Date(),
    codeActivation: "",
    etat: "ACTIF",
    etablissement_id: null,
  });
  const [errors, setErrors] = useState({});
  const [establishments, setEstablishments] = useState([]);
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchClasses();
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      const response = await scholchatService.getAllEstablishments();
      setEstablishments(response);
    } catch (error) {
      console.error("Error fetching establishments:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await scholchatService.getAllClasses();
      setClasses(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const formatDateForDisplay = (date) => {
    const d = new Date(date);
    const year = d.getFullYear().toString().slice(-2);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const formatDateForBackend = (date) => {
    const d = new Date(date);
    return d.toISOString();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom) newErrors.nom = "Class name is required";
    if (!formData.niveau) newErrors.niveau = "Level is required";
    if (!formData.etablissement_id)
      newErrors.etablissement_id = "Establishment is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const newClass = {
        nom: formData.nom,
        niveau: formData.niveau,
        dateCreation: formatDateForBackend(formData.dateCreation),
        codeActivation: formData.codeActivation,
        etat: formData.etat,
        etablissement_id: formData.etablissement_id,
        created_by: userId,
      };

      const createdClass = await scholchatService.createClass(newClass);
      handleClassSelect(createdClass);
      closeCreateModal();
    } catch (error) {
      console.error("Error creating class:", error);
    }
  };

  const handleClassSelect = (selectedClass) => {
    localStorage.setItem("userClass", JSON.stringify(selectedClass));
    navigate(
      userRole === "professor"
        ? "/schoolchat/professors/dashboard"
        : "/schoolchat/admin/dashboard"
    );
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setFormData({
      nom: "",
      niveau: "",
      dateCreation: new Date(),
      codeActivation: "",
      etat: "ACTIF",
      etablissement_id: null,
    });
    setErrors({});
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-6">
          {classes.length > 0 ? "Select Your Class" : "Create Your First Class"}
        </h2>

        {classes.length > 0 ? (
          <>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
              {classes.map((classe) => (
                <div
                  key={classe.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition duration-150"
                  onClick={() => handleClassSelect(classe)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{classe.nom}</h3>
                      <p className="text-gray-600">{classe.niveau}</p>
                      <div className="text-sm text-gray-500 mt-1 space-y-1">
                        <p>
                          Created: {formatDateForDisplay(classe.dateCreation)}
                        </p>
                        <p>
                          Establishment: {classe.etablissement?.nom || "N/A"}
                        </p>
                        {classe.codeActivation && (
                          <p>Activation Code: {classe.codeActivation}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        classe.etat === "ACTIF"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {classe.etat}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition duration-150"
            >
              <Plus size={20} className="mr-2" /> Create New Class
            </button>
          </>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600">
              No classes found. Please create your first class to continue.
            </p>
            <button
              onClick={openCreateModal}
              className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition duration-150 text-lg"
            >
              <Plus size={24} className="mr-2" /> Create Your First Class
            </button>
          </div>
        )}

        {/* Create Class Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Create New Class
                </h2>
                <button
                  onClick={closeCreateModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition duration-150"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreateClass} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Name *
                      </label>
                      <input
                        name="nom"
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.nom ? "border-red-500" : "border-gray-300"
                        }`}
                        value={formData.nom}
                        onChange={handleInputChange}
                        placeholder="e.g. Mathematics 101"
                      />
                      {errors.nom && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.nom}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Level *
                      </label>
                      <input
                        name="niveau"
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.niveau ? "border-red-500" : "border-gray-300"
                        }`}
                        value={formData.niveau}
                        onChange={handleInputChange}
                        placeholder="e.g. Primary 5, Grade 10"
                      />
                      {errors.niveau && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.niveau}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Establishment *
                      </label>
                      <select
                        name="etablissement_id"
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.etablissement_id
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        value={formData.etablissement_id || ""}
                        onChange={handleInputChange}
                      >
                        <option value="">Select an establishment</option>
                        {establishments.map((establishment) => (
                          <option
                            key={establishment.id}
                            value={establishment.id}
                          >
                            {establishment.nom}
                          </option>
                        ))}
                      </select>
                      {errors.etablissement_id && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.etablissement_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Activation Code
                      </label>
                      <input
                        name="codeActivation"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.codeActivation}
                        onChange={handleInputChange}
                        placeholder="Optional activation code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="etat"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.etat}
                        onChange={handleInputChange}
                      >
                        <option value="ACTIF">Active</option>
                        <option value="INACTIF">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Creation Date
                      </label>
                      <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                        {formatDateForDisplay(formData.dateCreation)}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Automatically set to current date
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition duration-150"
                    >
                      Create Class
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassesPage;
