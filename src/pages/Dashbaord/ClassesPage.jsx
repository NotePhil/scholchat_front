import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Plus, X } from "lucide-react";
import { scholchatService } from "../../services/ScholchatService";

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    nom: "",
    niveau: "",
    date_creation: new Date().toISOString(),
    code_activation: null,
    etat: "ACTIF",
    etablissement_id: null,
  });
  const [errors, setErrors] = useState({});
  const [establishments, setEstablishments] = useState([]);

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

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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

  const formatDateForBackend = (date) => {
    return new Date(date).toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submissionData = {
        ...formData,
        date_creation: formatDateForBackend(formData.date_creation),
      };

      if (editingClass) {
        await scholchatService.updateClass(editingClass.id, submissionData);
      } else {
        await scholchatService.createClass(submissionData);
      }
      closeModal();
      fetchClasses();
    } catch (error) {
      console.error("Error saving class:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await scholchatService.deleteClass(id);
        fetchClasses();
      } catch (error) {
        console.error("Error deleting class:", error);
      }
    }
  };

  const openModal = (classData = null) => {
    if (classData) {
      setEditingClass(classData);
      setFormData({
        id: classData.id,
        nom: classData.nom,
        niveau: classData.niveau,
        date_creation: classData.dateCreation || classData.date_creation,
        code_activation: classData.codeActivation,
        etat: classData.etat,
        etablissement_id: classData.etablissement?.id,
      });
    } else {
      setEditingClass(null);
      setFormData({
        id: null,
        nom: "",
        niveau: "",
        date_creation: new Date().toISOString(),
        code_activation: null,
        etat: "ACTIF",
        etablissement_id: null,
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setFormData({
      id: null,
      nom: "",
      niveau: "",
      date_creation: new Date().toISOString(),
      code_activation: null,
      etat: "ACTIF",
      etablissement_id: null,
    });
    setErrors({});
  };

  const filteredClasses = classes.filter(
    (classe) =>
      classe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classe.niveau.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classe.etablissement?.nom
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header section */}
      <div className="flex justify-between items-center mb-8">
        <div className="relative w-96">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by class, level, or establishment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition duration-150"
        >
          <Plus size={20} className="mr-2" /> Add Class
        </button>
      </div>

      {/* Table section */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  No.
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Class Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Establishment
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Creation Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Activation Code
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClasses.map((classe, index) => (
                <tr
                  key={classe.id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {classe.nom}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {classe.niveau}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {classe.etablissement?.nom || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(
                      classe.dateCreation || classe.date_creation
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {classe.codeActivation || "Not Set"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        classe.etat === "ACTIF" || classe.etat === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {classe.etat}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(classe)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full inline-flex items-center justify-center transition duration-150"
                      title="Edit Class"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(classe.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full inline-flex items-center justify-center transition duration-150"
                      title="Delete Class"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClasses.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No classes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingClass ? "Update Class" : "Add New Class"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition duration-150"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name
                  </label>
                  <input
                    name="nom"
                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.nom ? "border-red-500" : "border-gray-300"
                    }`}
                    value={formData.nom}
                    onChange={handleInputChange}
                  />
                  {errors.nom && (
                    <p className="mt-1 text-sm text-red-500">{errors.nom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <input
                    name="niveau"
                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.niveau ? "border-red-500" : "border-gray-300"
                    }`}
                    value={formData.niveau}
                    onChange={handleInputChange}
                  />
                  {errors.niveau && (
                    <p className="mt-1 text-sm text-red-500">{errors.niveau}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Establishment
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
                      <option key={establishment.id} value={establishment.id}>
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

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition duration-150 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingClass ? "Update" : "Create"} Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
