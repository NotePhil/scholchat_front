import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Heart,
  MessageCircle,
  Share2,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Upload,
  Image,
  Trash2,
  Loader2,
} from "lucide-react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import { minioS3Service } from "../../../../../services/minioS3";

const ActivitiesContent = () => {
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [staticActivities] = useState([]);
  const [likingActivities, setLikingActivities] = useState({});
  const [localLikes, setLocalLikes] = useState({}); // Track likes locally
  const [localComments, setLocalComments] = useState({}); // Track comments locally
  const [likedByUsers, setLikedByUsers] = useState({}); // Track who liked each post

  useEffect(() => {
    loadEvents();
  }, []);

  const getImageUrl = async (media) => {
    try {
      console.log('Getting image URL for media:', media);
      console.log('Media ID:', media.id);
      
      if (!media.id) {
        console.error('No ID in media:', media);
        return null;
      }
      
      // Use the same method as UserViewModal - by media ID
      const downloadData = await minioS3Service.generateDownloadUrl(media.id);
      console.log('Download data received:', downloadData);
      console.log('Final image URL:', downloadData.downloadUrl);
      return downloadData.downloadUrl;
    } catch (error) {
      console.error('Failed to get image URL for media:', media, 'Error:', error);
      return null;
    }
  };

  const loadEvents = async () => {
    try {
      setLoadingActivities(true);
      console.log('Loading activities...');
      const activities = await activityFeedService.getActivities();
      console.log('Received activities:', activities);
      
      // Process activities to add image URLs
      const activitiesWithImages = await Promise.all(
        activities.map(async (activity) => {
          console.log('=== PROCESSING ACTIVITY ===');
          console.log('Activity ID:', activity.id);
          console.log('Activity type:', activity.type);
          console.log('Activity media:', activity.media);
          console.log('Media length:', activity.media?.length);
          
          const images = [];
          
          if (activity.media && activity.media.length > 0) {
            console.log('Activity has media, processing...');
            
            const imageUrls = await Promise.all(
              activity.media
                .filter(media => {
                  console.log('Filtering media:', media.mediaType, media.id);
                  return media.mediaType === 'IMAGE' && media.id;
                })
                .map(async (media) => {
                  console.log('Getting URL for media ID:', media.id);
                  const imageUrl = await getImageUrl(media);
                  console.log('Received image URL:', imageUrl);
                  return imageUrl;
                })
            );
            
            const validUrls = imageUrls.filter(url => url !== null);
            console.log('Valid image URLs:', validUrls);
            images.push(...validUrls);
          } else {
            console.log('No media found for activity:', activity.id);
          }
          
          console.log('Final images for activity:', activity.id, ':', images);
          console.log('==============================');
          
          return {
            ...activity,
            images,
            // Ensure required properties exist
            participants: activity.eventDetails?.participantsCount || 0,
            isParticipating: false,
            showComments: false,
            // Merge with local state
            isLiked: localLikes[activity.id] ?? activity.isLiked ?? false,
            comments: [...(activity.comments || []), ...(localComments[activity.id] || [])],
            likedBy: likedByUsers[activity.id] || []
          };
        })
      );
      
      console.log('Final activities with images:', activitiesWithImages);
      setActivities(activitiesWithImages);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const [newComment, setNewComment] = useState({});
  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    lieu: "",
    etat: "PLANIFIE",
    heureDebut: "",
    heureFin: "",
    createurId: localStorage.getItem("userId") || "user-id-123",
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const openImagePreview = (images, index) => {
    setImagePreview({ isOpen: true, images, currentIndex: index });
  };

  const closeImagePreview = () => {
    setImagePreview({ isOpen: false, images: [], currentIndex: 0 });
  };

  const navigateImage = (direction) => {
    const newIndex =
      direction === "next"
        ? (imagePreview.currentIndex + 1) % imagePreview.images.length
        : (imagePreview.currentIndex - 1 + imagePreview.images.length) %
          imagePreview.images.length;
    setImagePreview((prev) => ({ ...prev, currentIndex: newIndex }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const uploadResult = await minioS3Service.uploadFile(file, 'images');
        return {
          file,
          path: uploadResult.filePath,
          url: URL.createObjectURL(file)
        };
      });

      const results = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...results]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Erreur lors du téléchargement des images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre || !formData.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...formData,
        medias: uploadedImages.map(img => ({
          mediaType: 'IMAGE',
          filePath: img.path
        }))
      };

      await activityFeedService.createEvent(eventData);
      
      setFormData({
        titre: "",
        description: "",
        lieu: "",
        etat: "PLANIFIE",
        heureDebut: "",
        heureFin: "",
        createurId: localStorage.getItem("userId") || "user-id-123",
      });
      setUploadedImages([]);
      setShowCreateForm(false);
      
      await loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId) => {
    // Prevent multiple simultaneous like requests
    if (likingActivities[activityId]) return;
    
    setLikingActivities(prev => ({ ...prev, [activityId]: true }));
    
    try {
      // Get current user info
      const currentUser = JSON.parse(localStorage.getItem('authResponse') || '{}');
      const userName = localStorage.getItem('username') || currentUser.username || 'Vous';
      const firstName = userName.split(' ')[0];
      
      // Get current local state
      const currentActivity = activities.find(a => a.id === activityId);
      const currentLiked = localLikes[activityId] ?? currentActivity?.isLiked ?? false;
      const currentLikeCount = currentActivity?.likes ?? 0;
      const currentLikedBy = likedByUsers[activityId] || [];
      
      // Update local state immediately for better UX
      const newLiked = !currentLiked;
      let newLikeCount;
      let newLikedBy;
      
      if (newLiked) {
        // Add like
        newLikeCount = currentLikeCount + 1;
        newLikedBy = [firstName, ...currentLikedBy];
      } else {
        // Remove like
        newLikeCount = Math.max(0, currentLikeCount - 1);
        newLikedBy = currentLikedBy.filter(name => name !== firstName);
      }
      
      setLocalLikes(prev => ({ ...prev, [activityId]: newLiked }));
      setLikedByUsers(prev => ({ ...prev, [activityId]: newLikedBy }));
      
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                isLiked: newLiked,
                likes: newLikeCount,
                likedBy: newLikedBy
              }
            : activity
        )
      );
      
      // Try to sync with backend (will use mock behavior for now)
      try {
        await activityFeedService.addReaction(activityId, 'like');
        const serverLikeCount = await activityFeedService.getEventLikeCount(activityId);
        
        // Update with server response if available
        setActivities((prev) =>
          prev.map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  likes: serverLikeCount,
                }
              : activity
          )
        );
      } catch (error) {
        console.log('Backend sync failed, using local state');
      }
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setLikingActivities(prev => ({ ...prev, [activityId]: false }));
    }
  };

  const handleParticipate = (activityId) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              isParticipating: !activity.isParticipating,
              participants: activity.isParticipating
                ? activity.participants - 1
                : activity.participants + 1,
            }
          : activity
      )
    );
  };

  const toggleComments = (activityId) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? { ...activity, showComments: !activity.showComments }
          : activity
      )
    );
  };

  const addComment = async (activityId) => {
    const comment = newComment[activityId];
    if (!comment?.trim()) return;

    try {
      // Add comment to local state immediately
      const currentUser = JSON.parse(localStorage.getItem('authResponse') || '{}');
      const userName = localStorage.getItem('username') || currentUser.username || 'Vous';
      
      const newCommentObj = {
        id: Date.now(),
        content: comment,
        user: {
          id: localStorage.getItem('userId') || currentUser.userId,
          name: userName,
          avatar: '/api/placeholder/32/32'
        },
        creationDate: new Date().toISOString(),
        isLocal: true // Mark as local until synced
      };
      
      // Update local comments state
      setLocalComments(prev => ({
        ...prev,
        [activityId]: [...(prev[activityId] || []), newCommentObj]
      }));
      
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                comments: [...activity.comments, newCommentObj],
              }
            : activity
        )
      );
      
      setNewComment((prev) => ({ ...prev, [activityId]: "" }));
      
      // Try to sync with backend
      try {
        const success = await activityFeedService.commentOnActivity(activityId, comment);
        if (success) {
          // Mark comment as synced
          setActivities((prev) =>
            prev.map((activity) =>
              activity.id === activityId
                ? {
                    ...activity,
                    comments: activity.comments.map(c => 
                      c.id === newCommentObj.id ? { ...c, isLocal: false } : c
                    ),
                  }
                : activity
            )
          );
          console.log('Comment synced with backend');
        }
      } catch (error) {
        console.log('Backend sync failed, comment saved locally only');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async (activityId) => {
    try {
      await activityFeedService.shareActivity(activityId);
      
      // Update local state to reflect the share
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                shares: activity.shares + 1,
                isShared: true,
              }
            : activity
        )
      );
    } catch (error) {
      console.error('Error sharing activity:', error);
      alert('Erreur lors du partage');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = async () => {
    if (!formData.titre || !formData.description || !formData.lieu || !formData.heureDebut || !formData.heureFin) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    
    try {
      // First upload images if any
      const uploadedMedia = [];
      if (uploadedImages.length > 0) {
        setUploading(true);
        
        for (const img of uploadedImages) {
          try {
            const result = await minioS3Service.uploadFile(
              img.file,
              "images"
            );
            
            uploadedMedia.push({
              fileName: result.fileName,
              filePath: result.filePath,
              contentType: result.contentType,
              fileSize: result.fileSize,
              mediaType: "IMAGE",
              bucketName: "scholchat"
            });
          } catch (uploadError) {
            console.error(`Error uploading ${img.fileName}:`, uploadError);
          }
        }
        
        setUploading(false);
      }

      // Create event with media
      const eventData = {
        titre: formData.titre,
        description: formData.description,
        lieu: formData.lieu,
        etat: formData.etat,
        heureDebut: formData.heureDebut,
        heureFin: formData.heureFin,
        createurId: formData.createurId,
        participantsIds: [],
        medias: uploadedMedia,
        interactions: []
      };

      console.log('Creating event with media:', eventData);
      await activityFeedService.createEvent(eventData);

      setShowCreateForm(false);
      setFormData({
        titre: "",
        description: "",
        lieu: "",
        etat: "PLANIFIE",
        heureDebut: "",
        heureFin: "",
        createurId: localStorage.getItem("userId") || "user-id-123"
      });
      setUploadedImages([]);
      
      await loadEvents();
      
    } catch (error) {
      console.error('Error creating event:', error);
      alert(`Erreur lors de la création de l'événement: ${error.message}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Header with Create Button */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              Fil d'actualité
            </h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Créer
            </button>
          </div>
        </div>

        {/* Create Event Form */}
        {showCreateForm ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Calendar size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Créer un événement
                  </h2>
                  <p className="text-sm text-gray-600">
                    Remplissez les informations de votre événement
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => handleInputChange("titre", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mon événement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Description de l'événement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieu *
                </label>
                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />
                  <input
                    type="text"
                    value={formData.lieu}
                    onChange={(e) => handleInputChange("lieu", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Salle de conférence"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Début *
                  </label>
                  <div className="relative">
                    <Clock
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="datetime-local"
                      value={formData.heureDebut}
                      onChange={(e) =>
                        handleInputChange("heureDebut", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin *
                  </label>
                  <div className="relative">
                    <Clock
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="datetime-local"
                      value={formData.heureFin}
                      onChange={(e) =>
                        handleInputChange("heureFin", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  État
                </label>
                <select
                  value={formData.etat}
                  onChange={(e) => handleInputChange("etat", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PLANIFIE">Planifié</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Images (optionnel)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto">
                      {uploading ? (
                        <Loader2
                          size={24}
                          className="text-blue-600 animate-spin"
                        />
                      ) : (
                        <Image size={24} className="text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">
                        Ajouter des images
                      </p>
                      <p className="text-sm text-gray-500">
                        Cliquez pour sélectionner des fichiers
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      <Upload size={18} />
                      Sélectionner
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Image size={16} />
                    Images sélectionnées ({uploadedImages.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative group">
                          <img
                            src={image.url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Image {index + 1}
                              </p>
                              <p className="text-xs text-gray-500">
                                Prêt à être uploadé
                              </p>
                            </div>
                            <button
                              onClick={() => removeImage(index)}
                              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors ml-2"
                              title="Supprimer cette image"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={loading || uploading || !formData.titre || !formData.description || !formData.lieu || !formData.heureDebut || !formData.heureFin}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading || uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {uploading ? 'Traitement...' : 'Création...'}
                  </>
                ) : (
                  "Créer l'événement"
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Activities List */
          <div className="space-y-4">
            {loadingActivities ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune activité disponible
                </h3>
                <p className="text-gray-600 mb-6">
                  Soyez le premier à créer un événement et à partager vos activités avec la communauté.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  Créer le premier événement
                </button>
              </div>
            ) : (
              activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-lg shadow-sm">
                {/* Post Header */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {activity.user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {activity.user.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-800 mb-4">{activity.content}</p>
                </div>

                {/* Image Gallery */}
                {activity.images && activity.images.length > 0 && (
                  <div>
                    {activity.images.length === 1 && (
                      <div
                        className="w-full cursor-pointer bg-gray-50"
                        onClick={() => openImagePreview(activity.images, 0)}
                      >
                        <img
                          src={activity.images[0]}
                          alt="Post image"
                          className="w-full h-96 object-contain"
                          onError={(e) => {
                            console.error('Image failed to load:', activity.images[0]);
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => console.log('Image loaded successfully:', activity.images[0])}
                        />
                      </div>
                    )}

                    {activity.images.length === 2 && (
                      <div className="grid grid-cols-2 gap-1">
                        {activity.images.map((img, idx) => (
                          <div key={idx} className="bg-gray-50">
                            <img
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="w-full h-64 object-contain cursor-pointer"
                              onClick={() =>
                                openImagePreview(activity.images, idx)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {activity.images.length === 3 && (
                      <div className="grid grid-cols-2 gap-1">
                        <div className="bg-gray-50">
                          <img
                            src={activity.images[0]}
                            alt="Post image 1"
                            className="w-full h-64 object-contain cursor-pointer"
                            onClick={() => openImagePreview(activity.images, 0)}
                          />
                        </div>
                        <div className="grid grid-rows-2 gap-1">
                          <div className="bg-gray-50">
                            <img
                              src={activity.images[1]}
                              alt="Post image 2"
                              className="w-full h-32 object-contain cursor-pointer"
                              onClick={() => openImagePreview(activity.images, 1)}
                            />
                          </div>
                          <div className="bg-gray-50">
                            <img
                              src={activity.images[2]}
                              alt="Post image 3"
                              className="w-full h-32 object-contain cursor-pointer"
                              onClick={() => openImagePreview(activity.images, 2)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activity.images.length >= 4 && (
                      <div className="grid grid-cols-2 gap-1">
                        {activity.images.slice(0, 3).map((img, idx) => (
                          <div key={idx} className="bg-gray-50">
                            <img
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="w-full h-48 object-contain cursor-pointer"
                              onClick={() =>
                                openImagePreview(activity.images, idx)
                              }
                            />
                          </div>
                        ))}
                        <div
                          className="relative cursor-pointer bg-gray-50"
                          onClick={() => openImagePreview(activity.images, 3)}
                        >
                          <img
                            src={activity.images[3]}
                            alt="Post image 4"
                            className="w-full h-48 object-contain"
                          />
                          {activity.images.length > 4 && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                              <span className="text-white text-xl font-bold">
                                +{activity.images.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Engagement Stats */}
                {(activity.likes > 0 ||
                  activity.comments.length > 0 ||
                  activity.participants > 0) && (
                  <div className="px-4 py-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        {activity.likes > 0 && (
                          <button className="hover:underline">
                            <span className="flex items-center gap-1">
                              <Heart size={14} className="text-red-500 fill-current" />
                              {(() => {
                                const likedBy = activity.likedBy || [];
                                const totalLikes = activity.likes;
                                
                                if (totalLikes === 0) return null;
                                
                                if (totalLikes === 1) {
                                  return likedBy[0] || 'Quelqu\'un';
                                } else if (totalLikes === 2) {
                                  return likedBy[0] ? `${likedBy[0]} et 1 autre` : `${totalLikes} J'aime`;
                                } else {
                                  return likedBy[0] ? `${likedBy[0]} et ${totalLikes - 1} autres` : `${totalLikes} J'aime`;
                                }
                              })()} 
                            </span>
                          </button>
                        )}
                        {activity.participants > 0 && (
                          <span>
                            {activity.participants} participant
                            {activity.participants > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <span>
                        {activity.comments.length > 0 &&
                          `${activity.comments.length} commentaire${
                            activity.comments.length > 1 ? "s" : ""
                          }`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-around">
                    <button
                      onClick={() => handleLike(activity.id)}
                      disabled={likingActivities[activity.id]}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                        activity.isLiked
                          ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {likingActivities[activity.id] ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Heart
                          size={18}
                          className={activity.isLiked ? "fill-current" : ""}
                        />
                      )}
                      J'aime
                    </button>

                    <button
                      onClick={() => toggleComments(activity.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <MessageCircle size={18} />
                      Commenter
                    </button>

                    <button
                      onClick={() => handleParticipate(activity.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        activity.isParticipating
                          ? "text-green-600 bg-green-50 hover:bg-green-100"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <UserPlus size={18} />
                      Participer
                    </button>

                    <button 
                      onClick={() => handleShare(activity.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Share2 size={18} />
                      Partager
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {activity.showComments && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {/* Existing Comments */}
                    {activity.comments.length > 0 && (
                      <div className="p-4 space-y-3">
                        {activity.comments.map((comment) => {
                          const userName = comment.user?.name || comment.user || 'Utilisateur';
                          const userInitial = userName.charAt(0).toUpperCase();
                          const commentTime = comment.creationDate ? 
                            new Date(comment.creationDate).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit', 
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : comment.time || 'À l\'instant';
                          
                          return (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {userInitial}
                              </div>
                              <div className="flex-1">
                                <div className={`bg-white rounded-lg px-3 py-2 ${comment.isLocal ? 'border border-blue-200' : ''}`}>
                                  <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                    {userName}
                                    {comment.isLocal && (
                                      <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                                        Local
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-gray-800">
                                    {comment.content}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-3">
                                  {commentTime}
                                  {comment.isLocal && (
                                    <span className="text-blue-500 ml-2">
                                      • Sauvegardé localement
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Comment */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          V
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Écrivez un commentaire..."
                            value={newComment[activity.id] || ""}
                            onChange={(e) =>
                              setNewComment((prev) => ({
                                ...prev,
                                [activity.id]: e.target.value,
                              }))
                            }
                            onKeyPress={(e) =>
                              e.key === "Enter" && addComment(activity.id)
                            }
                            className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => addComment(activity.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {imagePreview.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeImagePreview}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>

            {/* Navigation Buttons */}
            {imagePreview.images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage("prev")}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => navigateImage("next")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={imagePreview.images[imagePreview.currentIndex]}
              alt={`Preview ${imagePreview.currentIndex + 1}`}
              className="w-full h-full object-contain rounded-lg"
            />

            {/* Image Counter */}
            {imagePreview.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {imagePreview.currentIndex + 1} / {imagePreview.images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesContent;