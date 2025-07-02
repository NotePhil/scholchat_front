import React, { useState } from "react";
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
} from "@mui/material";
import {
  School as SchoolIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  DateRange as DateRangeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PersonAdd as PersonAddIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";

const ParentClassManagementModal = ({
  open,
  onClose,
  classe,
  hasAccess,
  onRequestAccess,
  isRequestMode = false,
}) => {
  const [activationCode, setActivationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!activationCode.trim()) {
      setError("Veuillez entrer un code d'activation");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const success = await onRequestAccess(classe, activationCode);

      if (success) {
        // Create the access request object
        const accessRequest = {
          utilisateur_id: localStorage.getItem("userId"),
          classe_id: classe.id,
          code_activation: activationCode,
          etat: "EN_ATTENTE",
          date_demande: new Date().toISOString(),
        };

        // Save to local storage
        const existingRequests = JSON.parse(
          localStorage.getItem("accessRequests") || "[]"
        );
        const updatedRequests = [...existingRequests, accessRequest];
        localStorage.setItem("accessRequests", JSON.stringify(updatedRequests));

        console.log("Access request saved to local storage:", accessRequest);
        console.log("All access requests in local storage:", updatedRequests);

        onClose();
      }
    } catch (err) {
      console.error("Error submitting access request:", err);
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
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
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SchoolIcon color="primary" />
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
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <DateRangeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Date de création"
                    secondary={new Date(
                      classe.dateCreation
                    ).toLocaleDateString()}
                    secondaryTypographyProps={{
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <GroupsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Nombre d'élèves"
                    secondary={classe.eleves?.length || 0}
                    secondaryTypographyProps={{
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
                {hasAccess && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <VpnKeyIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Code d'activation"
                      secondary={classe.codeActivation}
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
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <HomeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Localisation"
                    secondary={
                      classe.etablissement
                        ? `${classe.etablissement.localisation}, ${classe.etablissement.pays}`
                        : "Non spécifié"
                    }
                    secondaryTypographyProps={{
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={classe.etablissement?.email || "Non spécifié"}
                    secondaryTypographyProps={{
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Téléphone"
                    secondary={
                      classe.etablissement?.telephone || "Non spécifié"
                    }
                    secondaryTypographyProps={{
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  />
                </ListItem>
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
                  Modérateur
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
                    <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
                      <EmailIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {classe.moderator.email}
                      </Typography>
                    </Box>
                    {classe.moderator.telephone && (
                      <Box display="flex" alignItems="center">
                        <PhoneIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {classe.moderator.telephone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Access Request Section - Only shown in request mode */}
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
              d'activation fourni par l'établissement ou le modérateur.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Code d'activation"
              type="text"
              fullWidth
              variant="outlined"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              error={!!error}
              helperText={error}
              placeholder="Entrez le code d'activation"
              sx={{ mb: 2 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider" }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
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
        {isRequestMode && !hasAccess && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
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

export default ParentClassManagementModal;
