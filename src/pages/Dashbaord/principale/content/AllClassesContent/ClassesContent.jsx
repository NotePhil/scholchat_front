import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  XCircle,
  Building,
  Key,
  Info,
  Edit,
  AlertCircle,
  Clock,
  Loader2,
  Mail,
  LogIn,
} from "lucide-react";
import classService from "../../../../../services/ClassService";
import establishmentService from "../../../../../services/EstablishmentService";
import { useAuth } from "../../../../../context/AuthContext";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  ChevronRight,
  Filter,
  MoreVertical,
} from "lucide-react";

const ClassesContentMobile = ({
  classes,
  searchTerm,
  setSearchTerm,
  currentTab,
  setCurrentTab,
  onManageClass,
  onJoinByToken,
  onCreateClass,
  accessToken,
  setAccessToken,
  userRole,
  accessRequestCounts,
  programmationCounts
}) => {
  const tabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending" }
  ];

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.nom.toLowerCase().includes(searchTerm.toLowerCase());
    if (currentTab === "all") return matchesSearch;
    if (currentTab === "active") return matchesSearch && cls.statut === "ACTIF";
    if (currentTab === "pending") return matchesSearch && cls.statut === "EN_ATTENTE_APPROBATION";
    return matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 pb-32">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-black dark:text-white mb-6">Classes</h1>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 py-4 pl-12 pr-4 rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 outline-none focus:border-blue-500 transition-all dark:text-white"
          />
        </div>
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 rounded-[32px] text-white shadow-2xl shadow-blue-500/30 mb-8 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Key size={120} />
          </div>
          <h3 className="text-lg font-black mb-1">Access a Class</h3>
          <p className="text-blue-100/80 text-[10px] font-bold uppercase tracking-widest mb-4">Enter your access token</p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Token Code..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 placeholder:text-blue-200 outline-none focus:bg-white/30 transition-all text-sm font-bold"
            />
            <button
              onClick={onJoinByToken}
              className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all"
            >
              JOIN
            </button>
          </div>
        </div>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                currentTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-white dark:bg-slate-800 text-gray-500 border border-gray-100 dark:border-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 space-y-4">
        {filteredClasses.map((cls, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={cls.id}
            className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-xl border border-gray-100 dark:border-white/5 relative overflow-hidden"
          >
            {accessRequestCounts[cls.id] > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/20">
                {accessRequestCounts[cls.id]} NEW
              </div>
            )}
            <div className="flex items-center space-x-4 mb-5">
              <div className="p-4 bg-gray-50 dark:bg-slate-700/50 text-blue-600 rounded-3xl border border-blue-500/10">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black dark:text-white leading-tight">{cls.nom}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cls.matiere}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center space-x-2">
                <Users size={14} className="text-blue-500" />
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Students</p>
                  <p className="text-xs font-bold dark:text-white">{cls.eleves?.length || 0}</p>
                </div>
              </div>
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center space-x-2">
                    <BookOpen size={14} className="text-blue-500" />
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Cours programmés</p>
                      <p className="text-xs font-bold dark:text-white">3</p>
                    </div>
                  </div>
            </div>
            {cls.etablissement && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-slate-900/50 rounded-xl mb-6 border border-gray-100 dark:border-white/5">
                <Building size={14} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 truncate">{cls.etablissement.nom}</span>
              </div>
            )}
            <div className="flex space-x-2">
              <button
                onClick={() => onManageClass(cls.id)}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                ENTRER DANS LA CLASSE
              </button>
              <button className="p-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs transition-all active:scale-95">
                <MoreVertical size={18} />
              </button>
            </div>
          </motion.div>
        ))}

        {filteredClasses.length === 0 && (
          <div className="py-20 text-center">
            <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-4">
              <GraduationCap size={40} className="text-gray-400" />
            </div>
            <h4 className="font-bold dark:text-white">No classes match</h4>
            <p className="text-xs text-gray-500">Try adjusting your filters or search</p>
          </div>
        )}
      </div>

      {(userRole === "PROFESSEUR" || userRole === "ADMINISTRATEUR" || userRole === "ADMIN") && (
        <button
          onClick={onCreateClass}
          className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 z-[30] active:scale-95 transition-transform"
        >
          <Plus size={32} />
        </button>
      )}
    </div>
  );
};

