// ManageClassDetailsView.jsx - UPDATED VERSION WITH SELF-APPROVAL FEATURE
import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  message,
  Modal,
  Input,
  Select,
  Button,
  Tag,
  Divider,
  Typography,
  Card,
  Space,
  Alert,
  Spin,
  Tabs,
  List,
  Checkbox,
  Table,
} from "antd";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Settings,
  Shield,
  History,
  CheckCircle,
  XCircle,
  GraduationCap,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  UserPlus,
  RefreshCw,
  Check,
  X as XIcon,
  User,
  FileText,
  School,
  Activity,
  Copy,
  Crown,
  Trash2,
  Clock,
  Eye,
} from "lucide-react";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  HistoryOutlined,
  UserAddOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  SearchOutlined,
  CrownOutlined,
  CopyOutlined,
  FileTextOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Row, Col, Descriptions } from "antd";
import { classService } from "../../../../services/ClassService";
import { rejectionServiceClass } from "../../../../services/RejectionServiceClass";
import { scholchatService } from "../../../../services/ScholchatService";
import UserViewModalParentStudent from "../modals/UserViewModalParentStudent";
import UserViewModal from "../modals/UserViewModal";
import UserViewEleve from "../modals/UserViewEleve";
import ClassAccessRequests from "./ClassAccessRequests";
import PublicationRightsService from "../../../../services/PublicationRightsService";
import AccederService, {
  EtatDemandeAcces,
} from "../../../../services/accederService";
import { coursProgrammerService } from "../../../../services/coursProgrammerService";
import { exerciseProgrammerService } from "../../../../services/exerciseProgrammerService";
import { activityFeedService } from "../../../../services/ActivityFeedService";

// Import separated components
import UserTables from "./components/UserTables";
import StatisticsCards from "./components/StatisticsCards";

import "./ManageClassDetailsView.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;

// Component to render the appropriate modal based on user type
const RenderUserModal = ({ user, visible, onClose }) => {
  const getUserType = (user) => {
    if (user.type) return user.type;
    if (user.typeUtilisateur) return user.typeUtilisateur;
    if (user.role) return user.role;

    // Deduction based on existing properties
    if (user.nomEtablissement || user.matriculeProfesseur) return "PROFESSEUR";
    if (user.niveau) return "ELEVE";
    if (user.adresse && !user.niveau && !user.nomEtablissement) return "PARENT";

    return "UTILISATEUR"; // Default to utilisateur if unknown
  };

  const userType = getUserType(user);

  console.log("Rendering modal for user type:", userType, user);

  switch (userType.toUpperCase()) {
    case "ELEVE":
    case "ÉLÈVE":
    case "ELEVES":
      return <UserViewEleve visible={visible} user={user} onClose={onClose} />;

    case "PARENT":
    case "PARENTS":
      return (
        <UserViewModalParentStudent
          visible={visible}
          user={user}
          onClose={onClose}
        />
      );

    case "PROFESSEUR":
    case "PROFESSOR":
    case "PROFESSEURS":
      return <UserViewModal visible={visible} user={user} onClose={onClose} />;

    case "UTILISATEUR":
    default:
      return <UserViewModal visible={visible} user={user} onClose={onClose} />;
  }
};


