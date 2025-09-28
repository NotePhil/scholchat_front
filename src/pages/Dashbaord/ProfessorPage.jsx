import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Plus, X, PlusCircle } from "lucide-react";
import { scholchatService } from "../../services/ScholchatService";

const ProfessorPage = () => {
  const [professors, setProfessors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showMotifModal, setShowMotifModal] = useState(false);
  const [currentProfessor, setCurrentProfessor] = useState(null);
  const [motifs, setMotifs] = useState([]);
  const [newMotif, setNewMotif] = useState("");
  const [professorMotifs, setProfessorMotifs] = useState({});
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    nomEtablissement: "",
    nomClasse: "",
    matriculeProfesseur: "",
    cniUrlRecto: "",
    cniUrlVerso: "",
    etat: "active",
  });

  useEffect(() => {
    fetchProfessors();
    fetchMotifs();
  }, []);

  const fetchProfessors = async () => {
    try {
      const response = await scholchatService.getAllProfessors();
      setProfessors(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching professors:", error);
      setLoading(false);
    }
  };

  const fetchMotifs = async () => {
    try {
      const response = await scholchatService.getAllMotifs();
      setMotifs(response || []);

      // Initialize professor motifs
      const profMotifs = {};
      for (const prof of professors) {
        try {
          const profMotifResponse = await scholchatService.getProfessorMotifs(
            prof.id
          );
          profMotifs[prof.id] = profMotifResponse || [];
        } catch (error) {
          console.error(
            `Error fetching motifs for professor ${prof.id}:`,
            error
          );
          profMotifs[prof.id] = [];
        }
      }
      setProfessorMotifs(profMotifs);
    } catch (error) {
      console.error("Error fetching motifs:", error);
      setMotifs([]);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredProfessors = professors.filter(
    (professor) =>
      professor.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      await scholchatService.createProfessor(formData);
      setShowCreateModal(false);
      resetForm();
      fetchProfessors();
    } catch (error) {
      console.error("Error creating professor:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      await scholchatService.updateProfessor(currentProfessor.id, formData);
      setShowUpdateModal(false);
      resetForm();
      fetchProfessors();
    } catch (error) {
      console.error("Error updating professor:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this professor?")) {
      try {
        await scholchatService.deleteProfessor(id);
        fetchProfessors();
      } catch (error) {
        console.error("Error deleting professor:", error);
      }
    }
  };

  const handleCreateMotif = async () => {
    if (!newMotif.trim()) return;

    try {
      await scholchatService.createMotif({ libelle: newMotif });
      setNewMotif("");
      fetchMotifs();
    } catch (error) {
      console.error("Error creating motif:", error);
    }
  };

  const handleDeleteMotif = async (motifId) => {
    if (window.confirm("Are you sure you want to delete this motif?")) {
      try {
        await scholchatService.deleteMotif(motifId);
        fetchMotifs();
      } catch (error) {
        console.error("Error deleting motif:", error);
      }
    }
  };

  const handleAssignMotif = async (professorId, motifId) => {
    try {
      await scholchatService.assignMotifToProfessor(professorId, motifId);

      // Update local state
      setProfessorMotifs((prev) => ({
        ...prev,
        [professorId]: [
          ...(prev[professorId] || []),
          motifs.find((m) => m.id === motifId),
        ],
      }));
    } catch (error) {
      console.error("Error assigning motif to professor:", error);
    }
  };

  const handleRemoveMotifFromProfessor = async (professorId, motifId) => {
    try {
      await scholchatService.removeMotifFromProfessor(professorId, motifId);

      // Update local state
      setProfessorMotifs((prev) => ({
        ...prev,
        [professorId]: (prev[professorId] || []).filter(
          (m) => m.id !== motifId
        ),
      }));
    } catch (error) {
      console.error("Error removing motif from professor:", error);
    }
  };

  const openUpdateModal = (professor) => {
    setCurrentProfessor(professor);
    setFormData({
      ...professor,
    });
    setShowUpdateModal(true);
  };

  const openMotifModal = (professor) => {
    setCurrentProfessor(professor);
    setShowMotifModal(true);
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      adresse: "",
      nomEtablissement: "",
      nomClasse: "",
      matriculeProfesseur: "",
      cniUrlRecto: "",
      cniUrlVerso: "",
      etat: "active",
    });
    setCurrentProfessor(null);
  };

  const handleImageUpload = async (event, field) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Assuming `uploadImage` is a service to upload and return the image URL
        const response = await scholchatService.uploadImage(formData);

        // Update the field with the uploaded image URL
        setFormData((prevData) => ({
          ...prevData,
          [field]: response.url,
        }));
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    }
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="relative w-96">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            placeholder="Search professors..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" /> Add Professor
          </button>
        </div>
      </div>

      {/* Motifs Management Section */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Manage Motifs</h2>
        <div className="flex mb-4">
          <input
            type="text"
            placeholder="Add new motif..."
            value={newMotif}
            onChange={(e) => setNewMotif(e.target.value)}
            className="flex-grow p-2 border rounded-l-md"
          />
          <button
            onClick={handleCreateMotif}
            className="px-4 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {motifs.map((motif) => (
            <div
              key={motif.id}
              className="flex items-center bg-gray-100 px-3 py-1 rounded-full"
            >
              <span>{motif.libelle}</span>
              <button
                onClick={() => handleDeleteMotif(motif.id)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

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
                  School
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Motifs
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProfessors.map((professor, index) => (
                <tr key={professor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    {professor.prenom} {professor.nom}
                  </td>
                  <td className="px-6 py-4">{professor.email}</td>
                  <td className="px-6 py-4">{professor.telephone}</td>
                  <td className="px-6 py-4">{professor.nomEtablissement}</td>
                  <td className="px-6 py-4">{professor.nomClasse}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        professor.etat === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {professor.etat}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {professorMotifs[professor.id]?.map((motif) => (
                        <span
                          key={motif.id}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {motif.libelle}
                        </span>
                      ))}
                      <button
                        onClick={() => openMotifModal(professor)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        <PlusCircle size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => openUpdateModal(professor)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full inline-flex items-center justify-center"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(professor.id)}
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

      {/* Create/Update Professor Modal */}
      <Modal
        isOpen={showCreateModal || showUpdateModal}
        onClose={() => {
          showCreateModal
            ? setShowCreateModal(false)
            : setShowUpdateModal(false);
          resetForm();
        }}
        title={showCreateModal ? "Add New Professor" : "Update Professor"}
      >
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.prenom}
                onChange={(e) =>
                  setFormData({ ...formData, prenom: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              className="w-full p-2 border rounded-md"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              className="w-full p-2 border rounded-md"
              value={formData.adresse}
              onChange={(e) =>
                setFormData({ ...formData, adresse: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.telephone}
                onChange={(e) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professor ID
              </label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.matriculeProfesseur}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    matriculeProfesseur: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School
              </label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.nomEtablissement}
                onChange={(e) =>
                  setFormData({ ...formData, nomEtablissement: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <input
                className="w-full p-2 border rounded-md"
                value={formData.nomClasse}
                onChange={(e) =>
                  setFormData({ ...formData, nomClasse: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Card Front <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "cniUrlRecto")}
                className="w-full p-2 border rounded-md"
              />
              {formData.cniUrlRecto && (
                <img
                  src={formData.cniUrlRecto}
                  alt="ID Card Front"
                  className="mt-2 w-32 h-32 object-cover rounded-md"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Card Back <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "cniUrlVerso")}
                className="w-full p-2 border rounded-md"
              />
              {formData.cniUrlVerso && (
                <img
                  src={formData.cniUrlVerso}
                  alt="ID Card Back"
                  className="mt-2 w-32 h-32 object-cover rounded-md"
                />
              )}
            </div>
          </div>

          {showUpdateModal && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.etat}
                  onChange={(e) =>
                    setFormData({ ...formData, etat: e.target.value })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                showCreateModal
                  ? setShowCreateModal(false)
                  : setShowUpdateModal(false);
                resetForm();
              }}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={showCreateModal ? handleCreate : handleUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showCreateModal ? "Create" : "Update"} Professor
            </button>
          </div>
        </form>
      </Modal>

      {/* Motif Assignment Modal */}
      <Modal
        isOpen={showMotifModal}
        onClose={() => {
          setShowMotifModal(false);
          setCurrentProfessor(null);
        }}
        title={`Manage Motifs for ${currentProfessor?.prenom} ${currentProfessor?.nom}`}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium mb-2">Current Motifs</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {currentProfessor &&
                professorMotifs[currentProfessor.id]?.map((motif) => (
                  <div
                    key={motif.id}
                    className="flex items-center bg-blue-100 px-3 py-1 rounded-full"
                  >
                    <span>{motif.libelle}</span>
                    <button
                      onClick={() =>
                        handleRemoveMotifFromProfessor(
                          currentProfessor.id,
                          motif.id
                        )
                      }
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              {currentProfessor &&
                (!professorMotifs[currentProfessor.id] ||
                  professorMotifs[currentProfessor.id].length === 0) && (
                  <p className="text-gray-500">No motifs assigned</p>
                )}
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium mb-2">Assign New Motifs</h3>
            <div className="flex flex-wrap gap-2">
              {motifs
                .filter(
                  (motif) =>
                    !professorMotifs[currentProfessor?.id]?.some(
                      (m) => m.id === motif.id
                    )
                )
                .map((motif) => (
                  <button
                    key={motif.id}
                    onClick={() =>
                      currentProfessor &&
                      handleAssignMotif(currentProfessor.id, motif.id)
                    }
                    className="bg-gray-100 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
                  >
                    {motif.libelle}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowMotifModal(false);
                setCurrentProfessor(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfessorPage;
