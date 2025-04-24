const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");
const { initBucket } = require("./config/minio");
const mediaRoutes = require("./routes/mediaRoutes");
const errorHandler = require("./middlewares/errorHandler");

// Charger les variables d'environnement
dotenv.config();

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet()); // Sécurité
app.use(cors()); // Gestion des CORS
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true })); // Parser URL-encoded
app.use(morgan("dev")); // Logs

// Route de base
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "API de gestion des médias opérationnelle",
    documentation: "Consultez /api-docs pour la documentation",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Routes pour les médias
app.use("/api/media", mediaRoutes);

// Route pour vérifier l'état de santé
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Service opérationnel",
    time: new Date().toISOString(),
  });
});

// 404 - Route non trouvée
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: `Route non trouvée: ${req.originalUrl}`,
  });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Initialiser le bucket MinIO avant de démarrer le serveur
initBucket()
  .then(() => {
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`URL du serveur: http://localhost:${PORT}`);
      console.log(`Mode: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error("Erreur lors de l'initialisation du bucket:", err);
    process.exit(1);
  });

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
