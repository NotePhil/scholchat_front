const jwt = require("jsonwebtoken");

// Middleware d'authentification simple
// Note: À adapter selon votre système d'authentification existant
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        message: "Authentification requise",
      });
    }

    // Format du header : Bearer <token>
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Token manquant",
      });
    }

    // Vérification simple avec une clé secrète (à remplacer par votre système)
    // Dans un environnement réel, vous utiliseriez votre système d'authentification existant
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-temporary-secret"
    );

    // Ajouter les informations utilisateur à l'objet request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Token invalide ou expiré",
    });
  }
};

// Middleware de vérification des permissions (exemple)
const hasPermission = (requiredPermission) => {
  return (req, res, next) => {
    // Si l'authentification n'est pas activée ou si la permission n'est pas requise
    if (!req.user || !requiredPermission) {
      return next();
    }

    // Vérifier si l'utilisateur a la permission requise
    if (
      req.user.permissions &&
      req.user.permissions.includes(requiredPermission)
    ) {
      return next();
    }

    return res.status(403).json({
      status: "error",
      message: "Permission refusée",
    });
  };
};

module.exports = {
  authenticate,
  hasPermission,
};
