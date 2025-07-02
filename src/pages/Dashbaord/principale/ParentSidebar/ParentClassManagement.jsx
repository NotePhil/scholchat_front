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
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  School as SchoolIcon,
  Groups as GroupsIcon,
  Description as DescriptionIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  AccountCircle as AccountCircleIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  ViewModule as ViewModuleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Login as LoginIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { classService } from "../../../../services/ClassService";
import AccederService from "../../../../services/accederService";
import ParentClassManagementModal from "./ParentClassManagementModal";

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

const FilterCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "16px",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  "& .MuiTabs-indicator": {
    height: 3,
    borderRadius: "3px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  "& .MuiTab-root": {
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.95rem",
    minHeight: 48,
    color: theme.palette.text.secondary,
    "&.Mui-selected": {
      color: theme.palette.primary.main,
    },
  },
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
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [approvedClasses, setApprovedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [userAccessStatus, setUserAccessStatus] = useState({});
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [pendingDialog, setPendingDialog] = useState({
    open: false,
    className: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Get user data from localStorage
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
    // Check both the local status and the approved classes list
    return (
      getAccessStatus(classId) === "APPROVED" ||
      approvedClasses.some((c) => c.id === classId)
    );
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

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get all classes
      const classesData = await classService.obtenirToutesLesClasses();
      const activeClasses = classesData.filter((c) => c.etat === "ACTIF");
      setClasses(activeClasses);
      setFilteredClasses(activeClasses);

      // Get user's approved classes from the API
      try {
        const approvedClassesData =
          await AccederService.obtenirClassesAccessibles(userId);
        setApprovedClasses(approvedClassesData || []);
      } catch (approvedError) {
        console.warn("Failed to get approved classes:", approvedError);
        setApprovedClasses([]);
      }

      // Get access status for each class
      try {
        const accessStatusMap = {};
        const accessData = await AccederService.obtenirStatutAccesUtilisateur(
          userId
        );

        if (accessData) {
          Object.assign(accessStatusMap, accessData);
        }

        setUserAccessStatus(accessStatusMap);
      } catch (accessError) {
        console.warn("Failed to get access status:", accessError);
        setUserAccessStatus({});
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

  useEffect(() => {
    if (activeTab === "ALL") {
      setFilteredClasses(classes);
    } else {
      setFilteredClasses(
        classes.filter((c) => getLevelFromNiveau(c.niveau) === activeTab)
      );
    }
  }, [activeTab, classes]);

  const handleClassClick = (classe, isRequest = false) => {
    setSelectedClass(classe);
    setIsRequestMode(isRequest);
    setOpenDialog(true);
  };

  const handleAccessClick = (classe) => {
    if (hasApprovedAccess(classe.id)) {
      navigate(`/parent/classes/${classe.id}`);
    } else if (hasPendingRequest(classe.id)) {
      setPendingDialog({
        open: true,
        className: classe.nom,
      });
    }
  };

  const handleRequestAccess = async (classe, activationCode) => {
    try {
      await AccederService.demanderAcces({
        utilisateurId: userId,
        classeId: classe.id,
        codeActivation: activationCode,
      });
      showSnackbar("Demande d'accès envoyée avec succès", "success");

      setUserAccessStatus((prev) => ({
        ...prev,
        [classe.id]: "PENDING",
      }));

      return true;
    } catch (err) {
      showSnackbar(err.message, "error");
      return false;
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
                    Gestion des Classes
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "rgba(255, 255, 255, 0.9)" }}
                  >
                    {filteredClasses.length} classe
                    {filteredClasses.length !== 1 ? "s" : ""} disponible
                    {filteredClasses.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
              </Box>

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

        <FilterCard sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <FilterListIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Filtrer par niveau
            </Typography>
          </Box>

          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="Tous" value="ALL" />
            <Tab label="Maternelle" value="MATERNELLE" />
            <Tab label="Primaire" value="PRIMAIRE" />
            <Tab label="Collège" value="COLLEGE" />
            <Tab label="Lycée" value="LYCEE" />
            <Tab label="Université" value="UNIVERSITE" />
            <Tab label="Autres" value="AUTRES" />
          </StyledTabs>
        </FilterCard>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: "12px" }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {filteredClasses.length === 0 ? (
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
              {activeTab === "ALL"
                ? "Il n'y a actuellement aucune classe active dans le système."
                : `Aucune classe trouvée pour le niveau "${activeTab}".`}
            </Typography>
            <ActionButton
              variant="outlined"
              onClick={() => setActiveTab("ALL")}
              disabled={activeTab === "ALL"}
            >
              Voir toutes les classes
            </ActionButton>
          </EmptyState>
        ) : (
          <Grid container spacing={3}>
            {filteredClasses.map((classe) => {
              const accessStatus = getAccessStatus(classe.id);
              const isApproved = hasApprovedAccess(classe.id);
              const isPending = hasPendingRequest(classe.id);

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
                            color="text.primary"
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
                        </Box>
                        <LevelChip
                          label={classe.niveau}
                          level={getLevelFromNiveau(classe.niveau)}
                          size="small"
                        />
                      </Box>

                      <Box sx={{ space: 2 }}>
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={1.5}
                          mb={2}
                        >
                          <SchoolIcon
                            sx={{ fontSize: 20, color: "text.secondary" }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flexGrow: 1,
                            }}
                          >
                            {classe.etablissement?.nom || "Aucun établissement"}
                          </Typography>
                        </Box>

                        <Box
                          display="flex"
                          alignItems="center"
                          gap={1.5}
                          mb={2}
                        >
                          <GroupsIcon
                            sx={{ fontSize: 20, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {classe.eleves?.length || 0} élève
                            {(classe.eleves?.length || 0) !== 1 ? "s" : ""}
                          </Typography>
                        </Box>

                        {classe.dateCreation && (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1.5}
                            mb={2}
                          >
                            <SchoolIcon
                              sx={{ fontSize: 20, color: "text.secondary" }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Créée le{" "}
                              {new Date(classe.dateCreation).toLocaleDateString(
                                "fr-FR"
                              )}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {accessStatus !== "NONE" && (
                        <Box sx={{ mt: 2 }}>
                          <AccessStatusChip status={accessStatus} />
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ p: 3, pt: 0, gap: 1 }}>
                      <ActionButton
                        size="small"
                        variant="outlined"
                        startIcon={<DescriptionIcon />}
                        onClick={() => handleClassClick(classe, false)}
                        sx={{ flexGrow: 1 }}
                      >
                        Détails
                      </ActionButton>

                      {isApproved ? (
                        <ActionButton
                          size="small"
                          variant="contained"
                          startIcon={<LoginIcon />}
                          onClick={() =>
                            navigate(`/parent/classes/${classe.id}`)
                          }
                          sx={{ flexGrow: 1 }}
                        >
                          Accéder à la classe
                        </ActionButton>
                      ) : isPending ? (
                        <ActionButton
                          size="small"
                          variant="contained"
                          startIcon={<HourglassEmptyIcon />}
                          onClick={() => handleAccessClick(classe)}
                          sx={{
                            flexGrow: 1,
                            backgroundColor: "#FFF3E0",
                            color: "#F57C00",
                            "&:hover": {
                              backgroundColor: "#FFE0B2",
                            },
                          }}
                        >
                          En attente
                        </ActionButton>
                      ) : (
                        <ActionButton
                          size="small"
                          variant="contained"
                          startIcon={<PersonAddIcon />}
                          onClick={() => handleClassClick(classe, true)}
                          sx={{ flexGrow: 1 }}
                        >
                          Demander Accès
                        </ActionButton>
                      )}
                    </CardActions>
                  </StyledCard>
                </Grid>
              );
            })}
          </Grid>
        )}

        {selectedClass && (
          <ParentClassManagementModal
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            classe={selectedClass}
            hasAccess={hasApprovedAccess(selectedClass.id)}
            onRequestAccess={handleRequestAccess}
            isRequestMode={isRequestMode}
          />
        )}

        <Dialog
          open={pendingDialog.open}
          onClose={() => setPendingDialog({ open: false, className: "" })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <HourglassEmptyIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>
                Demande en cours
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" color="text.secondary">
              Votre demande d'accès à la classe "{pendingDialog.className}" est
              en cours de traitement. Vous recevrez une notification une fois
              que l'enseignant aura approuvé votre demande.
            </Typography>
          </DialogContent>
          <DialogActions>
            <ActionButton
              onClick={() => setPendingDialog({ open: false, className: "" })}
              variant="outlined"
            >
              Fermer
            </ActionButton>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              borderRadius: "12px",
              fontWeight: 500,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default ParentClassManagement;
