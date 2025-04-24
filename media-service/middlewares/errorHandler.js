// Middleware de gestion des erreurs centralisé
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Erreurs Multer (téléchargement de fichiers)
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: `La taille du fichier dépasse la limite autorisée (${
          process.env.MAX_FILE_SIZE / (1024 * 1024)
        } MB)`,
      });
    }
    return res.status(400).json({
      status: "error",
      message: `Erreur lors du téléchargement: ${err.message}`,
    });
  }

  // Erreurs de validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: err.message,
      errors: err.errors,
    });
  }

  // Erreurs S3/MinIO
  if (err.code && (err.code.startsWith("S3") || err.code.startsWith("Minio"))) {
    return res.status(500).json({
      status: "error",
      message: `Erreur de stockage: ${err.message}`,
    });
  }

  // Erreur générique par défaut
  return res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Une erreur est survenue",
  });
};

module.exports = errorHandler;
