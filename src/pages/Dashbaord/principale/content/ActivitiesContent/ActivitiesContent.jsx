import React, { useState, useEffect } from "react";
import {
  Plus,
  Filter,
  Loader2,
  AlertCircle,
  Zap,
  Users,
  Calendar,
  MessageSquare,
} from "lucide-react";
import ActivityDisplay from "./ActivityDisplay";
import CreateEventModal from "./CreateEventModal";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import { minioS3Service } from "../../../../../services/minioS3";

const ActivitiesContent = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [userRoles, setUserRoles] = useState([]);

  const filters = [
    {
      id: "all",
      label: "Tous",
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: "events",
      label: "Événements",
      icon: Calendar,
      color: "bg-purple-100 text-purple-700",
    },
    {
      id: "posts",
      label: "Publications",
      icon: MessageSquare,
      color: "bg-green-100 text-green-700",
    },
    {
      id: "popular",
      label: "Populaires",
      icon: Zap,
      color: "bg-orange-100 text-orange-700",
    },
    {
      id: "recent",
      label: "Récents",
      icon: Filter,
      color: "bg-pink-100 text-pink-700",
    },
  ];

  useEffect(() => {
    loadActivities();
    const user = activityFeedService.getCurrentUser();
    setCurrentUser(user);

    // Get user role information (adjust according to your user data structure)
    if (user) {
      setUserRole(user.role || "");
      setUserRoles(user.roles || []);
    }
  }, []);

  useEffect(() => {
    applyFilter(activeFilter);
  }, [activities, activeFilter]);

  // Check if user can create activities (admin or professor only)
  const canCreateActivity = () => {
    const allowedRoles = [
      "ROLE_ADMIN",
      "ROLE_PROFESSOR",
      "admin",
      "professor",
      "professeur", // Adding French version
    ];

    // Check single role
    if (userRole && allowedRoles.includes(userRole.toLowerCase())) {
      return true;
    }

    // Check multiple roles array
    if (userRoles && userRoles.length > 0) {
      return userRoles.some((role) =>
        allowedRoles.includes(role.toLowerCase())
      );
    }

    return false;
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await activityFeedService.getActivities();
      setActivities(data);
    } catch (err) {
      console.error("Erreur lors du chargement des activités:", err);
      setError("Impossible de charger les activités");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (filter) => {
    const filtered = activityFeedService.applyFilter(activities, filter);
    setFilteredActivities(filtered);
    setActiveFilter(filter);
  };

  const handleCreateEvent = async (eventData) => {
    try {
      setLoading(true);
      await activityFeedService.createEvent(eventData);
      setSuccess("Événement créé avec succès !");
      setShowCreateModal(false);
      await loadActivities();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur lors de la création de l'événement:", err);
      setError("Impossible de créer l'événement: " + err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (activityId, reactionType) => {
    try {
      const result = await activityFeedService.addReaction(
        activityId,
        reactionType
      );

      // Mettre à jour l'activité localement
      setActivities((prev) =>
        prev.map((activity) => {
          if (activity.id === activityId) {
            return {
              ...activity,
              isLiked: result,
              likes: result
                ? activity.likes + 1
                : Math.max(0, activity.likes - 1),
            };
          }
          return activity;
        })
      );
    } catch (err) {
      console.error("Erreur lors de la réaction:", err);
      setError("Impossible d'ajouter la réaction");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleComment = async (activityId, comment) => {
    try {
      const newComment = await activityFeedService.commentOnActivity(
        activityId,
        comment
      );

      // Mettre à jour les commentaires localement
      setActivities((prev) =>
        prev.map((activity) => {
          if (activity.id === activityId) {
            return {
              ...activity,
              comments: [...(activity.comments || []), newComment],
            };
          }
          return activity;
        })
      );
    } catch (err) {
      console.error("Erreur lors du commentaire:", err);
      setError("Impossible d'ajouter le commentaire");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleShare = async (activityId) => {
    try {
      await activityFeedService.shareActivity(activityId);

      // Mettre à jour le compteur de partages localement
      setActivities((prev) =>
        prev.map((activity) => {
          if (activity.id === activityId) {
            return {
              ...activity,
              shares: activity.shares + 1,
              isShared: true,
            };
          }
          return activity;
        })
      );

      setSuccess("Activité partagée !");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("Erreur lors du partage:", err);
      setError("Impossible de partager l'activité");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await activityFeedService.joinEvent(eventId);

      // Mettre à jour l'événement localement
      setActivities((prev) =>
        prev.map((activity) => {
          if (activity.id === eventId && activity.eventDetails) {
            return {
              ...activity,
              eventDetails: {
                ...activity.eventDetails,
                participantsCount: activity.eventDetails.participantsCount + 1,
              },
            };
          }
          return activity;
        })
      );

      setSuccess("Vous avez rejoint l'événement !");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("Erreur lors de l'adhésion:", err);
      setError("Impossible de rejoindre l'événement");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="animate-spin text-blue-600 mx-auto mb-4"
            size={48}
          />
          <p className="text-gray-600">Chargement des activités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Messages de notification */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span>{success}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Fil d'activité
              </h1>
              <p className="text-gray-600">
                Découvrez les dernières activités et événements
              </p>
            </div>
            {/* Only show create button for admin and professor roles */}
            {canCreateActivity() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
              >
                <Plus size={20} />
                <span>Créer un événement</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => applyFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                    activeFilter === filter.id
                      ? filter.color + " shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon size={16} />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone de création rapide - Only show for authorized users */}
        {canCreateActivity() && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowCreateModal(true)}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 text-gray-500">
                Que souhaitez-vous partager aujourd'hui ?
              </div>
            </div>
          </div>
        )}

        {/* Liste des activités */}
        <div className="space-y-6">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <ActivityDisplay
                key={activity.id}
                activity={activity}
                onReaction={handleReaction}
                onComment={handleComment}
                onShare={handleShare}
                onJoinEvent={handleJoinEvent}
                currentUser={currentUser}
              />
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Users size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucune activité trouvée
              </h3>
              <p className="text-gray-500 mb-6">
                {activeFilter === "all"
                  ? "Il n'y a pas encore d'activités."
                  : `Aucune activité ne correspond au filtre "${
                      filters.find((f) => f.id === activeFilter)?.label
                    }".`}
              </p>
              {/* Only show create button for authorized users in empty state */}
              {activeFilter === "all" && canCreateActivity() && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto transition-all duration-200"
                >
                  <Plus size={20} />
                  Créer un événement
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chargement supplémentaire */}
        {loading && activities.length > 0 && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
          </div>
        )}
      </div>

      {/* Modal de création d'événement - Only render if user can create */}
      {canCreateActivity() && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ActivitiesContent;