/* ── Scrollable tab bar with arrow buttons ─────────────────────────────── */
const TabScrollBar = ({ activeTab, onTabChange, tabs }) => {
  const ref = React.useRef(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  const check = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [tabs]);

  const scroll = (dir) => ref.current?.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });

  return (
    <div className="bg-white border-b border-slate-200 relative">
      {canLeft && (
        <button onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-1.5 bg-gradient-to-r from-white via-white to-transparent">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all">
            <ChevronLeft size={14} />
          </span>
        </button>
      )}
      {canRight && (
        <button onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 flex items-center px-1.5 bg-gradient-to-l from-white via-white to-transparent">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all">
            <ChevronRight size={14} />
          </span>
        </button>
      )}
      <div ref={ref} className="flex overflow-x-auto px-3 sm:px-6" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => onTabChange(tab.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 py-3 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ManageClassDetailsView = ({ classId, onBack, initialTab, onNavigateToCourseCreation, onNavigateToExerciseManagement, onNavigateToCoursManagement }) => {
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || "overview");
  const [actionLoading, setActionLoading] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  // Users data from new approach - UPDATED to include utilisateurs
  const [users, setUsers] = useState({
    professeurs: [],
    eleves: [],
    parents: [],
    utilisateurs: [], // NEW: Add utilisateurs category
    accessRequests: [],
  });

  // Statistics - UPDATED to include utilisateurs
  const [statistics, setStatistics] = useState({
    professeurs: 0,
    eleves: 0,
    parents: 0,
    utilisateurs: 0, // NEW: Add utilisateurs count
    accessRequests: 0,
  });

  // Modal states
  const [userViewModalVisible, setUserViewModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [moderatorModalVisible, setModeratorModalVisible] = useState(false);
  const [publicationRightsModalVisible, setPublicationRightsModalVisible] =
    useState(false);

  // Admin class approval/rejection modal state
  const [classRejectModalVisible, setClassRejectModalVisible] = useState(false);
  const [classRejectMotifs, setClassRejectMotifs] = useState([]);
  const [classRejectSelectedCode, setClassRejectSelectedCode] = useState("");
  const [classRejectMotifSupp, setClassRejectMotifSupp] = useState("");
  const [classRejectMotifsLoading, setClassRejectMotifsLoading] = useState(false);

  // Form and data states
  const [form] = Form.useForm();
  const [history, setHistory] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [rejectionMotifs, setRejectionMotifs] = useState([]);
  const [selectedPublicationRight, setSelectedPublicationRight] = useState("");
  
  // NEW: Additional module states
  const [courses, setCourses] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [events, setEvents] = useState([]);
  const [moduleLoading, setModuleLoading] = useState(false);

  // Publication rights states
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUserForRights, setSelectedUserForRights] = useState(null);
  const [publicationRights, setPublicationRights] = useState({
    peutPublier: true,
    peutModerer: false,
  });

  // NEW: Moderator assignment states
  const [moderatorSearchQuery, setModeratorSearchQuery] = useState("");
  const [moderatorSearchResults, setModeratorSearchResults] = useState([]);
  const [moderatorSearchLoading, setModeratorSearchLoading] = useState(false);
  const [selectedModerator, setSelectedModerator] = useState(null);

  // NEW: States for moderator and publication rights management
  const [moderatorsWithRights, setModeratorsWithRights] = useState([]);
  const [usersWithPublicationRights, setUsersWithPublicationRights] = useState(
    []
  );

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Get user role and ID from localStorage
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");

    if (role) {
      setUserRole(role.toUpperCase());
    }
    if (userId) {
      setCurrentUserId(userId);
    }

    if (classId) {
      loadClassDetails();
      fetchProfessors();
      fetchRejectionMotifs();
    }
  }, [classId, refreshKey]);

  // NEW: Check if current user can self-approve/reject this class
  const canSelfApproveReject = () => {
    if (!classDetails || !currentUserId) return false;

    // Check if class has no establishment and payment is OK
    const hasNoEstablishment =
      !classDetails.etablissement ||
      !classDetails.etablissement.id ||
      classDetails.etablissement.id === "";

    // Check if current user is the creator of the class
    // If no creator is set and user is a professor, assume they can manage independent classes
    const isCreator =
      classDetails.createurId === currentUserId ||
      classDetails.utilisateurId === currentUserId ||
      classDetails.createur_id === currentUserId ||
      classDetails.cree_par === currentUserId ||
      (!classDetails.createurId && !classDetails.etablissement && userRole === "ROLE_PROFESSOR");
      
    console.log("Creator check details:", {
      createurId: classDetails.createurId,
      utilisateurId: classDetails.utilisateurId,
      createur_id: classDetails.createur_id,
      cree_par: classDetails.cree_par,
      currentUserId,
      userRole,
      hasNoEstablishment: !classDetails.etablissement,
      isCreator
    });

    // Check if payment is OK - for independent classes, payment is not required
    const paymentOk =
      classDetails.paymentStatus === "SUCCESS" ||
      classDetails.paiementEffectue === true ||
      classDetails.etat === "ACTIF" ||
      !classDetails.paymentRequired; // If payment not required, consider it OK

    console.log("Self-approval check:", {
      hasNoEstablishment,
      isCreator,
      paymentOk,
      classDetails,
      currentUserId,
    });

    return hasNoEstablishment && isCreator && paymentOk;
  };

  // NEW: Check if class is pending approval
  const isClassPendingApproval = () => {
    return (
      classDetails?.etat === "EN_ATTENTE_APPROBATION" ||
      classDetails?.etat === "PENDING"
    );
  };

  const loadClassDetails = async () => {
    try {
      setLoading(true);
      const details = await classService.obtenirClasseParId(classId);
      console.log("Class details loaded:", details);
      console.log("All class detail fields:", Object.keys(details));
      console.log("Complete class details object:", JSON.stringify(details, null, 2));
      
      // Handle missing fields from backend - map database field names
      const enrichedDetails = {
        ...details,
        // Map database field names to frontend expected names
        dateCreation: details.dateCreation || details.date_creation || null,
        createurId: details.createurId || details.createur_id || details.cree_par || details.utilisateur_id || currentUserId,
        droitPublication: details.droitPublication || details.droit_publication || "PROFESSEURS_SEULEMENT",
        etablissement: details.etablissement || (details.etablissement_id ? { id: details.etablissement_id } : null),
        moderatorId: details.moderatorId || details.moderator_id || null
      };
      
      console.log("Enriched class details:", enrichedDetails);
      setClassDetails(enrichedDetails);
      setSelectedPublicationRight(
        details.droitPublication || "PROFESSEURS_SEULEMENT"
      );

      // Load all user data in sequence to avoid race conditions
      const accessResult = await loadUsersWithAccess();
      await loadAccessRequests();
      await loadModeratorsAndRights();
      
      // Load additional modules
      await Promise.all([
        loadCourses(),
        loadExercises(),
        loadEvents()
      ]);
    } catch (error) {
      message.error("Erreur lors du chargement des détails de la classe");
      console.error("Error loading class details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Alternative method to load students if main method fails
  const loadStudentsAlternative = async (elevesAlreadyLoaded = 0) => {
    try {
      // Only run if no students were loaded via the main method
      if (elevesAlreadyLoaded === 0) {
        console.log("Trying alternative method to load students...");

        // Récupérer tous les étudiants du système
        const allStudents = await scholchatService.getAllStudents();
        console.log("Tous les étudiants du système:", allStudents);

        if (allStudents && allStudents.length > 0) {
          // Try to filter students who might belong to this class
          // This is a fallback - the main method should handle this properly
          const potentialStudents = allStudents.filter(
            (student) =>
              student.classeId === classId ||
              (student.classes &&
                student.classes.some((cls) => cls.id === classId))
          );

          console.log(
            "Étudiants potentiels pour cette classe:",
            potentialStudents
          );

          if (potentialStudents.length > 0) {
            setUsers((prev) => ({
              ...prev,
              eleves: [...prev.eleves, ...potentialStudents],
            }));

            setStatistics((prev) => ({
              ...prev,
              eleves: prev.eleves + potentialStudents.length,
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error in alternative student loading:", error);
      // Don't show error to user as this is just a fallback
    }
  };

  // NEW: Function to load moderator and publication rights information
  const loadModeratorsAndRights = async () => {
    try {
      // Get users with publication rights for this class
      const rightsResult =
        await PublicationRightsService.getUsersWithRightsForClass(classId);
      if (rightsResult.success) {
        const rightsUsers = rightsResult.data || [];
        setUsersWithPublicationRights(rightsUsers);
        console.log("Users with publication rights:", rightsUsers);

        // Get moderators (users with moderation rights)
        const moderators = rightsUsers.filter((user) => user.peutModerer);
        setModeratorsWithRights(moderators);
        console.log("Moderators with rights:", moderators);

        // IMPORTANT: Merge publication rights users into the main users state
        // This ensures professors with publication rights are displayed in the table
        if (rightsUsers.length > 0) {
          setUsers((prevUsers) => {
            // Get existing IDs to avoid duplicates
            const existingIds = new Set([
              ...prevUsers.professeurs.map(u => u.id),
              ...prevUsers.eleves.map(u => u.id),
              ...prevUsers.parents.map(u => u.id),
              ...prevUsers.utilisateurs.map(u => u.id)
            ]);
            
            console.log("Existing user IDs before merge:", Array.from(existingIds));
            
            const categorized = { professeurs: [], eleves: [], parents: [], utilisateurs: [] };
            
            rightsUsers.forEach((user) => {
              // Only add if not already in the list
              if (!existingIds.has(user.id)) {
                const userType = (user.typeUtilisateur || user.type || "").toUpperCase();
                
                if (userType === "PROFESSEUR" || userType === "PROFESSOR") {
                  categorized.professeurs.push({ ...user, typeUtilisateur: "PROFESSEUR" });
                } else if (userType === "ELEVE" || userType === "ÉLÈVE" || userType === "STUDENT") {
                  categorized.eleves.push({ ...user, typeUtilisateur: "ELEVE" });
                } else if (userType === "PARENT") {
                  categorized.parents.push({ ...user, typeUtilisateur: "PARENT" });
                } else {
                  categorized.utilisateurs.push({ ...user, typeUtilisateur: "UTILISATEUR" });
                }
              } else {
                console.log(`Skipping user ${user.id} - already exists`);
              }
            });

            console.log("Merging publication rights users:", categorized);
            
            // Only update if we have new users to add
            if (categorized.professeurs.length > 0 || categorized.eleves.length > 0 || 
                categorized.parents.length > 0 || categorized.utilisateurs.length > 0) {
              
              const newState = {
                professeurs: [...prevUsers.professeurs, ...categorized.professeurs],
                eleves: [...prevUsers.eleves, ...categorized.eleves],
                parents: [...prevUsers.parents, ...categorized.parents],
                utilisateurs: [...prevUsers.utilisateurs, ...categorized.utilisateurs],
                accessRequests: prevUsers.accessRequests
              };
              
              console.log("New users state after merge:", {
                professeurs: newState.professeurs.length,
                eleves: newState.eleves.length,
                parents: newState.parents.length,
                utilisateurs: newState.utilisateurs.length
              });
              
              return newState;
            } else {
              console.log("No new users to merge - keeping existing state");
              return prevUsers;
            }
          });
        }
      }
    } catch (error) {
      console.error("Error loading moderator and rights info:", error);
    }
  };

  // UPDATED: Enhanced categorization to handle utilisateurs
  const loadUsersWithAccess = async () => {
    try {
      console.log("Loading users with access for class:", classId);
      const usersWithAccess = await AccederService.obtenirUtilisateursAvecAcces(
        classId
      );
      console.log("Raw users with access:", usersWithAccess);
      
      // If no users have access yet, don't reset - just log and continue
      // This allows publication rights data to be loaded next
      if (!usersWithAccess || usersWithAccess.length === 0) {
        console.log("No users with access found for this class - will check publication rights");
        // Don't reset the users state - just return and let other methods populate it
        return;
      }

      // Enhanced categorization with detailed logging and forced categorization
      const categorizedUsers = {
        professeurs: [],
        eleves: [],
        parents: [],
        utilisateurs: [],
      };

      for (const user of usersWithAccess) {
        const userType = (user.typeUtilisateur || user.type || user.role || "").toUpperCase();
        if (userType === "PROFESSEUR" || userType === "PROFESSOR") {
          categorizedUsers.professeurs.push({ ...user, typeUtilisateur: "PROFESSEUR" });
        } else if (userType === "ELEVE" || userType === "ÉLÈVE" || userType === "STUDENT") {
          categorizedUsers.eleves.push({ ...user, typeUtilisateur: "ELEVE" });
        } else if (userType === "PARENT") {
          categorizedUsers.parents.push({ ...user, typeUtilisateur: "PARENT" });
        } else {
          categorizedUsers.utilisateurs.push({ ...user, typeUtilisateur: "UTILISATEUR" });
        }
      }

      // Enrich with full profile data (telephone, adresse, niveau, creationDate, etc.)
      const [allProfessors, allStudents, allParents] = await Promise.all([
        scholchatService.getAllProfessors().catch(() => []),
        scholchatService.getAllStudents().catch(() => []),
        scholchatService.getAllParents().catch(() => []),
      ]);

      const enrich = (users, pool) => {
        const safePool = Array.isArray(pool) ? pool : [];
        return users.map(u => ({ ...(safePool.find(p => p.id === u.id) || {}), ...u }));
      };

      categorizedUsers.professeurs = enrich(categorizedUsers.professeurs, allProfessors);
      categorizedUsers.eleves = enrich(categorizedUsers.eleves, allStudents);
      categorizedUsers.parents = enrich(categorizedUsers.parents, allParents);

      setUsers(prev => ({
        ...prev,
        professeurs: categorizedUsers.professeurs,
        eleves: categorizedUsers.eleves,
        parents: categorizedUsers.parents,
        utilisateurs: categorizedUsers.utilisateurs,
      }));

      setStatistics(prev => ({
        ...prev,
        professeurs: categorizedUsers.professeurs.length,
        eleves: categorizedUsers.eleves.length,
        parents: categorizedUsers.parents.length,
        utilisateurs: categorizedUsers.utilisateurs.length,
      }));

      return categorizedUsers;
    } catch (error) {
      console.error("Error loading users with access:", error);
      message.error("Erreur lors du chargement des utilisateurs");
    }
  };

  const loadAccessRequests = async () => {
    try {
      const requests = await AccederService.obtenirDemandesAccesPourClasse(
        classId
      );
      console.log("Raw access requests:", requests);

      // Filter pending requests and get additional user info
      const pendingRequests = requests.filter(
        (req) =>
          req.etat === EtatDemandeAcces.EN_ATTENTE || req.etat === "EN_ATTENTE"
      );

      // Enrich requests with proper user data
      const enrichedRequests = await Promise.all(
        pendingRequests.map(async (request) => {
          try {
            // Try to get full user details by ID
            let fullUserData = null;
            let userType = null;

            // First, try to determine user type and get full data
            try {
              // Check if user is a professor
              const professors = await scholchatService.getAllProfessors();
              fullUserData = professors.find(
                (p) => p.id === request.utilisateurId
              );
              if (fullUserData) userType = "PROFESSEUR";
            } catch (error) {
              console.log("Error fetching professors:", error);
            }

            if (!fullUserData) {
              try {
                // Check if user is a student
                const students = await scholchatService.getAllStudents();
                fullUserData = students.find(
                  (s) => s.id === request.utilisateurId
                );
                if (fullUserData) userType = "ELEVE";
              } catch (error) {
                console.log("Error fetching students:", error);
              }
            }

            if (!fullUserData) {
              try {
                // Check if user is a parent
                const parents = await scholchatService.getAllParents();
                fullUserData = parents.find(
                  (p) => p.id === request.utilisateurId
                );
                if (fullUserData) userType = "PARENT";
              } catch (error) {
                console.log("Error fetching parents:", error);
              }
            }

            // Return enriched request data
            return {
              ...request,
              // Use full user data if available, otherwise use basic data from request
              id: request.id,
              utilisateurId: request.utilisateurId,
              nom:
                fullUserData?.nom || request.utilisateurNom || "Non disponible",
              prenom:
                fullUserData?.prenom ||
                request.utilisateurPrenom ||
                "Non disponible",
              email:
                fullUserData?.email ||
                request.utilisateurEmail ||
                "Non disponible",
              telephone: fullUserData?.telephone || "Non disponible",
              // Determine user type
              typeUtilisateur: userType || "INCONNU",
              // Format date properly
              dateDemande: request.dateDemande,
              etat: request.etat,
              motifRejet: request.motifRejet,
              dateTraitement: request.dateTraitement,
              // Additional fields based on user type
              ...(userType === "PROFESSEUR" && fullUserData
                ? {
                    nomEtablissement: fullUserData.nomEtablissement,
                    matriculeProfesseur: fullUserData.matriculeProfesseur,
                  }
                : {}),
              ...(userType === "ELEVE" && fullUserData
                ? {
                    niveau: fullUserData.niveau,
                  }
                : {}),
              ...(userType === "PARENT" && fullUserData
                ? {
                    adresse: fullUserData.adresse,
                  }
                : {}),
            };
          } catch (error) {
            console.error(
              "Error enriching request data for user:",
              request.utilisateurId,
              error
            );
            // Return basic data if enrichment fails
            return {
              ...request,
              id: request.id,
              nom: request.utilisateurNom || "Non disponible",
              prenom: request.utilisateurPrenom || "Non disponible",
              email: request.utilisateurEmail || "Non disponible",
              telephone: "Non disponible",
              typeUtilisateur: "INCONNU",
              dateDemande: request.dateDemande,
              etat: request.etat,
            };
          }
        })
      );

      console.log("Enriched access requests:", enrichedRequests);

      setUsers((prev) => ({
        ...prev,
        accessRequests: enrichedRequests,
      }));

      setStatistics((prev) => ({
        ...prev,
        accessRequests: enrichedRequests.length,
      }));
    } catch (error) {
      console.error("Error loading access requests:", error);
      message.error("Erreur lors du chargement des demandes d'accès");
    }
  };

  const loadCourses = async () => {
    try {
      const data = await coursProgrammerService.obtenirProgrammationParClasse(classId);
      // Sort by status: EN_COURS (0), PLANIFIE (1), ANNULE (2), TERMINE (3)
      const sorted = (data || []).sort((a, b) => {
        const order = { "EN_COURS": 0, "PLANIFIE": 1, "ANNULE": 2, "TERMINE": 3 };
        return (order[a.etatCoursProgramme] ?? 99) - (order[b.etatCoursProgramme] ?? 99);
      });
      setCourses(sorted);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const loadExercises = async () => {
    try {
      const data = await exerciseProgrammerService.getExercisesProgrammesParClasse(classId);
      // Sort by status: ACTIF/PUBLIE (0), BROUILLON (1), EN_ATTENTE_CORRECTION (2), CORRIGE (3), ANNULE (4)
      const sorted = (data || []).sort((a, b) => {
        const order = { 
          "ACTIF": 0, "PUBLIE": 0, 
          "BROUILLON": 1, 
          "EN_ATTENTE_CORRECTION": 2, 
          "CORRIGE": 3, 
          "ANNULE": 4 
        };
        return (order[a.etat] ?? order[a.etatExercise] ?? 99) - (order[b.etat] ?? order[b.etatExercise] ?? 99);
      });
      setExercises(sorted);
    } catch (error) {
      console.error("Error loading exercises:", error);
    }
  };

  const loadEvents = async () => {
    try {
      const allEvents = await activityFeedService.getActivities();
      // Filter by classId
      const classEvents = allEvents.filter(event => 
        event.classesIds && event.classesIds.includes(classId)
      );
      // Sort by status: EN_COURS (0), PLANIFIE/A_VENIR (1), PASSE (2), ANNULE (3)
      const sorted = classEvents.sort((a, b) => {
        const order = { "EN_COURS": 0, "PLANIFIE": 1, "A_VENIR": 1, "PASSE": 2, "ANNULE": 3 };
        return (order[a.etat] ?? 99) - (order[b.etat] ?? 99);
      });
      setEvents(sorted);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const isUserModerator = () => {
    // Students and parents are never moderators
    const role = (userRole || "").toUpperCase();
    if (role.includes("ELEVE") || role.includes("STUDENT") || role.includes("PARENT")) return false;

    if (role === "ADMIN" || role === "ROLE_ADMIN" || role === "ADMINISTRATEUR") return true;

    if (!currentUserId) return false;

    // Check if user is assigned moderator (check both object and flat field)
    if (classDetails?.moderatorId === currentUserId) return true;
    if (classDetails?.moderator?.id === currentUserId) return true;
    if (classDetails?.createurId === currentUserId) return true;

    // Check if user is in moderatorsWithRights (professors only)
    return moderatorsWithRights.some(m => m.id === currentUserId);
  };

  const fetchProfessors = async () => {
    try {
      const data = await classService.obtenirProfesseurs();
      setProfessors(data || []);
    } catch (error) {
      console.error("Error fetching professors:", error);
    }
  };

  const fetchRejectionMotifs = async () => {
    try {
      const motifs = await rejectionServiceClass.getAllClassRejectionMotifs();
      setRejectionMotifs(motifs || []);
    } catch (error) {
      console.error("Error fetching rejection motifs:", error);
    }
  };

  const fetchActivationHistory = async () => {
    if (!classId) return;

    try {
      setActionLoading("history");
      const data = await classService.obtenirHistoriqueActivation(classId);
      setHistory(data || []);
      setHistoryModalVisible(true);
    } catch (error) {
      console.error("Error fetching activation history:", error);
      message.error("Erreur lors du chargement de l'historique");
    } finally {
      setActionLoading(null);
    }
  };

  // Map { professorId: boolean } of publication rights for professors in this class
  const publicationRightsMap = Object.fromEntries(
    (usersWithPublicationRights || []).map((u) => [u.id, true])
  );

  const handleTogglePublicationRights = async (professor, grant) => {
    try {
      if (grant) {
        await PublicationRightsService.assignPublicationRights(professor.id, classId, true, false);
        message.success(`Droit de publication accordé à ${professor.prenom} ${professor.nom}`);
      } else {
        await PublicationRightsService.removePublicationRights(professor.id, classId);
        message.success(`Droit de publication retiré à ${professor.prenom} ${professor.nom}`);
      }
      // Refresh publication rights list
      const rightsResult = await PublicationRightsService.getUsersWithRightsForClass(classId);
      if (rightsResult.success) setUsersWithPublicationRights(rightsResult.data || []);
    } catch (err) {
      message.error(err.message || "Erreur lors de la mise à jour des droits de publication");
    }
  };

  const handleViewUser = (user) => {
    if (!user) {
      console.error("Cannot view user: user is null or undefined");
      return;
    }

    console.log("Viewing user:", user);
    setSelectedUser(user);
    setUserViewModalVisible(true);
  };

  const handleCloseModal = () => {
    setUserViewModalVisible(false);
    setTimeout(() => {
      setSelectedUser(null);
    }, 100);
  };

  const handleRemoveAccess = async (user) => {
    try {
      await AccederService.retirerAcces(user.id, classId);
      message.success("Accès retiré avec succès");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      message.error("Erreur lors du retrait de l'accès");
      console.error("Error removing access:", error);
    }
  };

  // NEW: Handle removing user from the system completely
  const handleDeleteUser = async (user) => {
    try {
      // First remove access from class
      await AccederService.retirerAcces(user.id, classId);

      // Since these are general "utilisateur" type users, we'll use a general delete approach
      // You might need to implement a general delete user endpoint
      // For now, we'll just remove their access and show a success message

      message.success("Utilisateur supprimé de la classe avec succès");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      message.error("Erreur lors de la suppression de l'utilisateur");
      console.error("Error deleting user:", error);
    }
  };

  const handleApproveRequest = async (request) => {
    try {
      // First approve the request
      await AccederService.validerDemandeAcces(request.id);

      // After approval, we need to force proper categorization
      // Get the user's full details and determine their correct type
      let approvedUser = null;
      let userCategory = null;

      // Try to get full user data based on the request's user type
      const userType = request.typeUtilisateur?.toUpperCase();

      console.log(
        "Approving request for user type:",
        userType,
        "User ID:",
        request.utilisateurId
      );

      try {
        switch (userType) {
          case "PROFESSEUR":
          case "PROFESSOR":
            const allProfessors = await scholchatService.getAllProfessors();
            approvedUser = allProfessors.find(
              (p) => p.id === request.utilisateurId
            );
            userCategory = "professeurs";
            break;

          case "ELEVE":
          case "ÉLÈVE":
          case "STUDENT":
            const allStudents = await scholchatService.getAllStudents();
            approvedUser = allStudents.find(
              (s) => s.id === request.utilisateurId
            );
            userCategory = "eleves";
            break;

          case "PARENT":
            const allParents = await scholchatService.getAllParents();
            approvedUser = allParents.find(
              (p) => p.id === request.utilisateurId
            );
            userCategory = "parents";
            break;

          case "UTILISATEUR":
          default:
            // For general users, we'll use the request data and mark as utilisateur
            approvedUser = {
              id: request.utilisateurId,
              nom: request.nom,
              prenom: request.prenom,
              email: request.email,
              telephone: request.telephone,
              type: "utilisateur",
              etat: "ACTIF",
            };
            userCategory = "utilisateurs";
            break;
        }

        // If we found the user, add them to the appropriate category immediately
        if (approvedUser && userCategory) {
          console.log(
            "Adding approved user to category:",
            userCategory,
            approvedUser
          );

          // Force update the users state immediately
          setUsers((prevUsers) => {
            const updatedUsers = { ...prevUsers };

            // Remove from access requests
            updatedUsers.accessRequests = updatedUsers.accessRequests.filter(
              (req) => req.id !== request.id
            );

            // Add to the appropriate category (avoid duplicates)
            const existsInCategory = updatedUsers[userCategory].some(
              (user) => user.id === approvedUser.id
            );

            if (!existsInCategory) {
              updatedUsers[userCategory] = [
                ...updatedUsers[userCategory],
                {
                  ...approvedUser,
                  // Ensure proper type marking for the table
                  type: userType?.toLowerCase() || "utilisateur",
                  typeUtilisateur: userType,
                  etat: "ACTIF",
                },
              ];
            }

            console.log("Updated users state:", updatedUsers);
            return updatedUsers;
          });

          // Update statistics immediately
          setStatistics((prevStats) => {
            const updatedStats = { ...prevStats };
            updatedStats.accessRequests = Math.max(
              0,
              updatedStats.accessRequests - 1
            );
            updatedStats[userCategory] = updatedStats[userCategory] + 1;
            return updatedStats;
          });

          message.success(
            `Demande approuvée avec succès. ${approvedUser.prenom} ${approvedUser.nom} a été ajouté(e) aux ${userCategory}.`
          );
        } else {
          console.warn("Could not find full user data for approved request");
          message.success("Demande approuvée avec succès");
          // Still refresh to get updated data
          setRefreshKey((prev) => prev + 1);
        }
      } catch (userFetchError) {
        console.error(
          "Error fetching user details after approval:",
          userFetchError
        );
        message.success("Demande approuvée avec succès");
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      message.error("Erreur lors de l'approbation de la demande");
      console.error("Error approving request:", error);
    }
  };

  const handleRejectRequest = (request) => {
    setRejectingUser(request);
    setRejectModalVisible(true);
  };

  const confirmRejectRequest = async () => {
    if (!rejectReason.trim()) {
      message.error("Veuillez saisir un motif de rejet");
      return;
    }

    try {
      await AccederService.rejeterDemandeAcces(rejectingUser.id, rejectReason);
      message.success("Demande rejetée avec succès");
      setRejectModalVisible(false);
      setRejectReason("");
      setRejectingUser(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      message.error("Erreur lors du rejet de la demande");
      console.error("Error rejecting request:", error);
    }
  };

  // Admin: open class rejection modal and load motifs
  const openClassRejectModal = async () => {
    setClassRejectModalVisible(true);
    setClassRejectSelectedCode("");
    setClassRejectMotifSupp("");
    setClassRejectMotifsLoading(true);
    try {
      const motifs = await rejectionServiceClass.getAllClassRejectionMotifs();
      setClassRejectMotifs(Array.isArray(motifs) ? motifs : []);
    } catch {
      setClassRejectMotifs([]);
    } finally {
      setClassRejectMotifsLoading(false);
    }
  };

  // Admin: confirm class rejection from modal
  const confirmClassReject = async () => {
    if (!classRejectSelectedCode) return;
    try {
      setActionLoading("admin-reject");
      await classService.rejeterClasse(classId, classRejectSelectedCode);
      message.success("Classe rejetée avec succès");
      setClassRejectModalVisible(false);
      await loadClassDetails();
    } catch (error) {
      console.error("Error rejecting class:", error);
      message.error("Erreur lors du rejet de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!classId) return;

    try {
      setActionLoading("approve");
      await classService.approuverClasse(classId);
      message.success("Classe approuvée avec succès");
      await loadClassDetails();
    } catch (error) {
      console.error("Error approving class:", error);
      message.error("Erreur lors de l'approbation de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveByEstablishment = async (classeId, etablissementId) => {
    try {
      setActionLoading("approve");
      await classService.approuverClasseParEtablissement(classeId, etablissementId);
      message.success("Classe validée avec succès");
      await loadClassDetails();
    } catch (error) {
      console.error("Error approving class by establishment:", error);
      message.error("Erreur lors de la validation de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectByEstablishment = async (classeId, etablissementId) => {
    try {
      setActionLoading("reject");
      await classService.rejeterClasseParEtablissement(classeId, etablissementId);
      message.success("Classe rejetée avec succès");
      await loadClassDetails();
    } catch (error) {
      console.error("Error rejecting class by establishment:", error);
      message.error("Erreur lors du rejet de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  // NEW: Handle self-approval (creator approving their own class)
  const handleSelfApprove = async () => {
    if (!classId) return;

    try {
      setActionLoading("self-approve");

      // Use the same approval service, but add a note that it's self-approval
      await classService.approuverClasse(classId);

      message.success(
        "Classe approuvée avec succès ! Vous pouvez maintenant gérer votre classe."
      );
      await loadClassDetails();
    } catch (error) {
      console.error("Error self-approving class:", error);
      message.error("Erreur lors de l'approbation de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  // NEW: Handle self-rejection (creator rejecting their own class)
  const handleSelfReject = async () => {
    if (!classId) return;

    try {
      setActionLoading("self-reject");

      // Use the same rejection service
      const values = await form.validateFields();
      await rejectionServiceClass.rejectClass(classId, {
        codesErreur: values.codesErreur,
        motifSupplementaire: values.motifSupplementaire || "",
        isSelfRejection: true, // Add flag to indicate self-rejection
      });

      message.success("Classe rejetée avec succès");
      form.resetFields();
      await loadClassDetails();
    } catch (error) {
      console.error("Error self-rejecting class:", error);
      if (error.errorFields) {
        message.error("Veuillez sélectionner au moins un motif de rejet");
      } else {
        message.error(error.message || "Erreur lors du rejet de la classe");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const showRejectConfirm = () => {
    confirm({
      title: "Confirmer le rejet de la classe",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Êtes-vous sûr de vouloir rejeter cette classe ?</p>
          <Form layout="vertical" form={form}>
            <Form.Item
              label="Motifs de rejet"
              name="codesErreur"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner au moins un motif",
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Sélectionner un ou plusieurs motifs"
              >
                {rejectionMotifs.map((motif) => (
                  <Option key={motif.code} value={motif.code}>
                    {motif.descriptif}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Commentaire supplémentaire"
              name="motifSupplementaire"
            >
              <Input.TextArea
                rows={3}
                placeholder="Détails supplémentaires (optionnel)"
              />
            </Form.Item>
          </Form>
        </div>
      ),
      okText: "Confirmer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          const values = await form.validateFields();

          if (canSelfApproveReject()) {
            await handleSelfReject();
          } else {
            await handleReject(values);
          }
        } catch (error) {
          console.error("Validation failed:", error);
          return Promise.reject(error);
        }
      },
      onCancel: () => {
        form.resetFields();
      },
    });
  };

  const handleReject = async (formValues) => {
    if (!classId) {
      message.error("ID de classe manquant");
      return;
    }

    const rejectionData = formValues || rejectReason;

    if (!rejectionData.codesErreur || rejectionData.codesErreur.length === 0) {
      message.error("Veuillez sélectionner au moins un motif de rejet");
      return;
    }

    try {
      setActionLoading("reject");
      await rejectionServiceClass.rejectClass(classId, {
        codesErreur: rejectionData.codesErreur,
        motifSupplementaire: rejectionData.motifSupplementaire || "",
      });

      message.success("Classe rejetée avec succès");
      form.resetFields();
      setRejectReason({ codesErreur: [], motifSupplementaire: "" });
      await loadClassDetails();
    } catch (error) {
      console.error("Error rejecting class:", error);
      message.error("Erreur lors du rejet de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const showDeleteConfirm = () => {
    confirm({
      title: "Confirmer la suppression de la classe",
      icon: <ExclamationCircleOutlined />,
      content:
        "Êtes-vous sûr de vouloir supprimer définitivement cette classe ? Cette action est irréversible.",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: handleDelete,
    });
  };

  const handleDelete = async () => {
    if (!classId) return;

    // Protection: Professor cannot delete class if they are the sole moderator
    const isProfessor = userRole === "ROLE_PROFESSOR" || userRole === "PROFESSOR" || userRole?.includes("PROFESSOR");
    const isAdmin = userRole === "ROLE_ADMIN" || userRole === "ADMIN";
    
    if (isProfessor && !isAdmin && moderatorsWithRights.length === 1 && moderatorsWithRights[0].id === currentUserId) {
      message.error("En tant que seul modérateur, vous ne pouvez pas supprimer cette classe. Veuillez d'abord assigner un autre modérateur ou contacter l'administration.");
      return;
    }

    try {
      setActionLoading("delete");
      await classService.supprimerClasse(classId);
      message.success("Classe supprimée avec succès");
      onBack();
    } catch (error) {
      console.error("Error deleting class:", error);
      message.error("Erreur lors de la suppression de la classe");
      setActionLoading(null);
    }
  };

  const handleModeratorAssign = async () => {
    if (!selectedModerator) {
      message.error("Veuillez sélectionner un modérateur");
      return;
    }

    if (!classId) return;

    try {
      setActionLoading("moderator");

      // Assign moderator to class (assuming classService has this method)
      await classService.assignerModerateur(classId, selectedModerator.id);

      // Also assign publication rights to the moderator
      const rightsResult =
        await PublicationRightsService.assignPublicationRights(
          selectedModerator.id,
          classId,
          true, // Can publish
          true // Can moderate
        );

      if (!rightsResult.success) {
        console.warn(
          "Failed to assign publication rights to moderator:",
          rightsResult.error
        );
        message.warning(
          "Modérateur assigné mais l'assignation des droits de publication a échoué"
        );
      } else {
        message.success(
          "Modérateur assigné avec succès avec droits de publication"
        );
      }

      // Reset form states
      setModeratorModalVisible(false);
      setModeratorSearchQuery("");
      setModeratorSearchResults([]);
      setSelectedModerator(null);

      // Reload class details
      await loadClassDetails();
    } catch (error) {
      console.error("Error assigning moderator:", error);
      message.error("Erreur lors de l'assignation du modérateur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleModeratorRemove = async () => {
    if (!classId) return;

    try {
      setActionLoading("removeModerator");
      await classService.retirerModerateur(classId);
      message.success("Modérateur retiré avec succès");
      await loadClassDetails();
    } catch (error) {
      console.error("Error removing moderator:", error);
      message.error("Erreur lors du retrait du modérateur");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublicationRightsUpdate = async () => {
    if (!classId || !selectedPublicationRight) {
      message.error("Veuillez sélectionner un droit de publication");
      return;
    }

    try {
      setActionLoading("publicationRights");
      await classService.modifierDroitPublication(
        classId,
        selectedPublicationRight
      );
      message.success("Droits de publication mis à jour avec succès");
      setPublicationRightsModalVisible(false);
      await loadClassDetails();
    } catch (error) {
      console.error("Error updating publication rights:", error);
      message.error("Erreur lors de la mise à jour des droits de publication");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchUserByEmail = async () => {
    if (!searchEmail) {
      message.error("Veuillez entrer une adresse email");
      return;
    }

    try {
      setSearchLoading(true);
      const [professors, students, parents] = await Promise.all([
        scholchatService.getAllProfessors(),
        scholchatService.getAllStudents(),
        scholchatService.getAllParents(),
      ]);

      const allUsers = [...professors, ...students, ...parents];
      const filteredUsers = allUsers.filter(
        (user) =>
          user.email &&
          user.email.toLowerCase().includes(searchEmail.toLowerCase())
      );

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      message.error("Erreur lors de la recherche d'utilisateurs");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchModerator = async () => {
    if (!moderatorSearchQuery.trim()) {
      message.error("Veuillez entrer un nom ou email");
      return;
    }

    try {
      setModeratorSearchLoading(true);
      const allProfessors = await scholchatService.getAllProfessors();

      const filteredProfessors = allProfessors.filter(
        (professor) =>
          professor.nom
            ?.toLowerCase()
            .includes(moderatorSearchQuery.toLowerCase()) ||
          professor.prenom
            ?.toLowerCase()
            .includes(moderatorSearchQuery.toLowerCase()) ||
          professor.email
            ?.toLowerCase()
            .includes(moderatorSearchQuery.toLowerCase()) ||
          professor.matriculeProfesseur
            ?.toLowerCase()
            .includes(moderatorSearchQuery.toLowerCase())
      );

      setModeratorSearchResults(filteredProfessors);

      if (filteredProfessors.length === 0) {
        message.info("Aucun professeur trouvé avec ces critères");
      }
    } catch (error) {
      console.error("Error searching moderators:", error);
      message.error("Erreur lors de la recherche des professeurs");
    } finally {
      setModeratorSearchLoading(false);
    }
  };

  const handleAssignPublicationRights = async () => {
    if (!selectedUserForRights || !classId) {
      message.error("Veuillez sélectionner un utilisateur");
      return;
    }

    try {
      setActionLoading("assignPublicationRights");
      const result = await PublicationRightsService.assignPublicationRights(
        selectedUserForRights.id,
        classId,
        publicationRights.peutPublier,
        publicationRights.peutModerer
      );

      if (result.success) {
        message.success("Droits de publication assignés avec succès");
        setPublicationRightsModalVisible(false);
        setSearchEmail("");
        setSearchResults([]);
        setSelectedUserForRights(null);
        await loadModeratorsAndRights();
      } else {
        message.error(
          result.error || "Erreur lors de l'assignation des droits"
        );
      }
    } catch (error) {
      console.error("Error assigning publication rights:", error);
      message.error("Erreur lors de l'assignation des droits de publication");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const getStatusTag = (etat) => {
    const statusConfig = {
      ACTIF: { color: "green", text: "Actif" },
      ACTIVE: { color: "green", text: "Actif" },
      INACTIF: { color: "red", text: "Inactif" },
      INACTIVE: { color: "red", text: "Inactif" },
      EN_ATTENTE_APPROBATION: { color: "orange", text: "En attente" },
      PENDING: { color: "orange", text: "En attente" },
    };

    const config = statusConfig[etat] || { color: "default", text: etat };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPublicationRightsTag = (droit) => {
    const rightsConfig = {
      TOUS: { color: "green", text: "Tous peuvent publier" },
      MODERATEUR_SEULEMENT: { color: "blue", text: "Modérateur seulement" },
      PARENTS_ET_MODERATEUR: { color: "orange", text: "Parents et modérateur" },
      PROFESSEURS_SEULEMENT: { color: "blue", text: "Professeurs seulement" },
    };

    const config = rightsConfig[droit] || { color: "default", text: droit };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const renderActionButtons = () => {
    if (!classDetails) return null;

    const isAdmin = userRole === "ROLE_ADMIN" || userRole === "ADMIN";
    const canSelfManage = canSelfApproveReject() && isClassPendingApproval();
    const isPending = classDetails.etat === "EN_ATTENTE_APPROBATION" || 
                     classDetails.etat === "EN_ATTENTE" || 
                     classDetails.etat === "PENDING";
    
    const isProfessor = userRole === "ROLE_PROFESSOR" || userRole === "PROFESSOR" || userRole?.includes("PROFESSOR");
    const establishmentEnforcesValidation = classDetails.etablissement?.optionEnvoiMailNewClasse === true;
    
    // Hide buttons if professor and establishment requires validation
    const shouldShowApprovalButtons = isPending && !canSelfManage && (isAdmin || (isProfessor && !establishmentEnforcesValidation));

    console.log("=== ACTION BUTTONS DEBUG ===");
    console.log("Class Details:", classDetails);
    console.log("Class Status (etat):", classDetails.etat);
    console.log("User Role:", userRole);
    console.log("Is Admin:", isAdmin);
    console.log("Is Pending:", isPending);
    console.log("Can Self Manage:", canSelfManage);
    console.log("Should Show Admin Buttons:", isAdmin && isPending && !canSelfManage);
    console.log("==============================");

    return (
      <Card
        size="small"
        style={{
          marginBottom: 20,
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          border: "1px solid #e1e4e8",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Space wrap size={[8, 8]} style={{ width: "100%" }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setRefreshKey((prev) => prev + 1)}
            loading={loading}
            style={{ borderRadius: "8px" }}
          >
            Actualiser
          </Button>

          {/* Self-approval/rejection buttons for class creator */}
          {canSelfManage && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleSelfApprove}
                loading={actionLoading === "self-approve"}
                style={{
                  borderRadius: "8px",
                  background: "#52c41a",
                  borderColor: "#52c41a",
                }}
              >
                <CrownOutlined style={{ marginRight: 4 }} />
                Approuver ma classe
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={showRejectConfirm}
                loading={actionLoading === "self-reject"}
                style={{ borderRadius: "8px" }}
              >
                <CrownOutlined style={{ marginRight: 4 }} />
                Rejeter ma classe
              </Button>
            </>
          )}

          {/* Boutons Approuver/Rejeter pour classes en attente */}
          {shouldShowApprovalButtons && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApprove}
                loading={actionLoading === "approve"}
                style={{
                  borderRadius: "8px",
                  background: "#52c41a",
                  borderColor: "#52c41a",
                }}
              >
                Approuver
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={showRejectConfirm}
                loading={actionLoading === "reject"}
                style={{ borderRadius: "8px" }}
              >
                Rejeter
              </Button>
            </>
          )}

          <Button
            icon={<UserAddOutlined />}
            onClick={() => setModeratorModalVisible(true)}
            style={{ borderRadius: "8px" }}
            disabled={classDetails.etat === "EN_ATTENTE_APPROBATION"}
          >
            Assigner modérateur
          </Button>

          <Button
            icon={<SafetyCertificateOutlined />}
            onClick={() => setPublicationRightsModalVisible(true)}
            style={{ borderRadius: "8px" }}
            disabled={classDetails.etat === "EN_ATTENTE_APPROBATION"}
          >
            Droits de publication
          </Button>

          <Button
            icon={<HistoryOutlined />}
            onClick={fetchActivationHistory}
            loading={actionLoading === "history"}
            style={{ borderRadius: "8px" }}
          >
            Historique
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={showDeleteConfirm}
            loading={actionLoading === "delete"}
            style={{ borderRadius: "8px" }}
          >
            Supprimer
          </Button>
        </Space>

        {/* Self-approval information banner */}
        {canSelfManage && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "#e6f7ff",
              borderRadius: 6,
            }}
          >
            <Text type="secondary">
              <CrownOutlined style={{ marginRight: 8, color: "#1890ff" }} />
              <strong>Vous êtes le créateur de cette classe.</strong> Comme elle
              n'est associée à aucun établissement et que le paiement est
              validé, vous pouvez l'approuver ou la rejeter vous-même.
            </Text>
          </div>
        )}
      </Card>
    );
  };

  const renderModeratorInfo = () => {
    const classModerator = classDetails?.moderator;
    const moderatorsFromRights =
      moderatorsWithRights.length > 0 ? moderatorsWithRights[0] : null;
    const currentModerator = classModerator || moderatorsFromRights;

    if (currentModerator) {
      return (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text strong>
            {currentModerator.prenom} {currentModerator.nom}
          </Text>
          <Text type="secondary">{currentModerator.email}</Text>
          <Space>
            <Button
              type="link"
              icon={<UserOutlined />}
              onClick={() => handleViewUser(currentModerator)}
            >
              Voir le profil
            </Button>
            {moderatorsWithRights.length > 0 && (
              <Button
                type="link"
                danger
                onClick={handleModeratorRemove}
                loading={actionLoading === "removeModerator"}
              >
                Retirer
              </Button>
            )}
          </Space>
        </Space>
      );
    }
    return <Text type="secondary">Aucun modérateur assigné</Text>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="manage-class-details-view">
        <Alert
          message="Classe non trouvée"
          description="La classe que vous recherchez n'existe pas ou vous n'avez pas les droits d'accès."
          type="error"
          showIcon
          action={
            <Button onClick={onBack} icon={<ArrowLeftOutlined />}>
              Retour
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
    <div className="w-full">

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 60%, #4f8ec9 100%)" }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none" style={{ background: "#fff" }} />
          <div className="relative px-3 sm:px-6 py-3 sm:py-4">

            {/* Row 1: back + delete */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <button onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <ArrowLeft size={14} />
                Retour
              </button>
              {(userRole === "ROLE_ADMIN" || userRole === "ADMIN") && (
                <button onClick={showDeleteConfirm}
                  disabled={actionLoading === "delete"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: "#dc2626", color: "#fff", border: "2px solid #b91c1c" }}>
                  {actionLoading === "delete" ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Supprimer
                </button>
              )}
            </div>

            {/* Row 2: class identity */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.35)" }}>
                <GraduationCap size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-white font-bold text-base sm:text-xl leading-tight m-0">{classDetails?.nom}</h1>
                  {classDetails?.etat && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                      style={{
                        background: classDetails.etat === "ACTIF" ? "#f0fdf4" : classDetails.etat === "EN_ATTENTE_APPROBATION" ? "#fffbeb" : "#fef2f2",
                        color: classDetails.etat === "ACTIF" ? "#16a34a" : classDetails.etat === "EN_ATTENTE_APPROBATION" ? "#d97706" : "#dc2626",
                        border: `1px solid ${classDetails.etat === "ACTIF" ? "#bbf7d0" : classDetails.etat === "EN_ATTENTE_APPROBATION" ? "#fde68a" : "#fecaca"}`,
                      }}>
                      {classDetails.etat === "ACTIF" ? "Actif" : classDetails.etat === "EN_ATTENTE_APPROBATION" ? "En attente" : "Inactif"}
                    </span>
                  )}
                  {/* Role badge */}
                  {(() => {
                    const isCreator = classDetails?.creatorId === currentUserId || classDetails?.creator_id === currentUserId;
                    const isMod = classDetails?.moderator?.id === currentUserId || classDetails?.moderatorId === currentUserId;
                    const hasPubRight = usersWithPublicationRights?.some(u => u.id === currentUserId);
                    let label, bg, color;
                    if (isCreator)         { label = "Créateur";             bg = "#eef2ff"; color = "#4f46e5"; }
                    else if (isMod)        { label = "Modérateur";           bg = "#ecfeff"; color = "#0891b2"; }
                    else if (hasPubRight)  { label = "Droit de publication"; bg = "#f5f3ff"; color = "#7c3aed"; }
                    else                   { label = "Membre";               bg = "#f8fafc"; color = "#64748b"; }
                    return (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                        style={{ background: bg, color, border: `1px solid ${color}33` }}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {classDetails?.niveau && <span className="text-blue-100 text-xs">{classDetails.niveau}</span>}
                  {classDetails?.etablissement?.nom && <span className="text-blue-100 text-xs">🏫 {classDetails.etablissement.nom}</span>}
                  <span className="text-blue-100 text-xs">
                    <TeamOutlined style={{ marginRight: 4 }} />
                    {statistics.eleves || 0} participants
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: management action buttons — centered group */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button onClick={() => setRefreshKey(prev => prev + 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Actualiser
              </button>
              {(userRole === "ROLE_ADMIN" || userRole === "ADMIN" ||
                classDetails?.createurId === currentUserId ||
                classDetails?.moderatorId === currentUserId) && (
                <button onClick={() => setModeratorModalVisible(true)}
                  disabled={classDetails?.etat === "EN_ATTENTE_APPROBATION"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:bg-white/20 disabled:opacity-40"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>
                  <UserPlus size={12} />
                  Modérateur
                </button>
              )}
              {(userRole === "ROLE_ADMIN" || userRole === "ADMIN" || isUserModerator()) && (
                <button onClick={() => setPublicationRightsModalVisible(true)}
                  disabled={classDetails?.etat === "EN_ATTENTE_APPROBATION"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:bg-white/20 disabled:opacity-40"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>
                  <Shield size={12} />
                  Droits
                </button>
              )}
              <button onClick={fetchActivationHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <History size={12} />
                Historique
              </button>
              {/* Admin approve/reject for pending classes */}
              {(userRole === "ROLE_ADMIN" || userRole === "ADMIN") &&
               (classDetails?.etat === "EN_ATTENTE_APPROBATION" || classDetails?.etat === "PENDING") && (
                <>
                  <button onClick={handleApprove}
                    disabled={actionLoading === "approve"}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-md"
                    style={{ background: "#16a34a", border: "2px solid #15803d" }}>
                    {actionLoading === "approve" ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    Approuver
                  </button>
                  <button onClick={openClassRejectModal}
                    disabled={actionLoading === "admin-reject"}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-md"
                    style={{ background: "#dc2626", border: "2px solid #b91c1c" }}>
                    <XIcon size={13} />
                    Rejeter
                  </button>
                </>
              )}
              {(canSelfApproveReject() && isClassPendingApproval()) && (
                <>
                  <button onClick={handleSelfApprove}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                    <Check size={12} /> Approuver
                  </button>
                  <button onClick={showRejectConfirm}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-red-500/30"
                    style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.35)" }}>
                    <XIcon size={12} /> Rejeter
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats cards — hidden on mobile ── */}
        <div className="hidden sm:block px-3 sm:px-6 pt-4">
          <StatisticsCards statistics={statistics} loading={loading} />
        </div>

        {/* ── Quick actions CTA card — below stats ── */}
        {(onNavigateToCourseCreation || onNavigateToExerciseManagement || onNavigateToCoursManagement) && (
          <div className="px-3 sm:px-6 pt-3">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex-shrink-0">Actions rapides</span>
              <div className="flex items-center gap-2 flex-wrap">
                {onNavigateToCoursManagement && (
                  <button onClick={() => onNavigateToCoursManagement(classId)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md"
                    style={{ background: "linear-gradient(135deg,#0ea5e9,#4f46e5)" }}>
                    <BookOutlined style={{ fontSize: 14 }} />
                    Gestion des Cours
                  </button>
                )}
                {onNavigateToCourseCreation && (
                  <button onClick={() => onNavigateToCourseCreation(classId)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                    <PlusOutlined style={{ fontSize: 14 }} />
                    Créer un cours
                  </button>
                )}
                {onNavigateToExerciseManagement && (
                  <button onClick={() => onNavigateToExerciseManagement(classId)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md"
                    style={{ background: "linear-gradient(135deg,#f093fb,#f5576c)" }}>
                    <FileTextOutlined style={{ fontSize: 14 }} />
                    Exercices Programmer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Scrollable tab bar with arrow buttons ── */}
        <TabScrollBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={[
            { key: "overview",        label: "Aperçu",                    icon: <BookOutlined /> },
            { key: "professeurs",     label: `Professeurs (${users.professeurs.length})`, icon: <UserOutlined /> },
            { key: "eleves",          label: `Élèves (${users.eleves.length})`,           icon: <TeamOutlined /> },
            { key: "parents",         label: `Parents (${users.parents.length})`,         icon: <TeamOutlined /> },
            { key: "utilisateurs",    label: `Utilisateurs (${users.utilisateurs.length})`, icon: <UserOutlined /> },
            { key: "access-requests", label: `Demandes (${users.accessRequests.length})`, icon: <ClockCircleOutlined /> },
            ...(!["ROLE_ADMIN","ADMIN","ADMINISTRATEUR"].includes((userRole||"").toUpperCase()) ? [
              { key: "courses",   label: `Cours (${courses.length})`,     icon: <BookOutlined /> },
              { key: "exercises", label: `Exercices (${exercises.length})`, icon: <FileTextOutlined /> },
            ] : []),
            { key: "events",          label: `Événements (${events.length})`,             icon: <Calendar /> },
          ]}
        />

        {/* ── Tab content ── */}
        <div className="px-3 sm:px-6 py-4 sm:py-6">

          {/* Aperçu */}
          {activeTab === "overview" && (
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Left: class info */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2" style={{ background: "#f8faff" }}>
                    <BookOutlined style={{ color: "#4f46e5", fontSize: 13 }} />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Informations de la classe</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {[
                      { label: "Nom", value: classDetails.nom },
                      { label: "Niveau", value: classDetails.niveau },
                      { label: "Date de création", value: classDetails.dateCreation ? new Date(classDetails.dateCreation).toLocaleDateString("fr-FR") : "—" },
                      { label: "Établissement", value: classDetails.etablissement?.nom || "Classe indépendante" },
                    ].map((row, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <span className="text-xs text-slate-400 font-medium flex-shrink-0">{row.label}</span>
                        <span className="text-sm text-slate-800 font-medium text-right">{row.value}</span>
                      </div>
                    ))}
                    {/* Code d'activation */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-slate-400 font-medium flex-shrink-0">Code d'activation</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-sm font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{classDetails.codeActivation}</code>
                        <button onClick={() => { navigator.clipboard.writeText(classDetails.codeActivation); message.success("Code copié !"); }}
                          className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-indigo-600">
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                    {/* Statut */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-slate-400 font-medium flex-shrink-0">Statut</span>
                      {getStatusTag(classDetails.etat)}
                    </div>
                    {/* Droits de publication */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-slate-400 font-medium flex-shrink-0">Droits de publication</span>
                      {getPublicationRightsTag(classDetails.droitPublication)}
                    </div>
                    {/* Accès majeur */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-slate-400 font-medium flex-shrink-0">Accès majeur</span>
                      {classDetails.accesMajeur ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
                          <SafetyCertificateOutlined style={{ fontSize: 10 }} /> Classe Majeure — email
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0" }}>
                          Accès standard
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: moderator */}
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2" style={{ background: "#f8faff" }}>
                    <CrownOutlined style={{ color: "#4f46e5", fontSize: 13 }} />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Modérateur</span>
                  </div>
                  <div className="px-4 py-4">
                    {renderModeratorInfo()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Professeurs */}
          {activeTab === "professeurs" && (
            <UserTables 
              users={users.professeurs} 
              loading={loading} 
              userType="professeurs"
              onViewUser={handleViewUser} 
              onRemoveAccess={handleRemoveAccess} 
              onTogglePublicationRights={isUserModerator() ? handleTogglePublicationRights : undefined}
              publicationRightsMap={publicationRightsMap}
              currentTab={activeTab}
              userRole={userRole}
              isModerator={isUserModerator()}
            />
          )}

          {/* Élèves */}
          {activeTab === "eleves" && (
            <div>
              {classDetails?.accesMajeur && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-semibold text-blue-700 mb-2">🔑 Classe Majeure — Ajouter un élève par email</p>
                  <div className="flex gap-2">
                    <Input placeholder="Email de l'élève..." value={searchEmail}
                      onChange={e => setSearchEmail(e.target.value)} onPressEnter={handleSearchUserByEmail}
                      prefix={<SearchOutlined />} style={{ borderRadius: 8 }} />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchUserByEmail}
                      loading={searchLoading} style={{ borderRadius: 8 }}>Rechercher</Button>
                  </div>
                  {searchResults.length > 0 && (
                    <List style={{ marginTop: 8 }} size="small" dataSource={searchResults}
                      renderItem={u => (
                        <List.Item actions={[
                          <Button type="primary" size="small" loading={actionLoading === `add-${u.id}`}
                            onClick={async () => {
                              try {
                                setActionLoading(`add-${u.id}`);
                                const request = await AccederService.demanderAcces({ utilisateurId: u.id, classeId: classId, codeActivation: classDetails.codeActivation });
                                if (request?.id) { await AccederService.validerDemandeAcces(request.id); }
                                else {
                                  const reqs = await AccederService.obtenirDemandesAccesPourClasse(classId);
                                  const r = reqs.find(r => r.utilisateurId === u.id && r.etat === "EN_ATTENTE");
                                  if (r) await AccederService.validerDemandeAcces(r.id);
                                }
                                message.success(`${u.prenom} ${u.nom} ajouté(e)`);
                                setSearchEmail(""); setSearchResults([]); setRefreshKey(p => p + 1);
                              } catch (err) { message.error(err.message || "Erreur"); }
                              finally { setActionLoading(null); }
                            }}>Ajouter</Button>
                        ]}>
                          <List.Item.Meta title={`${u.prenom} ${u.nom}`} description={u.email} />
                        </List.Item>
                      )} />
                  )}
                </div>
              )}
              <UserTables 
                users={users.eleves} 
                loading={loading} 
                userType="eleves"
                onViewUser={handleViewUser} 
                onRemoveAccess={handleRemoveAccess} 
                currentTab={activeTab} 
                userRole={userRole}
                isModerator={isUserModerator()}
              />
            </div>
          )}

          {/* Parents */}
          {activeTab === "parents" && (
            <UserTables 
              users={users.parents} 
              loading={loading} 
              userType="parents"
              onViewUser={handleViewUser} 
              onRemoveAccess={handleRemoveAccess} 
              currentTab={activeTab} 
              userRole={userRole}
              isModerator={isUserModerator()}
            />
          )}

          {/* Utilisateurs */}
          {activeTab === "utilisateurs" && (
            <UserTables 
              users={users.utilisateurs} 
              loading={loading} 
              userType="utilisateurs"
              onViewUser={handleViewUser} 
              onRemoveAccess={handleRemoveAccess}
              onDeleteUser={handleDeleteUser} 
              currentTab={activeTab} 
              userRole={userRole}
              isModerator={isUserModerator()}
            />
          )}

          {/* Demandes d'accès */}
          {activeTab === "access-requests" && (
            <UserTables 
              users={users.accessRequests} 
              loading={loading} 
              userType="access-requests"
              onViewUser={handleViewUser} 
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest} 
              currentTab={activeTab} 
              userRole={userRole}
              isModerator={isUserModerator()}
            />
          )}

          {/* Cours */}
          {activeTab === "courses" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-slate-800">Cours programmés</h3>
                  <Text type="secondary" className="text-xs">Cours de la classe (visibles par tous les membres)</Text>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag color="blue">{courses.length} cours</Tag>
                  {onNavigateToCoursManagement && (
                    <Button
                      size="small"
                      icon={<BookOutlined />}
                      onClick={() => onNavigateToCoursManagement(classId)}
                    >
                      Voir tout
                    </Button>
                  )}
                  {isUserModerator() && onNavigateToCourseCreation && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => onNavigateToCourseCreation(classId)}
                    >
                      Programmer
                    </Button>
                  )}
                </div>
              </div>
              <Table
                dataSource={courses}
                rowKey="id"
                columns={[
                  { title: 'Cours', dataIndex: ['cours', 'titre'], key: 'titre', render: (v, r) => v || r.description || '—' },
                  { title: 'Date prévue', dataIndex: 'dateCoursPrevue', key: 'date', render: d => d ? new Date(d).toLocaleString('fr-FR') : '—' },
                  { title: 'Lieu', dataIndex: 'lieu', key: 'lieu', render: v => v || '—' },
                  { title: 'Statut', dataIndex: 'etatCoursProgramme', key: 'etat', render: e => {
                    const colorMap = { "EN_COURS": "green", "PLANIFIE": "blue", "ANNULE": "red", "TERMINE": "default" };
                    const labelMap = { "EN_COURS": "En cours", "PLANIFIE": "Planifié", "ANNULE": "Annulé", "TERMINE": "Terminé" };
                    return <Tag color={colorMap[e] || "default"}>{labelMap[e] || e}</Tag>;
                  }},
                ]}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: "Aucun cours programmé pour cette classe" }}
              />
            </div>
          )}

          {/* Exercices */}
          {activeTab === "exercises" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-slate-800">Exercices programmés</h3>
                  <Text type="secondary" className="text-xs">Liste des exercices pour cette classe</Text>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color="purple">{exercises.length} exercices</Tag>
                  {isUserModerator() && onNavigateToExerciseManagement && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => onNavigateToExerciseManagement(classId)}
                      style={{ backgroundColor: '#9333ea', borderColor: '#9333ea' }}
                    >
                      Programmer
                    </Button>
                  )}
                </div>
              </div>
              <Table 
                dataSource={exercises}
                rowKey="id"
                columns={[
                  { title: 'Date Prévue', dataIndex: 'dateExoPrevue', key: 'date', render: d => new Date(d).toLocaleString('fr-FR') },
                  { title: 'Statut', dataIndex: 'etat', key: 'etat', render: e => {
                    const colorMap = { "ACTIF": "green", "PUBLIE": "green", "BROUILLON": "orange", "EN_ATTENTE_CORRECTION": "blue", "CORRIGE": "cyan", "ANNULE": "red" };
                    return <Tag color={colorMap[e] || "default"}>{e}</Tag>
                  }},
                  { title: 'Actions', key: 'actions', render: (_, record) => (
                    <Button type="link" size="small" onClick={() => onNavigateToExerciseManagement?.(classId)}>Détails</Button>
                  )}
                ]}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: "Aucun exercice programmé pour cette classe" }}
              />
            </div>
          )}

          {/* Événements */}
          {activeTab === "events" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-slate-800">Événements de la classe</h3>
                  <Text type="secondary" className="text-xs">Actualités et événements à venir</Text>
                </div>
                <Tag color="orange">{events.length} événements</Tag>
              </div>
              <Table 
                dataSource={events}
                rowKey="id"
                columns={[
                  { title: 'Titre', dataIndex: 'titre', key: 'titre' },
                  { title: 'Lieu', dataIndex: 'lieu', key: 'lieu' },
                  { title: 'Début', dataIndex: 'heureDebut', key: 'debut', render: d => new Date(d).toLocaleString('fr-FR') },
                  { title: 'Statut', dataIndex: 'etat', key: 'etat', render: e => {
                    const colorMap = { "EN_COURS": "green", "PLANIFIE": "blue", "A_VENIR": "blue", "PASSE": "default", "ANNULE": "red" };
                    return <Tag color={colorMap[e] || "default"}>{e}</Tag>
                  }}
                ]}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: "Aucun événement pour cette classe" }}
              />
            </div>
          )}

        </div>{/* end tab content */}
      </div>{/* end w-full */}

      {userViewModalVisible && selectedUser && (
        <RenderUserModal
          user={selectedUser}
          visible={userViewModalVisible}
          onClose={handleCloseModal}
        />
      )}

      {/* Reject Modal */}
      <Modal
        title="Rejeter la demande d'accès"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason("");
          setRejectingUser(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setRejectModalVisible(false)}>
            Annuler
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            onClick={confirmRejectRequest}
          >
            Rejeter
          </Button>,
        ]}
      >
        <p>
          Veuillez saisir le motif du rejet pour {rejectingUser?.prenom}{" "}
          {rejectingUser?.nom}:
        </p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Motif du rejet..."
        />
      </Modal>

      {/* History Modal */}
      <Modal
        title="Historique d'activation"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {history.length === 0 ? (
            <Text type="secondary">Aucun historique disponible</Text>
          ) : (
            history.map((item, index) => (
              <div
                key={item.id}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #f0f0f0",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text strong>
                    {item.active ? "Activation" : "Désactivation"} -{" "}
                    {item.etatClasse}
                  </Text>
                  <Text type="secondary">
                    {new Date(item.dateActivation).toLocaleString()}
                  </Text>
                </div>

                <div style={{ marginTop: 8 }}>
                  <Text>Utilisateur ID: {item.utilisateurId}</Text>
                </div>

                {item.dateDesactivation && (
                  <div style={{ marginTop: 8 }}>
                    <Text>Date de désactivation: </Text>
                    <Text>
                      {new Date(item.dateDesactivation).toLocaleString()}
                    </Text>
                  </div>
                )}

                {item.motifDesactivation && (
                  <div style={{ marginTop: 8 }}>
                    <Text>Motif: </Text>
                    <Text>{item.motifDesactivation}</Text>
                  </div>
                )}

                <div style={{ marginTop: 8 }}>
                  <Text>Statut: </Text>
                  <Tag color={item.active ? "green" : "red"}>
                    {item.active ? "Actif" : "Inactif"}
                  </Tag>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Moderator Assignment Modal */}
      <Modal
        title="Assigner un modérateur"
        open={moderatorModalVisible}
        onCancel={() => {
          setModeratorModalVisible(false);
          setModeratorSearchQuery("");
          setModeratorSearchResults([]);
          setSelectedModerator(null);
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Rechercher un professeur par nom ou email:</Text>
          <Space.Compact style={{ width: "100%", marginTop: 8 }}>
            <Input
              placeholder="Entrez le nom ou l'email du professeur"
              value={moderatorSearchQuery}
              onChange={(e) => setModeratorSearchQuery(e.target.value)}
              onPressEnter={handleSearchModerator}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearchModerator}
              loading={moderatorSearchLoading}
            >
              Rechercher
            </Button>
          </Space.Compact>
        </div>

        {moderatorSearchResults.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Professeurs trouvés:</Text>
            <List
              size="small"
              dataSource={moderatorSearchResults}
              renderItem={(professor) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => setSelectedModerator(professor)}
                      disabled={selectedModerator?.id === professor.id}
                    >
                      {selectedModerator?.id === professor.id
                        ? "Sélectionné"
                        : "Sélectionner"}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={`${professor.nom} ${professor.prenom}`}
                    description={
                      <div>
                        <div>{professor.email}</div>
                        {professor.nomEtablissement && (
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            Établissement: {professor.nomEtablissement}
                          </div>
                        )}
                        {professor.matriculeProfesseur && (
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            Matricule: {professor.matriculeProfesseur}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {selectedModerator && (
          <div>
            <Divider />
            <Text strong>
              Modérateur sélectionné: {selectedModerator.nom}{" "}
              {selectedModerator.prenom}
            </Text>
            <div style={{ marginTop: 8, fontSize: "14px", color: "#666" }}>
              <div>Email: {selectedModerator.email}</div>
              {selectedModerator.nomEtablissement && (
                <div>Établissement: {selectedModerator.nomEtablissement}</div>
              )}
            </div>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setSelectedModerator(null);
                    setModeratorSearchQuery("");
                    setModeratorSearchResults([]);
                  }}
                >
                  Annuler la sélection
                </Button>
                <Button
                  type="primary"
                  onClick={handleModeratorAssign}
                  loading={actionLoading === "moderator"}
                >
                  Assigner comme modérateur
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Publication Rights Modal */}
      <Modal
        title="Gérer les droits de publication"
        open={publicationRightsModalVisible}
        onCancel={() => {
          setPublicationRightsModalVisible(false);
          setSearchEmail("");
          setSearchResults([]);
          setSelectedUserForRights(null);
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Rechercher un utilisateur par nom ou email:</Text>
          <Space.Compact style={{ width: "100%", marginTop: 8 }}>
            <Input
              placeholder="Entrez le nom ou l'email de l'utilisateur"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onPressEnter={handleSearchUserByEmail}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearchUserByEmail}
              loading={searchLoading}
            >
              Rechercher
            </Button>
          </Space.Compact>
        </div>

        {searchResults.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Résultats de la recherche:</Text>
            <List
              size="small"
              dataSource={searchResults}
              renderItem={(user) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => setSelectedUserForRights(user)}
                      disabled={selectedUserForRights?.id === user.id}
                    >
                      {selectedUserForRights?.id === user.id
                        ? "Sélectionné"
                        : "Sélectionner"}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={`${user.nom} ${user.prenom}`}
                    description={
                      <div>
                        <div>{user.email}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Type:{" "}
                          {user.type || user.typeUtilisateur || "Utilisateur"}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {selectedUserForRights && (
          <div>
            <Divider />
            <Text strong>
              Droits à assigner à {selectedUserForRights.nom}{" "}
              {selectedUserForRights.prenom}:
            </Text>
            <div style={{ marginTop: 8 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Checkbox
                    checked={publicationRights.peutPublier}
                    onChange={(e) =>
                      setPublicationRights({
                        ...publicationRights,
                        peutPublier: e.target.checked,
                      })
                    }
                  >
                    Peut publier
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={publicationRights.peutModerer}
                    onChange={(e) =>
                      setPublicationRights({
                        ...publicationRights,
                        peutModerer: e.target.checked,
                      })
                    }
                  >
                    Peut modérer
                  </Checkbox>
                </div>
              </Space>
            </div>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setSelectedUserForRights(null);
                    setSearchEmail("");
                    setSearchResults([]);
                  }}
                >
                  Annuler la sélection
                </Button>
                <Button
                  type="primary"
                  onClick={handleAssignPublicationRights}
                  loading={actionLoading === "assignPublicationRights"}
                >
                  Assigner les droits
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Admin Class Rejection Modal ── */}
      {classRejectModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #fef2f2 0%, #fff 100%)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                  <XIcon size={16} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Rejeter la classe</h3>
                  <p className="text-xs text-slate-500">{classDetails?.nom}</p>
                </div>
              </div>
              <button onClick={() => setClassRejectModalVisible(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
                <XIcon size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Motif de rejet <span className="text-red-500">*</span>
                </label>
                {classRejectMotifsLoading ? (
                  <div className="flex items-center gap-2 py-2 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                    Chargement des motifs...
                  </div>
                ) : classRejectMotifs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun motif disponible.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {classRejectMotifs.map((m) => (
                      <label key={m.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          classRejectSelectedCode === m.code
                            ? "border-red-400 bg-red-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}>
                        <input
                          type="radio"
                          name="classMotif"
                          value={m.code}
                          checked={classRejectSelectedCode === m.code}
                          onChange={() => setClassRejectSelectedCode(m.code)}
                          className="mt-0.5 accent-red-600 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{m.code}</p>
                          {m.descriptif && <p className="text-xs text-slate-500 mt-0.5">{m.descriptif}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Commentaire supplémentaire <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={classRejectMotifSupp}
                  onChange={(e) => setClassRejectMotifSupp(e.target.value)}
                  placeholder="Précisez si nécessaire..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none transition-all"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                onClick={() => setClassRejectModalVisible(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                Annuler
              </button>
              <button
                onClick={confirmClassReject}
                disabled={!classRejectSelectedCode || actionLoading === "admin-reject"}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#dc2626" }}>
                {actionLoading === "admin-reject" ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <XIcon size={14} />
                )}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageClassDetailsView;
