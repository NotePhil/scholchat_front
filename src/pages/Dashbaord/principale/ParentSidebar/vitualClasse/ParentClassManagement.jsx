import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
} from "@mui/material";
import {
  School as SchoolIcon,
  Groups as GroupsIcon,
  Description as DescriptionIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  AccountCircle as AccountCircleIcon,
  Refresh as RefreshIcon,
  ViewModule as ViewModuleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Login as LoginIcon,
  Pending as PendingIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { classService } from "../../../../services/ClassService";
import { coursProgrammerService } from "../../../../services/coursProgrammerService";
import AccederService from "../../../../services/accederService";
import ParentClassManagementModal from "./ParentClassManagementModal";
import VirtualClassroomPage from "./VirtualClassroomPage";

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderRadius: "16px",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    borderColor: theme.palette.primary.main,
  },
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  borderRadius: "24px",
  overflow: "hidden",
  marginBottom: theme.spacing(4),
  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
}));

const GradientHeader = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  padding: theme.spacing(4),
  color: "white",
}));

const LevelChip = styled(Chip)(({ theme, level }) => {
  const colorMap = {
    MATERNELLE: { bg: "#E3F2FD", color: "#1976D2" },
    PRIMAIRE: { bg: "#E8F5E8", color: "#2E7D32" },
    COLLEGE: { bg: "#FFF3E0", color: "#F57C00" },
    LYCEE: { bg: "#FFEBEE", color: "#D32F2F" },
    UNIVERSITE: { bg: "#F3E5F5", color: "#7B1FA2" },
    AUTRES: { bg: "#F5F5F5", color: "#616161" },
  };

  const colors = colorMap[level] || colorMap["AUTRES"];

  return {
    backgroundColor: colors.bg,
    color: colors.color,
    fontWeight: 600,
    fontSize: "0.75rem",
    height: 24,
    borderRadius: "12px",
    "& .MuiChip-label": {
      padding: "0 8px",
    },
  };
});

const AccessStatusChip = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "APPROVED":
        return {
          label: "Accès autorisé",
          color: "#2E7D32",
          bg: "#E8F5E8",
          icon: <CheckCircleIcon />,
        };
      case "PENDING":
        return {
          label: "Demande en cours",
          color: "#F57C00",
          bg: "#FFF3E0",
          icon: <PendingIcon />,
        };
      case "REJECTED":
        return {
          label: "Demande refusée",
          color: "#D32F2F",
          bg: "#FFEBEE",
          icon: <PendingIcon />,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <Chip
      label={config.label}
      size="small"
      icon={config.icon}
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: "0.75rem",
        height: 28,
        borderRadius: "14px",
        "& .MuiChip-icon": {
          color: config.color,
        },
      }}
    />
  );
};

const CourseCountChip = styled(Chip)(({ theme }) => ({
  backgroundColor: "#F0F4FF",
  color: "#4F46E5",
  fontWeight: 700,
  fontSize: "0.75rem",
  height: 32,
  borderRadius: "16px",
  border: "2px solid #E0E7FF",
  "& .MuiChip-label": {
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  "& .MuiChip-icon": {
    color: "#4F46E5",
    marginLeft: "0 !important",
    marginRight: "4px !important",
  },
}));

const ActionButton = styled(Button)(({ theme, variant: buttonVariant }) => ({
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 600,
  padding: "8px 16px",
  minWidth: "auto",
  ...(buttonVariant === "contained" && {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
    "&:hover": {
      background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
      boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
    },
  }),
  ...(buttonVariant === "outlined" && {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    "&:hover": {
      backgroundColor: theme.palette.primary.main + "08",
      borderColor: theme.palette.primary.main,
    },
  }),
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
  minHeight: "60vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  borderRadius: "24px",
  padding: theme.spacing(4),
}));

const EmptyState = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(8),
  background: "white",
  borderRadius: "24px",
  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
}));

