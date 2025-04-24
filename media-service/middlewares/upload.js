const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Configuration de stockage temporaire pour les fichiers uploadés
const storage = multer.memoryStorage();

// Filtrer les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(",");

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Type de fichier non autorisé. Types acceptés : ${allowedTypes.join(
          ", "
        )}`
      ),
      false
    );
  }
};

// Configuration de Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE), // Limite de taille définie dans .env
  },
  fileFilter: fileFilter,
});

// Fonction pour générer un nom de fichier unique
const generateFileName = (file) => {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${Date.now()}-${uuidv4()}${fileExtension}`;

  // Déterminer le dossier en fonction du type de média
  let folder = "";
  if (file.mimetype.startsWith("image/")) {
    folder = "images/";
  } else if (file.mimetype.startsWith("video/")) {
    folder = "videos/";
  } else {
    folder = "others/";
  }

  return `${folder}${fileName}`;
};

module.exports = {
  upload,
  generateFileName,
};
