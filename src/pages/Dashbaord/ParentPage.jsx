import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Plus, X } from "lucide-react";
import { scholchatService } from "../../services/ScholchatService";

const ParentPage = () => {
  const [parents, setParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    classes: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      const response = await scholchatService.getAllParents();
      setParents(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching parents:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (!formData.address) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const parentData = {
      nom: formData.lastName,
      prenom: formData.firstName,
      email: formData.email,
      telephone: formData.phone,
      adresse: formData.address,
      etat: formData.status,
      classes: formData.classes,
      type: "parent",
    };

    try {
      if (editingParent) {
        await scholchatService.updateParent(editingParent.id, parentData);
      } else {
        await scholchatService.createParent(parentData);
      }
      closeModal();
      fetchParents();
    } catch (error) {
      console.error("Error saving parent:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this parent?")) {
      try {
        await scholchatService.deleteParent(id);
        fetchParents();
      } catch (error) {
        console.error("Error deleting parent:", error);
      }
    }
  };

  const openModal = (parent = null) => {
    if (parent) {
      setEditingParent(parent);
      setFormData({
        lastName: parent.nom,
        firstName: parent.prenom,
        email: parent.email,
        phone: parent.telephone,
        address: parent.adresse,
        status: parent.etat,
        classes: parent.classes || [],
      });
    } else {
      setEditingParent(null);
      setFormData({
        lastName: "",
        firstName: "",
        email: "",
        phone: "",
        address: "",
        status: "active",
        classes: [],
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingParent(null);
    setFormData({
      lastName: "",
      firstName: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
      classes: [],
    });
    setErrors({});
  };

  const filteredParents = parents.filter(
    (parent) =>
      parent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.prenom.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-8">
        <div className="relative w-96">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            placeholder="Search parents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" /> Add Parent
        </button>
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  #
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Classes
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredParents.map((parent, index) => (
                <tr key={parent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    {parent.prenom} {parent.nom}
                  </td>
                  <td className="px-6 py-4">{parent.email}</td>
                  <td className="px-6 py-4">{parent.telephone}</td>
                  <td className="px-6 py-4">{parent.adresse}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        parent.etat === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {parent.etat}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {parent.classes?.length || 0} classes
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => openModal(parent)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full inline-flex items-center justify-center"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(parent.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full inline-flex items-center justify-center"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
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
                {editingParent ? "Update Parent" : "Add New Parent"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      className={`w-full p-2 border rounded-md ${
                        errors.lastName ? "border-red-500" : ""
                      }`}
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      className={`w-full p-2 border rounded-md ${
                        errors.firstName ? "border-red-500" : ""
                      }`}
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    className={`w-full p-2 border rounded-md ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    name="phone"
                    className={`w-full p-2 border rounded-md ${
                      errors.phone ? "border-red-500" : ""
                    }`}
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    name="address"
                    className={`w-full p-2 border rounded-md ${
                      errors.address ? "border-red-500" : ""
                    }`}
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    className="w-full p-2 border rounded-md"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingParent ? "Update" : "Create"} Parent
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

export default ParentPage;
