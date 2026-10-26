import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBuilding,
  faCircleExclamation,
  faMagnifyingGlass,
  faPlus,
  faSpinner,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
const GestionnairesManagement = () => {
  const [gestionnaires, setGestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    loadGestionnaires();
  }, []);
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);
  const loadGestionnaires = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("accessToken");
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/gestionnaires`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (resp.ok) setGestionnaires(await resp.json());
      else setError("Erreur lors du chargement");
    } catch (e) {
      setError("Erreur reseau");
    } finally {
      setLoading(false);
    }
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    if (
      !createForm.nom ||
      !createForm.prenom ||
      !createForm.email ||
      !createForm.password
    ) {
      setError("Nom, prenom, email et mot de passe sont obligatoires");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const token = localStorage.getItem("accessToken");
      // Create user as gestionnaire type
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/utilisateurs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "gestionnaire",
            nom: createForm.nom.trim(),
            prenom: createForm.prenom.trim(),
            email: createForm.email.trim(),
            telephone: createForm.telephone.trim()
              ? `+237${createForm.telephone.trim()}`
              : null,
            adresse: createForm.adresse.trim() || null,
            etat: "ACTIVE",
          }),
        },
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || "Erreur lors de la creation");
      }
      const newUser = await resp.json();

      // Set password for the gestionnaire via registerPassword
      try {
        await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/auth/registerPassword`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: createForm.email.trim(),
              passeAccess: createForm.password,
            }),
          },
        );
      } catch (pwErr) {
        console.warn("Could not set password:", pwErr);
      }
      setSuccess(
        `Gestionnaire ${createForm.prenom} ${createForm.nom} cree avec succes`,
      );
      setCreateForm({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        adresse: "",
        password: "",
      });
      setShowCreateModal(false);
      loadGestionnaires();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce gestionnaire ?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/utilisateurs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess("Gestionnaire supprime");
      loadGestionnaires();
    } catch (e) {
      setError("Erreur lors de la suppression");
    }
  };
  const filtered = gestionnaires.filter((g) => {
    const name = `${g.prenom || ""} ${g.nom || ""}`.toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      (g.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  return (
    <div className="p-2 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <FontAwesomeIcon
              icon={faBuilding}
              className="w-6 h-6 text-teal-600"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Gestionnaires
            </h1>
            <p className="text-sm text-gray-500">
              {gestionnaires.length} gestionnaire(s)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadGestionnaires}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={`w-5 h-5 text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" /> Creer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un gestionnaire..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <FontAwesomeIcon
            icon={faSpinner}
            className="w-8 h-8 animate-spin text-teal-600"
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <FontAwesomeIcon
            icon={faBuilding}
            className="w-12 h-12 text-gray-300 mx-auto mb-3"
          />
          <p className="text-gray-500 font-medium">Aucun gestionnaire</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm"
          >
            Creer un gestionnaire
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
                    {(g.prenom || "G").charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {g.prenom} {g.nom}
                    </h3>
                    <p className="text-xs text-gray-500">{g.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="w-4 h-4" />
                </button>
              </div>
              {g.telephone && (
                <p className="text-xs text-gray-500 mb-1">Tel: {g.telephone}</p>
              )}
              {g.etablissementsGeres && g.etablissementsGeres.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Etablissements:
                  </p>
                  {g.etablissementsGeres.map((e, i) => (
                    <span
                      key={i}
                      className="inline-block text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full mr-1 mb-1"
                    >
                      {e.nom}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${g.etat === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {g.etat === "ACTIVE" ? "Actif" : g.etat || "En attente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Creer un Gestionnaire
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prenom *
                  </label>
                  <input
                    type="text"
                    value={createForm.prenom}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        prenom: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border rounded-lg text-sm"
                    placeholder="Prenom"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={createForm.nom}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        nom: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border rounded-lg text-sm"
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  placeholder="Mot de passe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telephone
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +237
                  </span>
                  <input
                    type="tel"
                    value={createForm.telephone}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        telephone: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 9),
                      })
                    }
                    className="w-full px-3 py-2.5 border rounded-r-lg text-sm"
                    placeholder="6XXXXXXXX"
                    maxLength={9}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={createForm.adresse}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      adresse: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  placeholder="Adresse"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border rounded-lg text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="w-4 h-4 animate-spin"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                  )}
                  {creating ? "Creation..." : "Creer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default GestionnairesManagement;
