const express = require("express");
const { body, param } = require("express-validator");
const { upload } = require("../middlewares/upload");
const { authenticate, hasPermission } = require("../middlewares/auth");
const {
  uploadMedia,
  getPresignedUrl,
  generatePresignedPutUrl,
  deleteMedia,
  getMediaMetadata,
  listMedia,
} = require("../controllers/mediaController");

const router = express.Router();

// Route pour télécharger un média
router.post(
  "/upload",
  authenticate, // Authentification requise
  upload.single("file"), // Middleware Multer pour gérer le fichier
  [
    body("metadata")
      .optional()
      .isString()
      .withMessage("Les métadonnées doivent être une chaîne JSON valide"),
  ],
  uploadMedia
);

// Route pour générer une URL présignée pour le téléchargement direct (client vers S3)
router.post(
  "/presigned-upload",
  authenticate,
  [
    body("fileName").notEmpty().withMessage("Le nom du fichier est requis"),
    body("fileType")
      .notEmpty()
      .withMessage("Le type de fichier est requis")
      .custom((value) => {
        const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(",");
        if (!allowedTypes.includes(value)) {
          throw new Error(
            `Type de fichier non autorisé. Types acceptés : ${allowedTypes.join(
              ", "
            )}`
          );
        }
        return true;
      }),
    body("metadata")
      .optional()
      .isString()
      .withMessage("Les métadonnées doivent être une chaîne JSON valide"),
  ],
  generatePresignedPutUrl
);

// Route pour obtenir une URL présignée pour accéder à un média
router.get(
  "/presigned-url/:objectName",
  authenticate,
  [param("objectName").notEmpty().withMessage("Le nom de l'objet est requis")],
  getPresignedUrl
);

// Route pour obtenir les métadonnées d'un média
router.get(
  "/metadata/:objectName",
  authenticate,
  [param("objectName").notEmpty().withMessage("Le nom de l'objet est requis")],
  getMediaMetadata
);

// Route pour lister tous les médias
router.get("/list", authenticate, listMedia);

// Route pour supprimer un média
router.delete(
  "/:objectName",
  authenticate,
  hasPermission("delete:media"), // Permission spécifique requise
  [param("objectName").notEmpty().withMessage("Le nom de l'objet est requis")],
  deleteMedia
);

module.exports = router;
