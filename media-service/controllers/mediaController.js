const { minioClient } = require("../config/minio");
const { generateFileName } = require("../middlewares/upload");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

// Télécharger un média (image ou vidéo)
const uploadMedia = async (req, res, next) => {
  try {
    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "error", errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Aucun fichier n'a été téléchargé",
      });
    }

    // Générer un nom de fichier unique
    const objectName = generateFileName(req.file);

    // Métadonnées du fichier
    const metaData = {
      "Content-Type": req.file.mimetype,
      "X-Amz-Meta-Original-Name": req.file.originalname,
      "X-Amz-Meta-User-Id": req.user?.id || "anonymous",
      "X-Amz-Meta-Upload-Date": new Date().toISOString(),
    };

    // Ajouter des métadonnées supplémentaires si fournies
    if (req.body.metadata) {
      try {
        const customMetadata = JSON.parse(req.body.metadata);
        Object.keys(customMetadata).forEach((key) => {
          metaData[`X-Amz-Meta-${key}`] = customMetadata[key];
        });
      } catch (e) {
        console.warn("Invalid metadata format", e);
      }
    }

    // Télécharger le fichier vers MinIO
    await minioClient.putObject(
      process.env.MINIO_BUCKET,
      objectName,
      req.file.buffer,
      req.file.size,
      metaData
    );

    // Générer une URL présignée pour accéder au fichier
    const presignedUrl = await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET,
      objectName,
      parseInt(process.env.PRESIGNED_URL_EXPIRY)
    );

    // Construction de l'URL directe (nécessite que le bucket soit public)
    const directUrl = `${
      process.env.MINIO_USE_SSL === "true" ? "https" : "http"
    }://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${
      process.env.MINIO_BUCKET
    }/${objectName}`;

    res.status(200).json({
      status: "success",
      message: "Fichier téléchargé avec succès",
      data: {
        fileId: uuidv4(), // ID unique pour référencer ce fichier
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        objectName: objectName,
        presignedUrl: presignedUrl,
        directUrl: directUrl, // URL directe si le bucket est public
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir une URL présignée pour un média existant
const getPresignedUrl = async (req, res, next) => {
  try {
    const { objectName } = req.params;

    if (!objectName) {
      return res.status(400).json({
        status: "error",
        message: "Le nom de l'objet est requis",
      });
    }

    // Vérifier si l'objet existe
    try {
      await minioClient.statObject(process.env.MINIO_BUCKET, objectName);
    } catch (err) {
      return res.status(404).json({
        status: "error",
        message: "Le fichier demandé n'existe pas",
      });
    }

    // Générer l'URL présignée
    const presignedUrl = await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET,
      objectName,
      parseInt(process.env.PRESIGNED_URL_EXPIRY)
    );

    res.status(200).json({
      status: "success",
      data: {
        objectName: objectName,
        presignedUrl: presignedUrl,
        expiresIn: `${process.env.PRESIGNED_URL_EXPIRY} secondes`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Générer une URL présignée pour télécharger un fichier directement vers MinIO
const generatePresignedPutUrl = async (req, res, next) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        status: "error",
        message: "Le nom et le type de fichier sont requis",
      });
    }

    // Déterminer le dossier en fonction du type de média
    let folder = "";
    if (fileType.startsWith("image/")) {
      folder = "images/";
    } else if (fileType.startsWith("video/")) {
      folder = "videos/";
    } else {
      folder = "others/";
    }

    // Générer un nom d'objet unique
    const objectName = `${folder}${Date.now()}-${uuidv4()}-${fileName.replace(
      /\s+/g,
      "_"
    )}`;

    // Métadonnées du fichier
    const metaData = {
      "Content-Type": fileType,
      "X-Amz-Meta-Original-Name": fileName,
      "X-Amz-Meta-User-Id": req.user?.id || "anonymous",
      "X-Amz-Meta-Upload-Date": new Date().toISOString(),
    };

    // Ajouter des métadonnées supplémentaires si fournies
    if (req.body.metadata) {
      try {
        const customMetadata = JSON.parse(req.body.metadata);
        Object.keys(customMetadata).forEach((key) => {
          metaData[`X-Amz-Meta-${key}`] = customMetadata[key];
        });
      } catch (e) {
        console.warn("Invalid metadata format", e);
      }
    }

    // Générer une URL présignée pour PUT (téléchargement direct par le client)
    const presignedPutUrl = await minioClient.presignedPutObject(
      process.env.MINIO_BUCKET,
      objectName,
      parseInt(process.env.PRESIGNED_URL_EXPIRY)
    );

    res.status(200).json({
      status: "success",
      data: {
        presignedPutUrl: presignedPutUrl,
        objectName: objectName,
        expiresIn: `${process.env.PRESIGNED_URL_EXPIRY} secondes`,
        // Informations pour le client sur comment utiliser l'URL
        instructions:
          "Utilisez cette URL avec une requête PUT et le contenu binaire du fichier",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer un média
const deleteMedia = async (req, res, next) => {
  try {
    const { objectName } = req.params;

    if (!objectName) {
      return res.status(400).json({
        status: "error",
        message: "Le nom de l'objet est requis",
      });
    }

    // Vérifier si l'objet existe
    try {
      await minioClient.statObject(process.env.MINIO_BUCKET, objectName);
    } catch (err) {
      return res.status(404).json({
        status: "error",
        message: "Le fichier demandé n'existe pas",
      });
    }

    // Supprimer l'objet
    await minioClient.removeObject(process.env.MINIO_BUCKET, objectName);

    res.status(200).json({
      status: "success",
      message: "Fichier supprimé avec succès",
      data: {
        objectName: objectName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir les métadonnées d'un média
const getMediaMetadata = async (req, res, next) => {
  try {
    const { objectName } = req.params;

    if (!objectName) {
      return res.status(400).json({
        status: "error",
        message: "Le nom de l'objet est requis",
      });
    }

    // Récupérer les métadonnées de l'objet
    try {
      const stat = await minioClient.statObject(
        process.env.MINIO_BUCKET,
        objectName
      );

      // Extraire les métadonnées personnalisées
      const customMetadata = {};
      Object.keys(stat.metaData).forEach((key) => {
        if (key.startsWith("x-amz-meta-")) {
          const metaKey = key.replace("x-amz-meta-", "");
          customMetadata[metaKey] = stat.metaData[key];
        }
      });

      res.status(200).json({
        status: "success",
        data: {
          objectName: objectName,
          size: stat.size,
          lastModified: stat.lastModified,
          contentType: stat.metaData["content-type"],
          etag: stat.etag,
          metadata: customMetadata,
        },
      });
    } catch (err) {
      return res.status(404).json({
        status: "error",
        message: "Le fichier demandé n'existe pas",
      });
    }
  } catch (error) {
    next(error);
  }
};

// Lister tous les médias
const listMedia = async (req, res, next) => {
  try {
    const { prefix = "", recursive = true } = req.query;

    const mediaList = [];
    const objectsStream = minioClient.listObjects(
      process.env.MINIO_BUCKET,
      prefix,
      recursive
    );

    objectsStream.on("data", (obj) => {
      // Ne pas inclure les dossiers
      if (!obj.name.endsWith("/")) {
        mediaList.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
        });
      }
    });

    objectsStream.on("error", (err) => {
      next(err);
    });

    objectsStream.on("end", () => {
      res.status(200).json({
        status: "success",
        data: {
          count: mediaList.length,
          media: mediaList,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMedia,
  getPresignedUrl,
  generatePresignedPutUrl,
  deleteMedia,
  getMediaMetadata,
  listMedia,
};
