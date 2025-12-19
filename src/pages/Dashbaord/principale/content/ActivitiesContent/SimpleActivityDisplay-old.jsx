import React from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Users,
  Calendar,
  Image,
} from "lucide-react";

const SimpleActivityDisplay = ({
  activity,
  onReaction,
  onComment,
  onShare,
  currentUser,
}) => {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Il y a quelques instants";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return "À l'instant";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {activity.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {activity.user?.name || "Utilisateur"}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="capitalize">{activity.user?.role || "user"}</span>
                  <span>•</span>
                  <span>{formatTimestamp(activity.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-800 leading-relaxed">
                {activity.content}
              </p>

              {activity.type === "event" && activity.eventDetails && (
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {activity.eventDetails.title}
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                        {activity.eventDetails.startTime && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>
                              {new Date(activity.eventDetails.startTime).toLocaleString("fr-FR")}
                            </span>
                          </div>
                        )}
                        
                        {activity.eventDetails.participantsCount !== undefined && (
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span>
                              {activity.eventDetails.participantsCount} participant(s)
                            </span>
                          </div>
                        )}
                      </div>

                      {activity.eventDetails.description && (
                        <p className="mt-3 text-gray-700 text-sm">
                          {activity.eventDetails.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {activity.media && activity.media.length > 0 && (
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600">
              <Image size={20} />
              <span className="text-sm">
                {activity.media.length} fichier{activity.media.length > 1 ? 's' : ''} joint{activity.media.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onReaction?.(activity.id, "like")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activity.isLiked
                ? "text-red-600 bg-red-50 hover:bg-red-100"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Heart size={18} className={activity.isLiked ? "fill-current" : ""} />
            <span>J'aime</span>
            {activity.likes > 0 && <span>({activity.likes})</span>}
          </button>

          <button
            onClick={() => onComment?.(activity.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle size={18} />
            <span>Commenter</span>
          </button>

          <button
            onClick={() => onShare?.(activity.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Share2 size={18} />
            <span>Partager</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleActivityDisplay;