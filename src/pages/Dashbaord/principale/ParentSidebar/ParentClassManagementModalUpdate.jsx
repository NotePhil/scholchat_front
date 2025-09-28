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
  InputAdornment,
  IconButton,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from "@mui/material";
import {
  School as SchoolIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  VpnKey as VpnKeyIcon,
  Info as InfoIcon,
  Class as ClassIcon,
  GroupAdd as GroupAddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import axios from "axios";

const ParentClassManagementModalUpdate = ({
  open,
  onClose,
  classe,
  hasAccess,
  parentId: propParentId,
  isRequestMode = false,
  activationCode: initialActivationCode = "",
}) => {
  const [activationCode, setActivationCode] = useState(initialActivationCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [newStudentName, setNewStudentName] = useState(""); // Changed to single field for mineur
  const [classInfo, setClassInfo] = useState(null);
  const [parentId, setParentId] = useState(propParentId);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const getUserIdFromToken = () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return null;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      return decoded.sub || decoded.userId || null;
    } catch (error) {
      return null;
    }
  };

  const getUserDataFromStorage = () => {
    try {
      const userData =
        localStorage.getItem("userData") || sessionStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.userId || parsed.id || null;
      }
      const userId =
        localStorage.getItem("userId") || sessionStorage.getItem("userId");
      if (userId) return userId;
      return getUserIdFromToken();
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (initialActivationCode) {
      setActivationCode(initialActivationCode);
    }
    if (open) {
      setError("");
      setHasPendingRequest(false);
      setClassInfo(null);
      setStudents([]);
      setSelectedStudents([]);
      setNewStudentName("");
      setSearchTerm("");
      setFilteredStudents([]);
    }
    let resolvedParentId = propParentId;
    if (
      !resolvedParentId ||
      resolvedParentId === null ||
      resolvedParentId === undefined
    ) {
      resolvedParentId = getUserDataFromStorage();
    }
    setParentId(resolvedParentId);
  }, [
    initialActivationCode,
    open,
    classe,
    propParentId,
    hasAccess,
    isRequestMode,
  ]);

  useEffect(() => {
    if (open && isRequestMode && activationCode && classe?.id) {
      fetchClassInfo();
    }
  }, [open, isRequestMode, activationCode, classe?.id]);

  useEffect(() => {
    if (students.length > 0) {
      const filtered = students.filter((student) => {
        const fullName = `${student.prenom || ""} ${student.nom}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [students, searchTerm]);

  const validateActivationCode = (code) => {
    return /^\d{6}$/.test(code);
  };

  const getAuthToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };

  const fetchClassInfo = async () => {
    if (!classe?.id) {
      setError("Classe information is missing");
      return;
    }
    if (!validateActivationCode(activationCode)) {
      setError("Le code d'activation doit contenir exactement 6 chiffres");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const authToken = getAuthToken();
      const config = {
        params: {
          token: activationCode,
          classId: classe.id,
        },
      };
      if (authToken) {
        config.headers = {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        };
      }
      const response = await axios.get(
        "http://localhost:8486/scholchat/parent-access/infos-classe",
        config
      );
      setClassInfo(response.data);

      // Set access type based on class info
      if (response.data.accesMajeur && response.data.elevesAssocies) {
        setStudents(response.data.elevesAssocies);
      }
      setSelectedStudents([]);
    } catch (err) {
      let errorMessage =
        "Erreur lors de la récupération des informations de la classe";
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage =
            err.response.data.message || "Code d'activation invalide";
        } else if (err.response.status === 401) {
          errorMessage = "Code d'activation invalide ou expiré";
        } else if (err.response.status === 404) {
          errorMessage = "Classe non trouvée";
        }
      }
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!classe?.id) {
      setError("Classe information is missing");
      return;
    }
    if (
      !parentId ||
      parentId === null ||
      parentId === undefined ||
      parentId === ""
    ) {
      const resolvedParentId = getUserDataFromStorage();
      if (resolvedParentId) {
        setParentId(resolvedParentId);
        setTimeout(() => handleSubmit(), 100);
        return;
      }
      setError(
        "Parent information is missing. Please ensure you are logged in properly."
      );
      return;
    }
    if (!activationCode.trim()) {
      setError("Veuillez entrer un code d'activation");
      return;
    }
    if (!validateActivationCode(activationCode)) {
      setError("Le code d'activation doit contenir exactement 6 chiffres");
      return;
    }
    if (selectedStudents.length === 0) {
      setError("Veuillez ajouter ou sélectionner au moins un élève");
      return;
    }
    if (!classInfo) {
      setError("Veuillez d'abord vérifier le code d'activation");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const requestData = {
        token: activationCode,
        classeId: classe.id,
        parentId: parentId,
      };

      if (classInfo.accesMajeur) {
        // For majeur access, use elevesIds
        requestData.elevesIds = selectedStudents.map((s) => s.id);
        if (selectedStudents.some((s) => s.email)) {
          requestData.elevesEmails = selectedStudents.map((s) => s.email || "");
        }
      } else {
        // For mineur access, use elevesNoms
        requestData.elevesNoms = selectedStudents.map((s) => s.nom);
      }

      const authToken = getAuthToken();
      const config = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
      if (authToken) {
        config.headers["Authorization"] = `Bearer ${authToken}`;
      }
      const response = await axios.post(
        "http://localhost:8486/scholchat/parent-access/demande",
        requestData,
        config
      );
      enqueueSnackbar("Demande d'accès envoyée avec succès", {
        variant: "success",
      });
      setHasPendingRequest(true);
      setSelectedStudents([]);
      setNewStudentName("");
      setSearchTerm("");
      onClose();
    } catch (err) {
      let errorMessage = "Une erreur est survenue";
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.message || "Données invalides";
        } else if (err.response.status === 409) {
          errorMessage =
            "Une demande d'accès est déjà en attente pour cette classe";
          setHasPendingRequest(true);
        } else if (err.response.status === 401) {
          errorMessage = "Code d'activation invalide ou expiré";
        } else if (err.response.status === 404) {
          errorMessage = "Classe ou parent non trouvé";
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
    const trimmedName = newStudentName.trim();

    if (!trimmedName) {
      setError("Veuillez entrer le nom de l'élève");
      return;
    }

    const existingStudent = selectedStudents.find(
      (s) => s.nom.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingStudent) {
      setError("Cet élève est déjà dans la liste");
      return;
    }

    const newStudent = {
      id: `temp-${Date.now()}-${Math.random()}`,
      nom: trimmedName,
      isNewStudent: true,
    };

    setSelectedStudents((prev) => [...prev, newStudent]);
    setNewStudentName("");
    setError("");
  };

  const handleRemoveStudent = (studentId) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleActivationCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setActivationCode(value);
    setError("");
    setClassInfo(null);
    setStudents([]);
    setSelectedStudents([]);
    setNewStudentName("");
    setSearchTerm("");
    setFilteredStudents([]);
  };

  const handleFetchClassInfo = () => {
    if (validateActivationCode(activationCode) && classe?.id) {
      fetchClassInfo();
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!classInfo?.accesMajeur) {
        handleAddStudent();
      }
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(5px)",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", py: 2 }}>
        <SchoolIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            {isRequestMode ? "Demande d'accès" : "Détails de la classe"}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {classe?.nom}
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
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
                    secondary={classe?.nom}
                    secondaryTypographyProps={{
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
                {classe?.niveau && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ClassIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Niveau"
                      secondary={classe.niveau}
                      secondaryTypographyProps={{
                        color: "text.primary",
                        fontWeight: 500,
                      }}
                    />
                  </ListItem>
                )}
                {classInfo && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Type d'accès"
                      secondary={classInfo.accesMajeur ? "Majeur" : "Mineur"}
                      secondaryTypographyProps={{
                        color: "text.primary",
                        fontWeight: 500,
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
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
                    secondary={classe?.etablissement?.nom || "Non spécifié"}
                    secondaryTypographyProps={{
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {(classe?.moderator || classInfo?.moderateurNom) && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
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
                    {(
                      classInfo?.moderateurNom || classe?.moderator?.nom
                    )?.charAt(0)}
                    {(
                      classInfo?.moderateurPrenom || classe?.moderator?.prenom
                    )?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {classInfo?.moderateurPrenom || classe?.moderator?.prenom}{" "}
                      {classInfo?.moderateurNom || classe?.moderator?.nom}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>

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

            <DialogContentText sx={{ mb: 3 }}>
              Pour demander l'accès à cette classe, veuillez entrer le code
              d'activation à 6 chiffres fourni par l'établissement ou le
              modérateur.
            </DialogContentText>

            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <TextField
                autoFocus
                margin="dense"
                label="Code d'activation (6 chiffres)"
                type="text"
                fullWidth
                variant="outlined"
                value={activationCode}
                onChange={handleActivationCodeChange}
                placeholder="Entrez 6 chiffres"
                disabled={hasPendingRequest || loading}
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  maxLength: 6,
                }}
              />
              <Button
                variant="contained"
                onClick={handleFetchClassInfo}
                disabled={
                  !validateActivationCode(activationCode) ||
                  loading ||
                  hasPendingRequest
                }
                startIcon={
                  loading ? <CircularProgress size={20} /> : <VpnKeyIcon />
                }
                sx={{ minWidth: 120 }}
              >
                {loading ? "Vérification..." : "Vérifier"}
              </Button>
            </Stack>

            {classInfo && (
              <Box mt={3}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <InfoIcon sx={{ mr: 1, color: "primary.main" }} />
                  Type d'accès: {classInfo.accesMajeur ? "Majeur" : "Mineur"}
                </Typography>
                <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
                  {classInfo.accesMajeur
                    ? "Pour les classes avec accès majeur, sélectionnez les élèves existants qui vous concernent."
                    : "Pour les classes avec accès mineur, ajoutez les noms des nouveaux élèves."}
                </DialogContentText>

                {classInfo.accesMajeur ? (
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <GroupsIcon sx={{ mr: 1, color: "primary.main" }} />
                      Rechercher et sélectionner les élèves
                    </Typography>
                    <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
                      Recherchez les élèves existants dans cette classe et
                      sélectionnez ceux qui vous concernent.
                    </DialogContentText>

                    <TextField
                      fullWidth
                      placeholder="Rechercher un élève par nom..."
                      variant="outlined"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                          <InputAdornment position="end">
                            <IconButton onClick={clearSearch} size="small">
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {searchTerm && filteredStudents.length > 0 ? (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 2,
                          maxHeight: 300,
                          overflow: "auto",
                          mb: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.7)",
                        }}
                      >
                        <FormGroup>
                          {filteredStudents.map((student) => (
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
                              label={
                                <Typography variant="body2" fontWeight={500}>
                                  {`${student.prenom || ""} ${
                                    student.nom
                                  }`.trim()}
                                  {student.email && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      color="text.secondary"
                                    >
                                      {student.email}
                                    </Typography>
                                  )}
                                </Typography>
                              }
                            />
                          ))}
                        </FormGroup>
                      </Paper>
                    ) : searchTerm ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Aucun élève trouvé correspondant à "{searchTerm}"
                      </Alert>
                    ) : (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Entrez un nom dans le champ de recherche pour trouver
                        des élèves
                      </Alert>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <GroupAddIcon sx={{ mr: 1, color: "primary.main" }} />
                      Ajouter les élèves concernés
                    </Typography>
                    <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
                      Pour les classes avec accès mineur, ajoutez manuellement
                      les noms des élèves.
                    </DialogContentText>
                    <Stack direction="row" spacing={2} mb={2}>
                      <TextField
                        fullWidth
                        label="Nom de l'élève"
                        variant="outlined"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="Nom complet de l'élève"
                        disabled={loading}
                        required
                        onKeyPress={handleKeyPress}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handleAddStudent}
                                disabled={!newStudentName.trim() || loading}
                                edge="end"
                              >
                                <PersonAddIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Stack>
                  </Box>
                )}

                {selectedStudents.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="body2" fontWeight={500} gutterBottom>
                      {classInfo.accesMajeur
                        ? "Élèves sélectionnés"
                        : "Élèves à ajouter"}
                      : ({selectedStudents.length})
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedStudents.map((student) => (
                        <Chip
                          key={student.id}
                          label={
                            classInfo.accesMajeur
                              ? `${student.prenom || ""} ${student.nom}`.trim()
                              : student.nom
                          }
                          onDelete={() => handleRemoveStudent(student.id)}
                          disabled={loading}
                          color={student.isNewStudent ? "secondary" : "primary"}
                          variant={student.isNewStudent ? "outlined" : "filled"}
                          sx={{
                            fontWeight: 500,
                            "& .MuiChip-deleteIcon": {
                              fontSize: "18px",
                            },
                          }}
                        />
                      ))}
                    </Box>
                    <Alert
                      severity="info"
                      sx={{ mt: 2, borderRadius: 2 }}
                      icon={<InfoIcon />}
                    >
                      <Typography variant="body2">
                        {classInfo.accesMajeur ? (
                          <>
                            <strong>{selectedStudents.length}</strong> élève(s)
                            sélectionné(s) parmi les élèves existants de la
                            classe.
                          </>
                        ) : (
                          <>
                            <strong>{selectedStudents.length}</strong> nouvel(s)
                            élève(s) sera/seront créé(s) et ajouté(s) à la
                            classe.
                          </>
                        )}
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </Box>
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
        {isRequestMode && !hasAccess && !hasPendingRequest && classInfo && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={
              loading || hasPendingRequest || selectedStudents.length === 0
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
