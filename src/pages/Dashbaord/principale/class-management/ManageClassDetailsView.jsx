// ManageClassDetailsView.jsx - UPDATED VERSION WITH SELF-APPROVAL FEATURE
import React, { useState, useEffect } from "react";
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
} from "antd";
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
  CopyOutlined, // Add this line
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

const ManageClassDetailsView = ({ classId, onBack }) => {
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
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

  // Form and data states
  const [form] = Form.useForm();
  const [history, setHistory] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [rejectionMotifs, setRejectionMotifs] = useState([]);
  const [selectedPublicationRight, setSelectedPublicationRight] = useState("");

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
    const isCreator =
      classDetails.createurId === currentUserId ||
      classDetails.utilisateurId === currentUserId;

    // Check if payment is OK (you might need to adjust this based on your payment status field)
    const paymentOk =
      classDetails.paymentStatus === "SUCCESS" ||
      classDetails.paiementEffectue === true ||
      classDetails.etat === "ACTIF"; // Assuming active status means payment is OK

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
      setClassDetails(details);
      setSelectedPublicationRight(
        details.droitPublication || "PROFESSEURS_SEULEMENT"
      );

      // Load all user data in parallel
      await Promise.all([
        loadUsersWithAccess(),
        loadAccessRequests(),
        loadModeratorsAndRights(),
        loadStudentsAlternative(), // Alternative method to ensure students are loaded
      ]);
    } catch (error) {
      message.error("Erreur lors du chargement des détails de la classe");
      console.error("Error loading class details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Alternative method to load students if main method fails
  const loadStudentsAlternative = async () => {
    try {
      // Only run if no students were loaded via the main method
      if (users.eleves.length === 0) {
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
        setUsersWithPublicationRights(rightsResult.data || []);
        console.log("Users with publication rights:", rightsResult.data);
      }

      // Get moderators (users with moderation rights)
      const moderators = (rightsResult.data || []).filter(
        (user) => user.peutModerer
      );
      setModeratorsWithRights(moderators);
      console.log("Moderators with rights:", moderators);
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

      // Enhanced categorization with detailed logging and forced categorization
      const categorizedUsers = {
        professeurs: [],
        eleves: [],
        parents: [],
        utilisateurs: [],
      };

      // Get all user data in parallel for better categorization
      const [allProfessors, allStudents, allParents] = await Promise.all([
        scholchatService.getAllProfessors().catch(() => []),
        scholchatService.getAllStudents().catch(() => []),
        scholchatService.getAllParents().catch(() => []),
      ]);

      console.log("Reference data loaded:", {
        professorsCount: allProfessors.length,
        studentsCount: allStudents.length,
        parentsCount: allParents.length,
      });

      // Process each user with access
      for (const user of usersWithAccess) {
        let categorized = false;

        // First, try to categorize by explicit type markers
        const userType = (
          user.type ||
          user.role ||
          user.typeUtilisateur ||
          ""
        ).toUpperCase();

        console.log(
          `Processing user ${user.id}: ${user.prenom} ${user.nom}, type: ${userType}`
        );

        // Try exact type matching first
        switch (userType) {
          case "PROFESSEUR":
          case "PROFESSOR":
            const professorData =
              allProfessors.find((p) => p.id === user.id) || user;
            categorizedUsers.professeurs.push({
              ...professorData,
              type: "PROFESSEUR",
              typeUtilisateur: "PROFESSEUR",
            });
            categorized = true;
            console.log("Categorized as professor:", professorData);
            break;

          case "ELEVE":
          case "ÉLÈVE":
          case "STUDENT":
            const studentData =
              allStudents.find((s) => s.id === user.id) || user;
            categorizedUsers.eleves.push({
              ...studentData,
              type: "ELEVE",
              typeUtilisateur: "ELEVE",
            });
            categorized = true;
            console.log("Categorized as student:", studentData);
            break;

          case "PARENT":
            const parentData = allParents.find((p) => p.id === user.id) || user;
            categorizedUsers.parents.push({
              ...parentData,
              type: "PARENT",
              typeUtilisateur: "PARENT",
            });
            categorized = true;
            console.log("Categorized as parent:", parentData);
            break;
        }

        // If not categorized by type, try to find them in the reference data
        if (!categorized) {
          // Check if they exist in professors
          const foundProfessor = allProfessors.find((p) => p.id === user.id);
          if (foundProfessor) {
            categorizedUsers.professeurs.push({
              ...foundProfessor,
              type: "PROFESSEUR",
              typeUtilisateur: "PROFESSEUR",
            });
            categorized = true;
            console.log("Found and categorized as professor:", foundProfessor);
          }

          // Check if they exist in students
          if (!categorized) {
            const foundStudent = allStudents.find((s) => s.id === user.id);
            if (foundStudent) {
              categorizedUsers.eleves.push({
                ...foundStudent,
                type: "ELEVE",
                typeUtilisateur: "ELEVE",
              });
              categorized = true;
              console.log("Found and categorized as student:", foundStudent);
            }
          }

          // Check if they exist in parents
          if (!categorized) {
            const foundParent = allParents.find((p) => p.id === user.id);
            if (foundParent) {
              categorizedUsers.parents.push({
                ...foundParent,
                type: "PARENT",
                typeUtilisateur: "PARENT",
              });
              categorized = true;
              console.log("Found and categorized as parent:", foundParent);
            }
          }
        }

        // If still not categorized, check by data structure characteristics
        if (!categorized) {
          if (user.nomEtablissement || user.matriculeProfesseur) {
            categorizedUsers.professeurs.push({
              ...user,
              type: "PROFESSEUR",
              typeUtilisateur: "PROFESSEUR",
            });
            categorized = true;
            console.log("Categorized as professor by data structure:", user);
          } else if (user.niveau) {
            categorizedUsers.eleves.push({
              ...user,
              type: "ELEVE",
              typeUtilisateur: "ELEVE",
            });
            categorized = true;
            console.log("Categorized as student by data structure:", user);
          } else if (user.adresse && !user.niveau && !user.nomEtablissement) {
            categorizedUsers.parents.push({
              ...user,
              type: "PARENT",
              typeUtilisateur: "PARENT",
            });
            categorized = true;
            console.log("Categorized as parent by data structure:", user);
          }
        }

        // If still not categorized, put in utilisateurs
        if (!categorized) {
          categorizedUsers.utilisateurs.push({
            ...user,
            type: "utilisateur",
            typeUtilisateur: "UTILISATEUR",
          });
          console.log("Categorized as general user:", user);
        }
      }

      console.log("Final categorized users:", {
        professeurs: categorizedUsers.professeurs.length,
        eleves: categorizedUsers.eleves.length,
        parents: categorizedUsers.parents.length,
        utilisateurs: categorizedUsers.utilisateurs.length,
        details: categorizedUsers,
      });

      setUsers((prev) => ({
        ...prev,
        ...categorizedUsers,
      }));

      // Update statistics
      setStatistics((prevStats) => ({
        ...prevStats,
        professeurs: categorizedUsers.professeurs.length,
        eleves: categorizedUsers.eleves.length,
        parents: categorizedUsers.parents.length,
        utilisateurs: categorizedUsers.utilisateurs.length,
      }));
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
        message.error("Erreur lors du rejet de la classe");
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
          {isPending && (
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

  if (loading && !classDetails) {
    return (
      <div className="manage-class-details-view loading-container">
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
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "2px solid #f0f2f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{
              marginRight: "16px",
              borderRadius: "8px",
              background: "#f8f9fa",
              borderColor: "#e1e4e8",
            }}
          />
          <div>
            <Title level={3} style={{ margin: 0, color: "#2c3e50" }}>
              <BookOutlined style={{ marginRight: "8px", color: "#4a6da7" }} />
              Gestion de la classe
            </Title>
            <Text strong style={{ fontSize: "18px", color: "#4a6da7" }}>
              {classDetails?.nom}
            </Text>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {classDetails?.etat && getStatusTag(classDetails.etat)}
          {canSelfApproveReject() && isClassPendingApproval() && (
            <Tag icon={<CrownOutlined />} color="gold">
              En attente de votre approbation
            </Tag>
          )}
          <div
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #4a6da7 0%, #3a5069 100%)",
              borderRadius: "20px",
              color: "white",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            <TeamOutlined style={{ marginRight: "6px" }} />
            {classDetails?.nombreEtudiants || statistics.eleves} étudiants
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards statistics={statistics} loading={loading} />

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Class Information Card */}
      <Card
        style={{
          marginBottom: 20,
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      ></Card>

      {/* Main Content Tabs */}
      <Card className="tabs-container">
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane
            tab={
              <span>
                <BookOutlined />
                Aperçu
              </span>
            }
            key="overview"
          >
            <div className="overview-content">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card title="Informations de la classe" size="small">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Nom">
                        {classDetails.nom}
                      </Descriptions.Item>
                      <Descriptions.Item label="Niveau">
                        {classDetails.niveau}
                      </Descriptions.Item>
                      <Descriptions.Item label="Code d'activation">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Text
                            code
                            style={{ fontSize: "14px", fontWeight: "bold" }}
                          >
                            {classDetails.codeActivation}
                          </Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(
                                classDetails.codeActivation
                              );
                              message.success("Code d'activation copié!");
                            }}
                            title="Copier le code d'activation"
                          />
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Date de création">
                        {new Date(
                          classDetails.dateCreation
                        ).toLocaleDateString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Statut">
                        {getStatusTag(classDetails.etat)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Droits de publication">
                        {getPublicationRightsTag(classDetails.droitPublication)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Établissement">
                        {classDetails.etablissement?.nom || "Non assigné"}
                        {!classDetails.etablissement?.nom && (
                          <Tag color="orange" style={{ marginLeft: 8 }}>
                            Classe indépendante
                          </Tag>
                        )}
                      </Descriptions.Item>
                      {classDetails.createurId && (
                        <Descriptions.Item label="Créateur">
                          {classDetails.createurId === currentUserId ? (
                            <Tag icon={<CrownOutlined />} color="gold">
                              Vous
                            </Tag>
                          ) : (
                            "Utilisateur ID: " + classDetails.createurId
                          )}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card title="Modérateur" size="small">
                    {renderModeratorInfo()}
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined />
                Professeurs ({statistics.professeurs})
              </span>
            }
            key="professeurs"
          >
            <UserTables
              users={users.professeurs}
              loading={loading}
              userType="professeurs"
              onViewUser={handleViewUser}
              onRemoveAccess={handleRemoveAccess}
              currentTab={activeTab}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Élèves ({statistics.eleves})
              </span>
            }
            key="eleves"
          >
            <UserTables
              users={users.eleves}
              loading={loading}
              userType="eleves"
              onViewUser={handleViewUser}
              onRemoveAccess={handleRemoveAccess}
              currentTab={activeTab}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Parents ({statistics.parents})
              </span>
            }
            key="parents"
          >
            <UserTables
              users={users.parents}
              loading={loading}
              userType="parents"
              onViewUser={handleViewUser}
              onRemoveAccess={handleRemoveAccess}
              currentTab={activeTab}
            />
          </TabPane>

          {/* NEW: Utilisateurs Tab */}
          <TabPane
            tab={
              <span>
                <UserOutlined />
                Utilisateurs ({statistics.utilisateurs})
              </span>
            }
            key="utilisateurs"
          >
            <UserTables
              users={users.utilisateurs}
              loading={loading}
              userType="utilisateurs"
              onViewUser={handleViewUser}
              onRemoveAccess={handleRemoveAccess}
              onDeleteUser={handleDeleteUser}
              currentTab={activeTab}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <ClockCircleOutlined />
                Demandes d'accès ({statistics.accessRequests})
              </span>
            }
            key="access-requests"
          >
            <UserTables
              users={users.accessRequests}
              loading={loading}
              userType="access-requests"
              onViewUser={handleViewUser}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
              currentTab={activeTab}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* User View Modal - Dynamic based on user type */}
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
    </div>
  );
};

export default ManageClassDetailsView;
