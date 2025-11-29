import React, { useEffect } from "react";
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
import SimpleActivityDisplay from "./SimpleActivityDisplay";
import CreateEventContent from "./CreateEventContent";
import { useActivities } from "../../../../../hooks/useActivities";

const ActivitiesContent = () => {
  const {
    filteredActivities,
    loading,
    error,
    success,
    activeFilter,
    showCreateForm,
    currentUser,
    loadActivities,
    handleCreateEvent,
    handleReaction,
    handleComment,
    handleShare,
    handleJoinEvent,
    handleFilterChange,
    handleShowCreateForm,
    handleClearError,
    handleClearSuccess,
    canCreateActivity,
  } = useActivities();

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
  }, [loadActivities]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => handleClearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, handleClearError]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => handleClearSuccess(), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, handleClearSuccess]);

  const onCreateEvent = async (eventData) => {
    try {
      await handleCreateEvent(eventData);
      handleShowCreateForm(false);
    } catch (err) {
      console.error("Erreur lors de la création:", err);
    }
  };

  if (loading && filteredActivities.length === 0) {
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
      {showCreateForm && canCreateActivity ? (
        <CreateEventContent
          onClose={() => handleShowCreateForm(false)}
          onSubmit={onCreateEvent}
          loading={loading}
        />
      ) : (
        <>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Fil d'activité
                  </h1>
                  <p className="text-gray-600">
                    Découvrez les dernières activités et événements
                  </p>
                </div>
                {canCreateActivity && (
                  <button
                    onClick={() => handleShowCreateForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Plus size={20} />
                    <span>Créer une activité</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterChange(filter.id)}
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

            {filteredActivities.length > 0 ? (
              <div className="space-y-6">
                {filteredActivities.map((activity) => (
                  <SimpleActivityDisplay
                    key={activity.id}
                    activity={activity}
                    onReaction={handleReaction}
                    onComment={handleComment}
                    onShare={handleShare}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Users size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Aucune activité trouvée
                </h3>
                <p className="text-gray-500">
                  Aucune activité ne correspond aux filtres sélectionnés.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ActivitiesContent;