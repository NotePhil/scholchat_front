// Formater la réponse API
const formatResponse = (success = true, message = "", data = null) => {
  return {
    status: success ? "success" : "error",
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

// Créer une réponse d'erreur
const errorResponse = (
  message = "Une erreur est survenue",
  statusCode = 500,
  errors = null
) => {
  return {
    status: "error",
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
};

// Créer une réponse de succès
const successResponse = (message = "Opération réussie", data = null) => {
  return {
    status: "success",
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  formatResponse,
  errorResponse,
  successResponse,
};