const ClassesContent = ({ onManageClass, setActiveTab }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showEstablishmentModal, setShowEstablishmentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState({
    motifRejet: "Classe",
    commentaire: "",
  });
  const [accessToken, setAccessToken] = useState("");
  const [classes, setClasses] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestRole, setRequestRole] = useState("eleve");
  const [accessRequestCounts, setAccessRequestCounts] = useState({});
  const [programmationCounts, setProgrammationCounts] = useState({});

  const [newClass, setNewClass] = useState({
    nom: "",
    matiere: "",
    niveau: "",
    section: "",
    emploiDuTemps: "",
    salle: "",
    etablissementId: "",
    codeUnique: "",
    accesMajeur: false,
  });

  const [newEstablishment, setNewEstablishment] = useState({
    nom: "",
    optionEnvoiMailNewClasse: false,
    optionTokenGeneral: false,
    codeUnique: "",
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesData, establishmentsData] = await Promise.all([
          classService.getAllClasses(),
          establishmentService.getAllEstablishments(),
        ]);
        setClasses(classesData);
        setEstablishments(establishmentsData);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Load access request counts and programmation counts
  useEffect(() => {
    if (classes.length > 0) {
      loadAccessRequestCounts();
      loadProgrammationCounts();
    }
  }, [classes]);
  
  const loadAccessRequestCounts = async () => {
    try {
      const counts = {};
      await Promise.all(
        classes.map(async (classe) => {
          try {
            const response = await fetch(
              `${process.env.REACT_APP_API_BASE_URL}/acceder/demandes/classe/${classe.id}`
            );
            if (response.ok) {
              const requests = await response.json();
              const pendingCount = requests.filter(
                (req) => req.etat === "EN_ATTENTE"
              ).length;
              counts[classe.id] = pendingCount;
            }
          } catch (error) {
            counts[classe.id] = 0;
          }
        })
      );
      setAccessRequestCounts(counts);
    } catch (error) {
      console.error("Error loading access request counts:", error);
    }
  };

  const loadProgrammationCounts = async () => {
    try {
      console.log('Loading programmation counts for classes:', classes.map(c => c.id));
      const counts = {};
      
      // Get auth token
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No auth token found for programmation counts');
        return;
      }
      
      // Get current user ID
      const currentUserId = user?.id;
      if (!currentUserId) {
        console.warn('No current user ID found');
        return;
      }
      
      try {
        console.log(`Fetching accessible programmations for user ${currentUserId}`);
        
        // Get all accessible programmations for the current user
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/cours-programmes/accessible/${currentUserId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const accessibleProgrammations = await response.json();
          console.log(`Accessible programmations for user ${currentUserId}:`, accessibleProgrammations);
          
          // Count programmations by class
          classes.forEach(classe => {
            const classeProgrammations = accessibleProgrammations.filter(prog => 
              prog.classesIds && prog.classesIds.includes(classe.id)
            );
            counts[classe.id] = classeProgrammations.length;
            console.log(`Count for class ${classe.id} (${classe.nom}): ${counts[classe.id]}`);
          });
        } else {
          console.warn(`API call failed for accessible programmations:`, response.status, response.statusText);
          // Set all counts to 0 if API fails
          classes.forEach(classe => {
            counts[classe.id] = 0;
          });
        }
      } catch (error) {
        console.warn(`Could not load accessible programmations:`, error);
        // Set all counts to 0 if there's an error
        classes.forEach(classe => {
          counts[classe.id] = 0;
        });
      }
      
      console.log('Final programmation counts:', counts);
      setProgrammationCounts(counts);
    } catch (error) {
      console.error("Error loading programmation counts:", error);
    }
  };

  // Filter classes based on search term, tab, and user role
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.matiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.professeur &&
        cls.professeur.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cls.etablissement &&
        cls.etablissement.nom.toLowerCase().includes(searchTerm.toLowerCase()));

    let statusMatch = false;
    if (currentTab === "all") statusMatch = true;
    else if (currentTab === "active") statusMatch = cls.statut === "ACTIF";
    else if (currentTab === "inactive") statusMatch = cls.statut === "INACTIF";
    else if (currentTab === "pending")
      statusMatch = cls.statut === "EN_ATTENTE_APPROBATION";

    let roleMatch = true;
    if (user.role === "PROFESSEUR") {
      roleMatch = cls.professeur?.id === user.id;
    } else if (user.role === "ETABLISSEMENT") {
      roleMatch = cls.etablissement?.id === user.etablissementId;
    }

    return matchesSearch && statusMatch && roleMatch;
  });

  // Handle class creation
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const selectedEstablishment = establishments.find(
        (est) => est.id === newClass.etablissementId
      );

      if (selectedEstablishment) {
        if (selectedEstablishment.optionTokenGeneral && !newClass.codeUnique) {
          throw new Error("Cet établissement requiert un code unique !");
        }

        if (
          selectedEstablishment.optionTokenGeneral &&
          newClass.codeUnique !== selectedEstablishment.codeUnique
        ) {
          throw new Error("Code unique incorrect !");
        }
      }

      const classData = {
        nom: newClass.nom,
        matiere: newClass.matiere,
        niveau: newClass.niveau,
        section: newClass.section,
        emploiDuTemps: newClass.emploiDuTemps,
        salle: newClass.salle,
        etablissementId: newClass.etablissementId || null,
        accesMajeur: newClass.accesMajeur || false,
      };

      const createdClass = await classService.createClass(classData);
      setClasses([...classes, createdClass]);

      setShowCreateModal(false);
      setShowTokenModal(true);

      if (selectedEstablishment?.optionEnvoiMailNewClasse) {
        console.log("Email sent to establishment for approval");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle establishment creation
  const handleCreateEstablishment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const createdEstablishment =
        await establishmentService.createEstablishment(newEstablishment);
      setEstablishments([...establishments, createdEstablishment]);
      setShowEstablishmentModal(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle class approval/rejection
  const handleClassApproval = async (classId, approved) => {
    try {
      setLoading(true);
      if (approved) {
        const updatedClass = await classService.approveClass(classId);
        setClasses(
          classes.map((cls) => (cls.id === classId ? updatedClass : cls))
        );
      } else {
        setSelectedClass(classes.find((cls) => cls.id === classId));
        setShowRejectModal(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle class rejection with reason
  const handleRejectClass = async () => {
    try {
      setLoading(true);
      const updatedClass = await classService.rejectClass(
        selectedClass.id,
        rejectReason
      );
      setClasses(
        classes.map((cls) => (cls.id === selectedClass.id ? updatedClass : cls))
      );
      setShowRejectModal(false);
      setRejectReason({ motifRejet: "Classe", commentaire: "" });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle class activation/deactivation
  const handleToggleClassStatus = async (classId, action) => {
    try {
      setLoading(true);
      if (action === "deactivate") {
        setSelectedClass(classes.find((cls) => cls.id === classId));
        setShowRejectModal(true);
      } else {
        const updatedClass = await classService.activateClass(classId);
        setClasses(
          classes.map((cls) => (cls.id === classId ? updatedClass : cls))
        );
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle class access request
  const handleTokenAccess = async () => {
    try {
      if (!accessToken.trim()) {
        throw new Error("Veuillez entrer un token valide");
      }

      const foundClass = await classService.getClassByToken(accessToken);
      setSelectedClass(foundClass);
      setShowAccessModal(true);
    } catch (error) {
      setError(error.message);
    }
  };

  // Submit class access request
  const submitAccessRequest = async () => {
    try {
      setLoading(true);
      await classService.requestClassAccess(accessToken, requestRole);
      alert("Demande d'accès envoyée avec succès");
      setShowAccessModal(false);
      setAccessToken("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <AlertCircle className="inline mr-2" />
        {error}
      </div>
    );
  }

  const isMobile = useSelector((state) => state.ui.isMobile);

  if (isMobile) {
    return (
      <ClassesContentMobile 
        classes={classes}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onManageClass={onManageClass}
        onJoinByToken={handleTokenAccess}
        onCreateClass={() => setActiveTab ? setActiveTab("create-class") : setShowCreateModal(true)}
        accessToken={accessToken}
        setAccessToken={setAccessToken}
        userRole={user.role}
        accessRequestCounts={accessRequestCounts}
        programmationCounts={programmationCounts}
      />
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header with action buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Classes</h1>
          <p className="text-sm text-gray-500">
            Connecté en tant que: {user.role.toLowerCase()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition w-full md:w-auto justify-center"
            onClick={() => setAccessToken("")}
          >
            <Key size={18} className="mr-2" />
            Accéder à une Classe
          </button>

          {(user.role === "PROFESSEUR" || user.role === "ADMINISTRATEUR") && (
            <button
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full md:w-auto justify-center"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} className="mr-2" />
              Créer une Classe
            </button>
          )}

          {user.role === "ADMINISTRATEUR" && (
            <button
              className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition w-full md:w-auto justify-center"
              onClick={() => setShowEstablishmentModal(true)}
            >
              <Building size={18} className="mr-2" />
              Créer un Établissement
            </button>
          )}
        </div>
      </div>

      {/* Token access section */}
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

      {/* Tabs for filtering classes */}
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

          {(user.role === "ETABLISSEMENT" ||
            user.role === "ADMINISTRATEUR") && (
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

      {/* Search bar */}
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

      {/* Classes list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <div className="text-center py-12 text-gray-500 col-span-3">
            Aucune classe trouvée correspondant à vos critères
          </div>
        ) : (
          filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition ${
                cls.statut === "EN_ATTENTE" ? "border-yellow-300" : ""
              }`}
            >
              <div
                className={`p-4 ${
                  cls.statut === "ACTIF"
                    ? "bg-blue-50"
                    : cls.statut === "EN_ATTENTE"
                    ? "bg-yellow-50"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{cls.nom}</h3>
                    {accessRequestCounts[cls.id] > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse shadow-lg">
                        {accessRequestCounts[cls.id]}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      cls.statut === "ACTIF"
                        ? "bg-green-100 text-green-800"
                        : cls.statut === "EN_ATTENTE"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {cls.statut === "ACTIF"
                      ? "Active"
                      : cls.statut === "EN_ATTENTE"
                      ? "En Attente"
                      : "Inactive"}
                  </span>
                </div>

                <p className="text-gray-600 mt-1">
                  {cls.matiere} • Niveau {cls.niveau}-{cls.section}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  {cls.professeur?.nom || "Professeur non assigné"}
                </p>

                {cls.etablissement && (
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Building size={14} className="mr-1" />
                    <span>{cls.etablissement.nom}</span>
                  </div>
                )}

                {cls.historiqueActivations?.some(
                  (h) => h.action === "DESACTIVATION"
                ) && (
                  <div className="mt-2 text-xs text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    <span>
                      Désactivée:{" "}
                      {
                        cls.historiqueActivations.find(
                          (h) => h.action === "DESACTIVATION"
                        )?.motifRejet
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Users size={16} className="mr-1" />
                    <span>{cls.eleves?.length || 0} élèves</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <BookOpen size={16} className="mr-1" />
                    <span>{programmationCounts[cls.id] || 0} cours programmés</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-1" />
                  <span>{cls.emploiDuTemps}</span>
                </div>

                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <Clock size={16} className="mr-1" />
                  <span>
                    Créée le: {new Date(cls.dateCreation).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  {user.role === "PROFESSEUR" && (
                    <>
                      <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition">
                        Voir
                      </button>
                      {cls.statut === "ACTIF" && (
                        <button
                          onClick={() => onManageClass(cls.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <LogIn size={14} />
                          Entrer
                        </button>
                      )}
                    </>
                  )}

                  {user.role === "ETABLISSEMENT" &&
                    cls.statut === "EN_ATTENTE" && (
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

                  {(user.role === "ETABLISSEMENT" ||
                    user.role === "ADMINISTRATEUR") &&
                    cls.statut !== "EN_ATTENTE" && (
                      <button
                        className={`px-3 py-1 text-sm rounded transition ${
                          cls.statut === "ACTIF"
                            ? "border border-red-600 text-red-600 hover:bg-red-50"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                        onClick={() =>
                          handleToggleClassStatus(
                            cls.id,
                            cls.statut === "ACTIF" ? "deactivate" : "activate"
                          )
                        }
                      >
                        {cls.statut === "ACTIF" ? "Désactiver" : "Activer"}
                      </button>
                    )}

                  {user.role === "ADMINISTRATEUR" && (
                    <>
                      <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition">
                        <Edit size={14} />
                      </button>
                      {cls.statut === "EN_ATTENTE" && (
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

                  {(user.role === "ELEVE" || user.role === "PARENT") && (
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

                {cls.historiqueActivations?.length > 0 && (
                  <div className="border-t mt-4 pt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Historique d'Activation
                    </h4>
                    <div className="text-xs space-y-2">
                      {cls.historiqueActivations.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 p-2 rounded flex justify-between"
                        >
                          <div>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded ${
                                item.action === "ACTIVATION"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.action === "ACTIVATION"
                                ? "Activée"
                                : "Désactivée"}
                            </span>
                            {item.motifRejet && (
                              <span className="ml-2 text-gray-600">
                                Motif: {item.motifRejet}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500">
                            {new Date(item.dateCreation).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Class Modal */}
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
                    value={newClass.nom}
                    onChange={(e) =>
                      setNewClass({ ...newClass, nom: e.target.value })
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
                    value={newClass.matiere}
                    onChange={(e) =>
                      setNewClass({ ...newClass, matiere: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      checked={newClass.accesMajeur}
                      onChange={(e) =>
                        setNewClass({ ...newClass, accesMajeur: e.target.checked })
                      }
                    />
                    <div>
                      <span className="text-sm font-bold text-purple-900">Activer l'Accès Majeur (Étudiant Adulte)</span>
                      <p className="text-[10px] text-purple-600">L'ajout se fait uniquement par email (pas de demande d'accès standard)</p>
                    </div>
                  </label>
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
                      value={newClass.niveau}
                      onChange={(e) =>
                        setNewClass({ ...newClass, niveau: e.target.value })
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
                    value={newClass.emploiDuTemps}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        emploiDuTemps: e.target.value,
                      })
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
                    value={newClass.salle}
                    onChange={(e) =>
                      setNewClass({ ...newClass, salle: e.target.value })
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
                    value={newClass.etablissementId}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        etablissementId: e.target.value,
                        codeUnique: "",
                      })
                    }
                  >
                    <option value="">Aucun (Classe Indépendante)</option>
                    {establishments.map((est) => (
                      <option key={est.id} value={est.id}>
                        {est.nom}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <Info size={14} className="mr-1" />
                    <span>
                      {newClass.etablissementId
                        ? "Cette classe nécessitera l'approbation de l'établissement"
                        : "Les classes indépendantes nécessitent un paiement pour activation"}
                    </span>
                  </div>
                </div>

                {newClass.etablissementId &&
                  establishments.find(
                    (est) =>
                      est.id === newClass.etablissementId &&
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  disabled={loading}
                >
                  {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  Créer la Classe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Establishment Modal */}
      {showEstablishmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Créer un Établissement</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEstablishmentModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEstablishment}>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'Établissement*
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="ex: Lycée Descartes"
                    value={newEstablishment.nom}
                    onChange={(e) =>
                      setNewEstablishment({
                        ...newEstablishment,
                        nom: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code Unique
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Entrez un code unique pour l'établissement"
                    value={newEstablishment.codeUnique}
                    onChange={(e) =>
                      setNewEstablishment({
                        ...newEstablishment,
                        codeUnique: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="optionEnvoiMail"
                    className="mr-2"
                    checked={newEstablishment.optionEnvoiMailNewClasse}
                    onChange={(e) =>
                      setNewEstablishment({
                        ...newEstablishment,
                        optionEnvoiMailNewClasse: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor="optionEnvoiMail"
                    className="text-sm text-gray-700"
                  >
                    Validation nouvelle classe
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="optionTokenGeneral"
                    className="mr-2"
                    checked={newEstablishment.optionTokenGeneral}
                    onChange={(e) =>
                      setNewEstablishment({
                        ...newEstablishment,
                        optionTokenGeneral: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor="optionTokenGeneral"
                    className="text-sm text-gray-700"
                  >
                    Requérir un code unique pour les classes
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setShowEstablishmentModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
                  disabled={loading}
                >
                  {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  Créer l'Établissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Token Modal */}
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
                CLASS-
                {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {newClass.etablissementId
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

      {/* Payment Modal */}
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

            <form onSubmit={handleCreateClass}>
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

      {/* Access Request Modal */}
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
                Vous demandez l'accès à : <strong>{selectedClass.nom}</strong>
              </p>
              <p className="text-gray-500 text-sm mt-1">
                <span className="flex items-center">
                  <Users size={14} className="mr-1" />{" "}
                  {selectedClass.professeur?.nom || "Professeur non spécifié"}
                </span>
                {selectedClass.etablissement && (
                  <span className="flex items-center mt-1">
                    <Building size={14} className="mr-1" />{" "}
                    {selectedClass.etablissement.nom}
                  </span>
                )}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Demande en tant que
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={requestRole}
                onChange={(e) => setRequestRole(e.target.value)}
              >
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
                onClick={submitAccessRequest}
              >
                Envoyer la Demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject/Deactivate Modal */}
      {showRejectModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedClass.statut === "EN_ATTENTE"
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
                  {selectedClass.statut === "EN_ATTENTE"
                    ? "rejeter"
                    : "désactiver"}{" "}
                  : <strong>{selectedClass.nom}</strong>
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
                  {selectedClass.statut === "EN_ATTENTE"
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
