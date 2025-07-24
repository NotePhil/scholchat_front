import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Grid,
  Avatar,
  Paper,
  Alert,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
} from "@mui/material";
import {
  School as SchoolIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  DateRange as DateRangeIcon,
  PersonAdd as PersonAddIcon,
  VpnKey as VpnKeyIcon,
  Info as InfoIcon,
  Class as ClassIcon,
  Subject as SubjectIcon,
  Schedule as ScheduleIcon,
  GroupAdd as GroupAddIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import axios from "axios";

const ParentClassManagementModalUpdate = ({
  open,
  onClose,
  classe,
  hasAccess,
  parentId,
  isRequestMode = false,
  activationCode: initialActivationCode = "",
}) => {
  const [activationCode, setActivationCode] = useState(initialActivationCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [classInfo, setClassInfo] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (initialActivationCode) {
      setActivationCode(initialActivationCode);
    }
  }, [initialActivationCode]);

  useEffect(() => {
    if (open && isRequestMode && activationCode) {
      fetchClassInfo();
    }
  }, [open, isRequestMode, activationCode]);

  const validateActivationCode = (code) => {
    return /^\d{6}$/.test(code);
  };

  const fetchClassInfo = async () => {
    if (!validateActivationCode(activationCode)) {
      setError("Le code d'activation doit contenir exactement 6 chiffres");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        "http://localhost:8486/scholchat/acceder/infos-classe",
        {
          params: {
            token: activationCode,
            classId: classe.id,
          },
        }
      );

      setClassInfo(response.data);

      if (response.data.accesMajeur && response.data.elevesAssocies) {
        setStudents(response.data.elevesAssocies);
      }
    } catch (err) {
      enqueueSnackbar(
        "Erreur lors de la récupération des informations de la classe",
        {
          variant: "error",
        }
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!activationCode.trim()) {
      setError("Veuillez entrer un code d'activation");
      return;
    }

    if (!validateActivationCode(activationCode)) {
      setError("Le code d'activation doit contenir exactement 6 chiffres");
      return;
    }

    if (classInfo?.accesMajeur && selectedStudents.length === 0) {
      setError("Veuillez sélectionner au moins un élève");
      return;
    }

    if (!classInfo?.accesMajeur && selectedStudents.length === 0) {
      setError("Veuillez ajouter au moins un élève");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const requestData = {
        classeId: classe.id,
        parentId: parentId,
        activationCode: activationCode,
      };

      if (classInfo?.accesMajeur) {
        requestData.elevesIds = selectedStudents.map((s) => s.id);
      } else {
        requestData.elevesNoms = selectedStudents.map((s) => s.nom);
      }

      await axios.post(
        "http://localhost:8486/scholchat/parent-access/acceder/demande",
        requestData
      );

      enqueueSnackbar("Demande d'accès envoyée avec succès", {
        variant: "success",
      });
      setHasPendingRequest(true);
      onClose();
    } catch (err) {
      console.error("Error submitting access request:", err);
      let errorMessage = "Une erreur est survenue";

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.message || "Données invalides";
        } else if (err.response.status === 409) {
          errorMessage =
            "Une demande d'accès est déjà en attente pour cette classe";
          setHasPendingRequest(true);
        }
      }

      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudents((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    );
  };

  const handleAddStudent = () => {
    if (newStudentName.trim()) {
      const newStudent = {
        id: `temp-${Date.now()}`,
        nom: newStudentName.trim(),
        prenom: "",
      };
      setSelectedStudents((prev) => [...prev, newStudent]);
      setNewStudentName("");
    }
  };

  const handleRemoveStudent = (studentId) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", py: 2 }}>
        <SchoolIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            {isRequestMode ? "Demande d'accès" : "Détails de la classe"}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {classe.nom}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {hasPendingRequest && (
          <Alert
            severity="info"
            icon={<InfoIcon />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            Une demande d'accès est déjà en attente pour cette classe
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Class Information Section */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 600, display: "flex", alignItems: "center" }}
              >
                <SchoolIcon sx={{ mr: 1.5, color: "primary.main" }} />
                Informations de la classe
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Nom"
                    secondary={classe.nom}
                    secondaryTypographyProps={{
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
                {/* ... other list items ... */}
              </List>
            </Paper>
          </Grid>

          {/* School Information Section */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 600, display: "flex", alignItems: "center" }}
              >
                <SchoolIcon sx={{ mr: 1.5, color: "primary.main" }} />
                Établissement
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Nom"
                    secondary={classe.etablissement?.nom || "Non spécifié"}
                    secondaryTypographyProps={{
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
                {/* ... other list items ... */}
              </List>
            </Paper>
          </Grid>

          {/* Moderator Information Section */}
          {classe.moderator && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <PersonIcon sx={{ mr: 1.5, color: "primary.main" }} />
                  Modérateur / Enseignant
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      mr: 3,
                      bgcolor: "primary.main",
                      fontSize: 24,
                      fontWeight: 500,
                    }}
                  >
                    {classe.moderator.nom.charAt(0)}
                    {classe.moderator.prenom.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {classe.moderator.prenom} {classe.moderator.nom}
                    </Typography>
                    {/* ... moderator details ... */}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Access Request Section */}
        {isRequestMode && !hasAccess && (
          <Box mt={4}>
            <Divider sx={{ mb: 3 }} />
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, display: "flex", alignItems: "center" }}
            >
              <PersonAddIcon sx={{ mr: 1.5, color: "primary.main" }} />
              Demande d'accès
            </Typography>

            {loading && !classInfo ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <DialogContentText sx={{ mb: 3 }}>
                  Pour demander l'accès à cette classe, veuillez entrer le code
                  d'activation à 6 chiffres fourni par l'établissement ou le
                  modérateur.
                </DialogContentText>

                <TextField
                  autoFocus
                  margin="dense"
                  label="Code d'activation (6 chiffres)"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={activationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setActivationCode(value);
                  }}
                  error={!!error}
                  helperText={error}
                  placeholder="Entrez 6 chiffres"
                  sx={{ mb: 2 }}
                  disabled={hasPendingRequest || loading}
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    maxLength: 6,
                  }}
                />

                {classInfo?.accesMajeur ? (
                  /* Major access form */
                  <Box mt={3}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                    >
                      Sélectionnez les élèves concernés
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        maxHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      {students.length > 0 ? (
                        <FormGroup>
                          {students.map((student) => (
                            <FormControlLabel
                              key={student.id}
                              control={
                                <Checkbox
                                  checked={selectedStudents.some(
                                    (s) => s.id === student.id
                                  )}
                                  onChange={() =>
                                    toggleStudentSelection(student)
                                  }
                                  disabled={loading}
                                />
                              }
                              label={`${student.prenom} ${student.nom}`}
                            />
                          ))}
                        </FormGroup>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Aucun élève trouvé dans cette classe
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                ) : (
                  /* Minor access form */
                  <Box mt={3}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                    >
                      Ajouter un nouvel élève
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        fullWidth
                        label="Nom de l'élève"
                        variant="outlined"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="Entrez le nom complet de l'élève"
                        disabled={loading}
                      />
                      <Button
                        variant="contained"
                        startIcon={<GroupAddIcon />}
                        onClick={handleAddStudent}
                        disabled={!newStudentName.trim() || loading}
                      >
                        Ajouter
                      </Button>
                    </Stack>

                    {selectedStudents.length > 0 && (
                      <Box mt={2}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          gutterBottom
                        >
                          Élèves ajoutés:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {selectedStudents.map((student) => (
                            <Chip
                              key={student.id}
                              label={student.nom}
                              onDelete={() => handleRemoveStudent(student.id)}
                              disabled={loading}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider" }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 1,
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Fermer
        </Button>
        {isRequestMode && !hasAccess && !hasPendingRequest && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={
              loading ||
              hasPendingRequest ||
              (classInfo?.accesMajeur && selectedStudents.length === 0) ||
              (!classInfo?.accesMajeur && selectedStudents.length === 0)
            }
            startIcon={
              loading ? <CircularProgress size={20} /> : <PersonAddIcon />
            }
            sx={{
              px: 3,
              py: 1,
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            {loading ? "Envoi en cours..." : "Demander l'accès"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ParentClassManagementModalUpdate;
