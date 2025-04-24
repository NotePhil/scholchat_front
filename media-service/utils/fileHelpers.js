const path = require("path");
const fs = require("fs");

// Convertir le buffer en base64
const bufferToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

// Déterminer le type de média à partir du mimetype
const getMediaType = (mimetype) => {
  if (mimetype.startsWith("image/")) {
    return "image";
  } else if (mimetype.startsWith("video/")) {
    return "video";
  } else if (mimetype.startsWith("audio/")) {
    return "audio";
  } else {
    return "document";
  }
};

// Créer les dossiers nécessaires s'ils n'existent pas
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Extraire l'extension du nom de fichier
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Vérifier si le type de fichier est autorisé
const isFileTypeAllowed = (mimetype) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(",");
  return allowedTypes.includes(mimetype);
};

// Formater la taille du fichier pour l'affichage
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB";
  else return (bytes / 1073741824).toFixed(2) + " GB";
};

module.exports = {
  bufferToBase64,
  getMediaType,
  ensureDirectoryExists,
  getFileExtension,
  isFileTypeAllowed,
  formatFileSize,
};
