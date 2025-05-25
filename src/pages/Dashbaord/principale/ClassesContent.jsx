import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  XCircle,
  Mail,
  Building,
  Key,
  Info,
  Edit,
  AlertCircle,
  MoreVertical,
  Clock,
} from "lucide-react";

const ClassesContent = ({ onManageClass }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState({
    motifRejet: "Classe",
    commentaire: "",
  });
  const [userRole, setUserRole] = useState("professeur");
  const [accessToken, setAccessToken] = useState("");

  const classes = [
    {
      id: 1,
      name: "10A - Mathématiques",
      subject: "Mathématiques",
      grade: "10",
      section: "A",
      professor: "Dr. Richard Martinez",
      students: 28,
      schedule: "Lun, Mer, Ven 9:00 - 10:30",
      room: "B-103",
      status: "active",
      establishment: "Lycée Lincoln",
      token: "LHS-10A-MATH-2025",
      createdAt: "15/01/2025",
      activationHistory: [
        {
          date: "15/01/2025",
          action: "activated",
          by: "Dr. Richard Martinez",
        },
      ],
    },
    {
      id: 2,
      name: "9B - Sciences",
      subject: "Sciences",
      grade: "9",
      section: "B",
      professor: "Prof. Elizabeth Chen",
      students: 25,
      schedule: "Mar, Jeu 10:45 - 12:15",
      room: "Lab-201",
      status: "active",
      establishment: "Lycée Lincoln",
      token: "LHS-9B-SCI-2025",
      createdAt: "01/02/2025",
      activationHistory: [
        {
          date: "01/02/2025",
          action: "activated",
          by: "Prof. Elizabeth Chen",
        },
      ],
    },
    {
      id: 3,
      name: "11A - Littérature",
      subject: "Français",
      grade: "11",
      section: "A",
      professor: "Mr. Thomas Wilson",
      students: 22,
      schedule: "Lun, Mer 13:00 - 14:30",
      room: "A-205",
      status: "inactive",
      establishment: "Lycée Lincoln",
      token: "LHS-11A-LIT-2025",
      createdAt: "20/11/2024",
      deactivationHistory: {
        date: "10/03/2025",
        motifRejet: "Autre",
        comment: "Classe suspendue pour restructuration",
      },
      activationHistory: [
        {
          date: "20/11/2024",
          action: "activated",
          by: "Mr. Thomas Wilson",
        },
        {
          date: "10/03/2025",
          action: "deactivated",
          by: "Admin",
          motifRejet: "Autre",
          comment: "Classe suspendue pour restructuration",
        },
      ],
    },
    {
      id: 4,
      name: "10C - Histoire",
      subject: "Histoire",
      grade: "10",
      section: "C",
      professor: "Mme Sarah Johnson",
      students: 26,
      schedule: "Mar, Jeu 14:45 - 16:15",
      room: "C-107",
      status: "active",
      establishment: null,
      token: "INDP-10C-HIST-2025",
      createdAt: "15/02/2025",
      activationHistory: [
        {
          date: "15/02/2025",
          action: "activated",
          by: "Mme Sarah Johnson",
        },
      ],
    },
    {
      id: 5,
      name: "12A - Mathématiques Avancées",
      subject: "Mathématiques",
      grade: "12",
      section: "A",
      professor: "Dr. Richard Martinez",
      students: 20,
      schedule: "Lun, Mer, Ven 11:00 - 12:30",
      room: "B-205",
      status: "pending",
      establishment: "Académie Edison",
      token: null,
      createdAt: "01/05/2025",
    },
  ];

  const establishments = [
    {
      id: 1,
      name: "Lycée Lincoln",
      optionEnvoiMailNewClasse: true,
      optionTokenGeneral: true,
      codeUnique: "LHS2025",
    },
    {
      id: 2,
      name: "Académie Edison",
      optionEnvoiMailNewClasse: true,
      optionTokenGeneral: false,
    },
    {
      id: 3,
      name: "Collège Washington",
      optionEnvoiMailNewClasse: false,
      optionTokenGeneral: false,
    },
  ];

  const [newClass, setNewClass] = useState({
    name: "",
    subject: "",
    grade: "",
    section: "",
    schedule: "",
    room: "",
    establishment: "",
    codeUnique: "",
  });

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.professor &&
        cls.professor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cls.establishment &&
        cls.establishment.toLowerCase().includes(searchTerm.toLowerCase()));

    let statusMatch = false;
    if (currentTab === "all") statusMatch = true;
    else if (currentTab === "active") statusMatch = cls.status === "active";
    else if (currentTab === "inactive") statusMatch = cls.status === "inactive";
    else if (currentTab === "pending") statusMatch = cls.status === "pending";

    let roleMatch = true;
    if (userRole === "professeur") {
      roleMatch = true;
    } else if (userRole === "etablissement") {
      roleMatch = cls.establishment !== null;
    } else if (userRole === "eleve") {
      roleMatch = cls.status === "active";
    } else if (userRole === "parent") {
      roleMatch = cls.status === "active";
    }

    return matchesSearch && statusMatch && roleMatch;
  });

  const handleCreateClass = (e) => {
    e.preventDefault();
    const selectedEstablishment = establishments.find(
      (est) => est.name === newClass.establishment
    );

    if (selectedEstablishment) {
      if (selectedEstablishment.optionTokenGeneral && !newClass.codeUnique) {
        alert("Cet établissement requiert un code unique !");
        return;
      }

      if (
        selectedEstablishment.optionTokenGeneral &&
        newClass.codeUnique !== selectedEstablishment.codeUnique
      ) {
        alert("Code unique incorrect !");
        return;
      }

      setShowCreateModal(false);
      setShowTokenModal(true);

      if (selectedEstablishment.optionEnvoiMailNewClasse) {
        console.log("Envoi d'email de vérification à l'établissement");
      }
    } else {
      setShowCreateModal(false);
      setShowPaymentModal(true);
    }

    setNewClass({
      name: "",
      subject: "",
      grade: "",
      section: "",
      schedule: "",
      room: "",
      establishment: "",
      codeUnique: "",
    });
  };

  const handlePayment = (e) => {
    e.preventDefault();
    setShowPaymentModal(false);
    setShowTokenModal(true);
  };

  const handleTokenAccess = () => {
    if (!accessToken.trim()) {
      alert("Veuillez entrer un token valide");
      return;
    }

    const foundClass = classes.find((cls) => cls.token === accessToken);
    if (foundClass) {
      setSelectedClass(foundClass);
      setShowAccessModal(true);
    } else {
      alert("Token invalide. Veuillez réessayer.");
    }

    setAccessToken("");
  };

  const handleClassApproval = (classId, approved) => {
    if (approved) {
      alert("Classe approuvée avec succès");
    } else {
      setSelectedClass(classes.find((cls) => cls.id === classId));
      setShowRejectModal(true);
    }
  };

  const handleRejectClass = () => {
    alert(
      `Classe rejetée. Motif: ${rejectReason.motifRejet}, Commentaire: ${rejectReason.commentaire}`
    );
    setShowRejectModal(false);
    setRejectReason({
      motifRejet: "Classe",
      commentaire: "",
    });
  };

  const handleToggleClassStatus = (classId, action) => {
    if (action === "deactivate") {
      setSelectedClass(classes.find((cls) => cls.id === classId));
      setShowRejectModal(true);
    } else {
      alert("Classe activée avec succès");
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Classes</h1>
          <div className="mt-2">
            <select
              className="border rounded px-3 py-1 text-sm"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            >
              <option value="professeur">Professeur</option>
              <option value="administrateur">Administrateur</option>
              <option value="etablissement">Établissement</option>
              <option value="eleve">Élève</option>
              <option value="parent">Parent</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition w-full md:w-auto justify-center"
            onClick={() => setAccessToken("")}
          >
            <Key size={18} className="mr-2" />
            Accéder à une Classe
          </button>

          {(userRole === "professeur" || userRole === "administrateur") && (
            <button
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full md:w-auto justify-center"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} className="mr-2" />
              Créer une Classe
            </button>
          )}
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-4 mb-6 flex flex-col md:flex-row items-center">
        <div className="flex-1 w-full">
          <h3 className="text-lg font-medium text-green-800">
            Accéder à une Classe
          </h3>
          <p className="text-green-600 text-sm mb-3">
            Entrez un token valide pour demander l'accès
          </p>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Entrez le token de la classe..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              onClick={handleTokenAccess}
            >
              Demander l'Accès
            </button>
          </div>
        </div>
        <div className="hidden md:block ml-4">
          <div className="bg-green-200 rounded-full p-3">
            <Key size={24} className="text-green-700" />
          </div>
        </div>
      </div>

      <div className="border-b mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 font-medium ${
              currentTab === "all"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setCurrentTab("all")}
          >
            Toutes les Classes
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              currentTab === "active"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setCurrentTab("active")}
          >
            Actives
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              currentTab === "inactive"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setCurrentTab("inactive")}
          >
            Inactives
          </button>

          {(userRole === "etablissement" || userRole === "administrateur") && (
            <button
              className={`px-4 py-2 font-medium ${
                currentTab === "pending"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setCurrentTab("pending")}
            >
              En Attente
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher des classes..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition ${
              cls.status === "pending" ? "border-yellow-300" : ""
            }`}
          >
            <div
              className={`p-4 ${
                cls.status === "active"
                  ? "bg-blue-50"
                  : cls.status === "pending"
                  ? "bg-yellow-50"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{cls.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    cls.status === "active"
                      ? "bg-green-100 text-green-800"
                      : cls.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {cls.status === "active"
                    ? "Active"
                    : cls.status === "pending"
                    ? "En Attente"
                    : "Inactive"}
                </span>
              </div>

              <p className="text-gray-600 mt-1">
                {cls.subject} • Niveau {cls.grade}-{cls.section}
              </p>

              <p className="text-sm text-gray-500 mt-2">{cls.professor}</p>

              {cls.establishment && (
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Building size={14} className="mr-1" />
                  <span>{cls.establishment}</span>
                </div>
              )}

              {cls.deactivationHistory && (
                <div className="mt-2 text-xs text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  <span>Désactivée: {cls.deactivationHistory.motifRejet}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Users size={16} className="mr-1" />
                  <span>{cls.students} élèves</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <BookOpen size={16} className="mr-1" />
                  <span>{cls.room}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-1" />
                <span>{cls.schedule}</span>
              </div>

              <div className="mt-3 flex items-center text-sm text-gray-600">
                <Clock size={16} className="mr-1" />
                <span>Créée le: {cls.createdAt}</span>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {userRole === "professeur" && (
                  <>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition">
                      Voir
                    </button>
                    {cls.status === "active" && (
                      <button
                        onClick={() => onManageClass(cls.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Gérer
                      </button>
                    )}
                  </>
                )}

                {userRole === "etablissement" && cls.status === "pending" && (
                  <>
                    <button
                      className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 transition"
                      onClick={() => handleClassApproval(cls.id, false)}
                    >
                      Rejeter
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                      onClick={() => handleClassApproval(cls.id, true)}
                    >
                      Approuver
                    </button>
                  </>
                )}

                {(userRole === "etablissement" ||
                  userRole === "administrateur") &&
                  cls.status !== "pending" && (
                    <button
                      className={`px-3 py-1 text-sm rounded transition ${
                        cls.status === "active"
                          ? "border border-red-600 text-red-600 hover:bg-red-50"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      onClick={() =>
                        handleToggleClassStatus(
                          cls.id,
                          cls.status === "active" ? "deactivate" : "activate"
                        )
                      }
                    >
                      {cls.status === "active" ? "Désactiver" : "Activer"}
                    </button>
                  )}

                {userRole === "administrateur" && (
                  <>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition">
                      <Edit size={14} />
                    </button>
                    {cls.status === "pending" && (
                      <>
                        <button
                          className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 transition"
                          onClick={() => handleClassApproval(cls.id, false)}
                        >
                          Rejeter
                        </button>
                        <button
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                          onClick={() => handleClassApproval(cls.id, true)}
                        >
                          Approuver
                        </button>
                      </>
                    )}
                  </>
                )}

                {(userRole === "eleve" || userRole === "parent") && (
                  <button
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    onClick={() => {
                      setSelectedClass(cls);
                      setShowAccessModal(true);
                    }}
                  >
                    Demander l'Accès
                  </button>
                )}
              </div>

              {cls.activationHistory && (
                <div className="border-t mt-4 pt-4">
                  <h4 className="text-sm font-medium mb-2">
                    Historique d'Activation
                  </h4>
                  <div className="text-xs space-y-2">
                    {cls.activationHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 p-2 rounded flex justify-between"
                      >
                        <div>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded ${
                              item.action === "activated"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.action === "activated"
                              ? "Activée"
                              : "Désactivée"}
                          </span>
                          {item.motifRejet && (
                            <span className="ml-2 text-gray-600">
                              Motif: {item.motifRejet}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500">{item.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune classe trouvée correspondant à vos critères
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Créer une Nouvelle Classe</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClass}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la Classe
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="ex: 10A - Mathématiques"
                    value={newClass.name}
                    onChange={(e) =>
                      setNewClass({ ...newClass, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matière
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="ex: Mathématiques"
                    value={newClass.subject}
                    onChange={(e) =>
                      setNewClass({ ...newClass, subject: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau & Section
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-1/2 border rounded-lg px-3 py-2"
                      placeholder="Niveau"
                      value={newClass.grade}
                      onChange={(e) =>
                        setNewClass({ ...newClass, grade: e.target.value })
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-1/2 border rounded-lg px-3 py-2"
                      placeholder="Section"
                      value={newClass.section}
                      onChange={(e) =>
                        setNewClass({ ...newClass, section: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emploi du Temps
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="ex: Lun, Mer 9:00-10:30"
                    value={newClass.schedule}
                    onChange={(e) =>
                      setNewClass({ ...newClass, schedule: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salle
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="ex: B-103"
                    value={newClass.room}
                    onChange={(e) =>
                      setNewClass({ ...newClass, room: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Établissement (Optionnel)
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={newClass.establishment}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        establishment: e.target.value,
                      })
                    }
                  >
                    <option value="">Aucun (Classe Indépendante)</option>
                    {establishments.map((est) => (
                      <option key={est.id} value={est.name}>
                        {est.name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <Info size={14} className="mr-1" />
                    <span>
                      {newClass.establishment
                        ? "Cette classe nécessitera l'approbation de l'établissement"
                        : "Les classes indépendantes nécessitent un paiement pour activation"}
                    </span>
                  </div>
                </div>

                {newClass.establishment &&
                  establishments.find(
                    (est) =>
                      est.name === newClass.establishment &&
                      est.optionTokenGeneral
                  ) && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code de l'Établissement
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Entrez le code unique fourni par votre établissement"
                        value={newClass.codeUnique}
                        onChange={(e) =>
                          setNewClass({
                            ...newClass,
                            codeUnique: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Créer la Classe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Classe Créée avec Succès</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowTokenModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>

              <h3 className="text-lg font-medium mb-2">
                Votre token de classe est:
              </h3>
              <div className="bg-gray-100 p-4 rounded-lg text-xl font-mono mb-4">
                CLASS-12345-TOKEN
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {newClass.establishment
                  ? "Votre classe est en attente d'approbation par l'établissement. Vous pourrez utiliser ce token une fois approuvée."
                  : "Votre classe est maintenant active. Partagez ce token avec les élèves et parents pour leur donner accès."}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={() => setShowTokenModal(false)}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Paiement Requis</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowPaymentModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handlePayment}>
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Les classes indépendantes nécessitent un paiement unique pour
                  activation.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de Carte
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'Expiration
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="MM/AA"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom sur la Carte
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Payer & Activer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccessModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Demande d'Accès</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAccessModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">
                Vous demandez l'accès à : <strong>{selectedClass.name}</strong>
              </p>
              <p className="text-gray-500 text-sm mt-1">
                <span className="flex items-center">
                  <Users size={14} className="mr-1" /> {selectedClass.professor}
                </span>
                {selectedClass.establishment && (
                  <span className="flex items-center mt-1">
                    <Building size={14} className="mr-1" />{" "}
                    {selectedClass.establishment}
                  </span>
                )}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Demande en tant que
              </label>
              <select className="w-full border rounded-lg px-3 py-2">
                <option value="eleve">Élève</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setShowAccessModal(false)}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={() => {
                  alert("Demande d'accès envoyée avec succès");
                  setShowAccessModal(false);
                }}
              >
                Envoyer la Demande
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedClass.status === "pending"
                  ? "Rejeter la Classe"
                  : "Désactiver la Classe"}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowRejectModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRejectClass();
              }}
            >
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Vous êtes sur le point de{" "}
                  {selectedClass.status === "pending"
                    ? "rejeter"
                    : "désactiver"}{" "}
                  : <strong>{selectedClass.name}</strong>
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motif du Rejet/Désactivation
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={rejectReason.motifRejet}
                    onChange={(e) =>
                      setRejectReason({
                        ...rejectReason,
                        motifRejet: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="Classe">Problème avec la Classe</option>
                    <option value="Photo">Problème avec les Photos</option>
                    <option value="Autre">Autre Raison</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaires
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-24"
                    placeholder="Fournissez des informations supplémentaires..."
                    value={rejectReason.commentaire}
                    onChange={(e) =>
                      setRejectReason({
                        ...rejectReason,
                        commentaire: e.target.value,
                      })
                    }
                    required
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setShowRejectModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  {selectedClass.status === "pending"
                    ? "Confirmer le Rejet"
                    : "Confirmer la Désactivation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesContent;