const ParentClassManagement = () => {
  const navigate = useNavigate();
  const [allClasses, setAllClasses] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [userAccessStatus, setUserAccessStatus] = useState({});
  const [courseCounts, setCourseCounts] = useState({});
  const [pendingDialog, setPendingDialog] = useState({
    open: false,
    className: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [activationCode, setActivationCode] = useState("");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [foundClass, setFoundClass] = useState(null);
  const [classroomView, setClassroomView] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  const userId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("userEmail");
  const username = localStorage.getItem("username");

  const getLevelFromNiveau = (niveau) => {
    if (niveau.includes("Maternelle")) return "MATERNELLE";
    if (
      niveau.includes("Primaire") ||
      niveau.includes("CP") ||
      niveau.includes("CE") ||
      niveau.includes("CM")
    )
      return "PRIMAIRE";
    if (
      niveau.includes("6ème") ||
      niveau.includes("5ème") ||
      niveau.includes("4ème") ||
      niveau.includes("3ème")
    )
      return "COLLEGE";
    if (
      niveau.includes("2nde") ||
      niveau.includes("1ère") ||
      niveau.includes("Terminale")
    )
      return "LYCEE";
    if (
      niveau.includes("Licence") ||
      niveau.includes("Master") ||
      niveau.includes("Doctorat")
    )
      return "UNIVERSITE";
    return "AUTRES";
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getAccessStatus = (classId) => {
    return userAccessStatus[classId] || "NONE";
  };

  const hasApprovedAccess = (classId) => {
    return getAccessStatus(classId) === "APPROVED";
  };

  const hasPendingRequest = (classId) => {
    return getAccessStatus(classId) === "PENDING";
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    showSnackbar("Liste des classes actualisée", "success");
  };

  const fetchCourseCountsForUser = async (classIds) => {
    try {
      // Fetch all courses for this participant
      const userCourses =
        await coursProgrammerService.obtenirProgrammationParParticipant(userId);

      // Group courses by class and count them
      const counts = {};
      classIds.forEach((classId) => {
        const classSpecificCourses = userCourses.filter(
          (course) => course.classeId === classId
        );
        counts[classId] = classSpecificCourses.length;
      });

      setCourseCounts(counts);
    } catch (error) {
      console.error("Error fetching course counts:", error);
      // Set all counts to 0 if there's an error
      const counts = {};
      classIds.forEach((classId) => {
        counts[classId] = 0;
      });
      setCourseCounts(counts);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get all classes first
      const allClassesData = await classService.obtenirToutesLesClasses();
      setAllClasses(allClassesData.filter((c) => c.etat === "ACTIF"));

      // Get user's approved classes
      const approvedClasses = await AccederService.obtenirClassesAccessibles(
        userId
      );

      // Get user's access requests
      const accessRequests = await Promise.all(
        allClassesData.map((classe) =>
          AccederService.obtenirDemandesAccesPourClasse(classe.id)
        )
      ).then((results) => results.flat());

      const userRequests = accessRequests.filter(
        (request) => request.utilisateurId === userId
      );

      // Create access status map
      const accessStatusMap = {};

      approvedClasses.forEach((classe) => {
        accessStatusMap[classe.id] = "APPROVED";
      });

      userRequests.forEach((request) => {
        if (!accessStatusMap[request.classeId]) {
          accessStatusMap[request.classeId] = request.statut;
        }
      });

      setUserAccessStatus(accessStatusMap);

      // Get classes the user has access to or has requested
      const userClassIds = Object.keys(accessStatusMap);
      const userClassesData = allClassesData.filter(
        (c) => userClassIds.includes(c.id) && c.etat === "ACTIF"
      );

      setUserClasses(userClassesData);

      // Fetch course counts for approved classes only
      const approvedClassIds = userClassesData
        .filter((classe) => hasApprovedAccess(classe.id))
        .map((classe) => classe.id);

      if (approvedClassIds.length > 0) {
        await fetchCourseCountsForUser(approvedClassIds);
      }
    } catch (err) {
      setError(err.message);
      showSnackbar(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [userId, navigate]);

  const handleClassClick = (classe, isRequest = false) => {
    setSelectedClass(classe);
    setIsRequestMode(isRequest);
    setModalOpen(true);
  };

  const handleAccessClick = (classe) => {
    if (hasApprovedAccess(classe.id)) {
      // Navigate to the classroom view
      setSelectedClassroom(classe);
      setClassroomView(true);
    } else if (hasPendingRequest(classe.id)) {
      setPendingDialog({
        open: true,
        className: classe.nom,
      });
    }
  };

  const handleSearchClass = async () => {
    if (!activationCode) {
      showSnackbar("Veuillez entrer un code d'activation", "error");
      return;
    }

    try {
      const matchedClass = allClasses.find(
        (c) => c.codeActivation === activationCode
      );

      if (matchedClass) {
        setFoundClass(matchedClass);
        setSelectedClass(matchedClass);
        setIsRequestMode(true);
        setModalOpen(true);
        setSearchDialogOpen(false);
        // Keep the activation code for the modal but don't reset it
      } else {
        showSnackbar(
          "Aucune classe trouvée avec ce code d'activation",
          "error"
        );
        setFoundClass(null);
      }
    } catch (err) {
      showSnackbar(err.message, "error");
    }
  };

  const handleRequestAccess = async (classe, code) => {
    try {
      await AccederService.demanderAcces({
        utilisateurId: userId,
        classeId: classe.id,
        codeActivation: code,
      });

      showSnackbar("Demande d'accès envoyée avec succès", "success");

      setUserAccessStatus((prev) => ({
        ...prev,
        [classe.id]: "PENDING",
      }));

      setUserClasses((prev) => {
        if (!prev.some((c) => c.id === classe.id)) {
          return [...prev, classe];
        }
        return prev;
      });

      return true;
    } catch (err) {
      console.error("Error requesting access:", err);
      if (err.message.includes("Une demande d'accès est déjà en attente")) {
        showSnackbar(
          "Une demande d'accès est déjà en attente pour cette classe",
          "error"
        );
      } else {
        showSnackbar(
          err.response?.data?.message || "Erreur lors de la demande d'accès",
          "error"
        );
      }
      return false;
    }
  };

  if (classroomView && selectedClassroom) {
    return (
      <VirtualClassroomPage
        classData={selectedClassroom}
        userId={userId}
        onBack={() => setClassroomView(false)}
      />
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          py: 4,
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
          <LoadingOverlay>
            <CircularProgress
              size={60}
              sx={{
                color: "#667eea",
                mb: 3,
                "& .MuiCircularProgress-circle": {
                  strokeLinecap: "round",
                },
              }}
            />
            <Typography variant="h6" color="text.secondary" fontWeight={500}>
              Chargement des classes...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Veuillez patienter pendant que nous récupérons les données
            </Typography>
          </LoadingOverlay>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          py: 4,
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
          <EmptyState>
            <Box sx={{ color: "error.main", mb: 2 }}>
              <SchoolIcon sx={{ fontSize: 64 }} />
            </Box>
            <Typography
              variant="h5"
              color="error"
              fontWeight={600}
              gutterBottom
            >
              Erreur de chargement
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <ActionButton
              variant="contained"
              onClick={() => window.location.reload()}
              startIcon={<RefreshIcon />}
            >
              Réessayer
            </ActionButton>
          </EmptyState>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        <HeaderCard elevation={0}>
          <GradientHeader>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "16px",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <ViewModuleIcon sx={{ fontSize: 28, color: "white" }} />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color="white"
                    gutterBottom
                  >
                    Mes Classes
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "rgba(255, 255, 255, 0.9)" }}
                  >
                    {userClasses.length} classe
                    {userClasses.length !== 1 ? "s" : ""} disponible
                    {userClasses.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <ActionButton
                  variant="contained"
                  onClick={() => setSearchDialogOpen(true)}
                  startIcon={<SearchIcon />}
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  Rechercher une classe
                </ActionButton>
                <ActionButton
                  variant="contained"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  startIcon={
                    refreshing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <RefreshIcon />
                    )
                  }
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  {refreshing ? "Actualisation..." : "Actualiser"}
                </ActionButton>
              </Box>
            </Box>
          </GradientHeader>

          <Box sx={{ p: 3, backgroundColor: "rgba(102, 126, 234, 0.05)" }}>
            <Box display="flex" alignItems="center" gap={2}>
              <AccountCircleIcon sx={{ color: "primary.main", fontSize: 28 }} />
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.primary"
                >
                  Connecté en tant que: {username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userEmail}
                </Typography>
              </Box>
            </Box>
          </Box>
        </HeaderCard>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: "12px" }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {userClasses.length === 0 ? (
          <EmptyState>
            <SchoolIcon
              sx={{ fontSize: 80, color: "action.disabled", mb: 2 }}
            />
            <Typography
              variant="h5"
              fontWeight={600}
              color="text.primary"
              gutterBottom
            >
              Aucune classe disponible
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Vous n'avez pas encore accès à des classes. Recherchez une classe
              avec un code d'activation pour demander l'accès.
            </Typography>
            <ActionButton
              variant="contained"
              onClick={() => setSearchDialogOpen(true)}
              startIcon={<SearchIcon />}
            >
              Rechercher une classe
            </ActionButton>
          </EmptyState>
        ) : (
          <Grid container spacing={3}>
            {userClasses.map((classe) => {
              const accessStatus = getAccessStatus(classe.id);
              const isApproved = hasApprovedAccess(classe.id);
              const isPending = hasPendingRequest(classe.id);
              const courseCount = courseCounts[classe.id] || 0;

              return (
                <Grid item xs={12} sm={6} lg={4} key={classe.id}>
                  <StyledCard>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={3}
                      >
                        <Box flexGrow={1}>
                          <Typography
                            variant="h6"
                            component="div"
                            fontWeight={700}
                            gutterBottom
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {classe.nom}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {classe.niveau}
                          </Typography>
                        </Box>
                        <LevelChip
                          label={getLevelFromNiveau(classe.niveau)}
                          level={getLevelFromNiveau(classe.niveau)}
                        />
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <GroupsIcon
                          sx={{ fontSize: 18, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {classe.effectif || 0} élèves
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <DescriptionIcon
                          sx={{ fontSize: 18, color: "text.secondary" }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {classe.description || "Aucune description"}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mb={3}>
                        <AccessStatusChip status={accessStatus} />
                        {isApproved && (
                          <CourseCountChip
                            icon={<AssignmentIcon />}
                            label={`${courseCount} cours programmé${
                              courseCount !== 1 ? "s" : ""
                            }`}
                          />
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 3, pt: 0 }}>
                      {isApproved ? (
                        <ActionButton
                          variant="contained"
                          fullWidth
                          onClick={() => handleAccessClick(classe)}
                          startIcon={<LoginIcon />}
                        >
                          Accéder à la classe
                        </ActionButton>
                      ) : isPending ? (
                        <ActionButton
                          variant="outlined"
                          fullWidth
                          onClick={() => handleAccessClick(classe)}
                          startIcon={<HourglassEmptyIcon />}
                        >
                          Demande en attente
                        </ActionButton>
                      ) : (
                        <ActionButton
                          variant="contained"
                          fullWidth
                          onClick={() => handleClassClick(classe, true)}
                          startIcon={<PersonAddIcon />}
                        >
                          Demander l'accès
                        </ActionButton>
                      )}
                    </CardActions>
                  </StyledCard>
                </Grid>
              );
            })}
          </Grid>
        )}

        <ParentClassManagementModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          classe={selectedClass}
          isRequestMode={isRequestMode}
          onRequestAccess={handleRequestAccess}
        />

        <Dialog
          open={pendingDialog.open}
          onClose={() => setPendingDialog({ open: false, className: "" })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Demande en attente</DialogTitle>
          <DialogContent>
            <Typography>
              Votre demande d'accès pour la classe "{pendingDialog.className}"
              est en cours de traitement. Vous serez notifié une fois qu'elle
              sera approuvée.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setPendingDialog({ open: false, className: "" })}
            >
              Compris
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={searchDialogOpen}
          onClose={() => setSearchDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Rechercher une classe</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Entrez le code d'activation fourni par l'enseignant pour
              rechercher une classe.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Code d'activation"
              type="text"
              fullWidth
              variant="outlined"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSearchDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSearchClass}>Rechercher</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default ParentClassManagement;
