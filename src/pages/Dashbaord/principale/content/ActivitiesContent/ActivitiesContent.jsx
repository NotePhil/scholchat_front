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
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useSelector } from "react-redux";

const ActivitiesContent = () => {
  const { t } = useTranslation();
  const language = useSelector((state) => state.language?.currentLanguage || 'fr');
  
  // Helper function for French pluralization
  const pluralize = (count, singular, plural) => {
    return `${count} ${count === 1 ? singular : plural}`;
  };
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [staticActivities] = useState([]);
  const [likingActivities, setLikingActivities] = useState({});
  const [localLikes, setLocalLikes] = useState({}); // Track likes locally
  const [localComments, setLocalComments] = useState({}); // Track comments locally
  const [likedByUsers, setLikedByUsers] = useState({}); // Track who liked each post
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
    visibility: "PUBLIC", // Use visibility instead of etat
    heureDebut: "",
    heureFin: "",
    createurId: localStorage.getItem("userId") || "user-id-123",
    selectedClasses: [] // Array of selected class IDs
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const fileInputRef = useRef(null);

  // Load classes when visibility changes to PRIVATE
  const loadClasses = async () => {
    if (formData.visibility !== 'PRIVATE') return;
    
    setLoadingClasses(true);
    try {
      const userRole = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      
      let endpoint;
      if (userRole === 'ADMIN') {
        endpoint = `${process.env.REACT_APP_API_BASE_URL}/classes`;
      } else {
        // For professors, get classes they have access to via publication rights
        endpoint = `${process.env.REACT_APP_API_BASE_URL}/droits-publication/utilisateurs/${userId}/classes`;
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const classesData = await response.json();
        setClasses(classesData);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const openImagePreview = (images, index) => {
    setImagePreview({ isOpen: true, images, currentIndex: index });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadClasses();
  }, [formData.visibility]);

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
      const events = await activityFeedService.getActivities();
      
      console.log('Raw events from API:', events);
      console.log('Number of events:', events.length);
      
      // Process events directly in component
      const activitiesWithImages = await Promise.all(
        events.map(async (event) => {
          console.log('Processing event:', event.id, 'visibility:', event.visibility);
          
          const images = [];
          
          if (event.medias && event.medias.length > 0) {
            const imageUrls = await Promise.all(
              event.medias
                .filter(media => media.mediaType === 'IMAGE' && media.id)
                .map(async (media) => {
                  const imageUrl = await getImageUrl(media);
                  return imageUrl;
                })
            );
            
            const validUrls = imageUrls.filter(url => url !== null);
            images.push(...validUrls);
          }
          
          const currentUserId = localStorage.getItem('userId');
          
          // Process interactions - FIXED
          const interactions = event.interactions || [];
          const likes = interactions.filter(i => i.type === 'LIKE').length;
          
          // Get only COMMENT type interactions
          const comments = interactions
            .filter(i => i.type === 'COMMENT')
            .map(comment => ({
              id: comment.id,
              content: comment.content,
              createdById: comment.createdById,
              creationDate: comment.creationDate,
              isCurrentUser: comment.createdById === currentUserId
            }));
          
          const isLiked = interactions.some(i => 
            i.type === 'LIKE' && i.createdById === currentUserId
          );
          
          // Participants count should come from participantsIds array
          const participants = event.participantsIds?.length || 0;
          const isParticipating = event.participantsIds?.includes(currentUserId) || false;
          
          return {
            id: event.id,
            type: 'event',
            images,
            likes, // This now correctly counts only LIKE interactions
            comments, // This now contains only COMMENT interactions
            isLiked,
            participants, // Using participantsIds length
            isParticipating,
            showComments: false,
            user: { name: 'Event Creator' },
            content: `${event.titre}: ${event.description}`,
            timestamp: new Date(event.heureDebut).toLocaleString(),
            eventDetails: {
              title: event.titre,
              description: event.description,
              location: event.lieu,
              status: event.etat,
              startTime: event.heureDebut,
              endTime: event.heureFin,
              participantsCount: participants,
            },
            participantsIds: event.participantsIds || []
          };
        })
      );
      
      console.log('Processed activities:', activitiesWithImages.length);
      setActivities(activitiesWithImages);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
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
      const newImages = files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name
      }));
      
      setUploadedImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Error processing images:', error);
      alert(t('activities.errors.imageUploadFailed'));
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
      alert(t('activities.validation.requiredFields'));
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
        visibility: "PUBLIC",
        heureDebut: "",
        heureFin: "",
        createurId: localStorage.getItem("userId") || "user-id-123",
        selectedClasses: []
      });
      setUploadedImages([]);
      setShowCreateForm(false);
      
      await loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert(t('activities.errors.createEventFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId) => {
    if (likingActivities[activityId]) return;
    
    setLikingActivities(prev => ({ ...prev, [activityId]: true }));
    
    try {
      const currentActivity = activities.find(a => a.id === activityId);
      const currentUserId = localStorage.getItem('userId');
      const isCurrentlyLiked = currentActivity?.isLiked || false;
      
      // Update UI optimistically
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: isCurrentlyLiked ? activity.likes - 1 : activity.likes + 1,
              isLiked: !isCurrentlyLiked 
            }
          : activity
      ));
      
      // Send API request
      await activityFeedService.likeEvent(activityId);
    } catch (error) {
      console.error('Error handling like:', error);
      // Revert optimistic update on error
      const currentActivity = activities.find(a => a.id === activityId);
      const isCurrentlyLiked = currentActivity?.isLiked || false;
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: isCurrentlyLiked ? activity.likes + 1 : activity.likes - 1,
              isLiked: !isCurrentlyLiked 
            }
          : activity
      ));
    } finally {
      setLikingActivities(prev => ({ ...prev, [activityId]: false }));
    }
  };

  const toggleComments = (activityId) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, showComments: !activity.showComments }
        : activity
    ));
  };

  const handleParticipate = async (activityId) => {
    try {
      const currentActivity = activities.find(a => a.id === activityId);
      const currentUserId = localStorage.getItem('userId');
      const isCurrentlyParticipating = currentActivity?.isParticipating || false;
      
      // Update UI optimistically
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              participants: isCurrentlyParticipating ? activity.participants - 1 : activity.participants + 1,
              isParticipating: !isCurrentlyParticipating,
              participantsIds: isCurrentlyParticipating 
                ? activity.participantsIds.filter(id => id !== currentUserId)
                : [...activity.participantsIds, currentUserId]
            }
          : activity
      ));
      
      // Send API request
      if (isCurrentlyParticipating) {
        await activityFeedService.unjoinEvent(activityId);
      } else {
        await activityFeedService.joinEvent(activityId);
      }
    } catch (error) {
      console.error('Error handling participation:', error);
      // Revert optimistic update on error
      const currentActivity = activities.find(a => a.id === activityId);
      const currentUserId = localStorage.getItem('userId');
      const isCurrentlyParticipating = currentActivity?.isParticipating || false;
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              participants: isCurrentlyParticipating ? activity.participants + 1 : activity.participants - 1,
              isParticipating: !isCurrentlyParticipating,
              participantsIds: isCurrentlyParticipating 
                ? [...activity.participantsIds, currentUserId]
                : activity.participantsIds.filter(id => id !== currentUserId)
            }
          : activity
      ));
    }
  };

  const addComment = async (activityId) => {
    const comment = newComment[activityId];
    if (!comment?.trim()) return;

    try {
      const userId = localStorage.getItem('userId');
      const newCommentObj = {
        id: `temp-${Date.now()}`,
        content: comment,
        createdById: userId,
        creationDate: new Date().toISOString(),
        isCurrentUser: true
      };
      
      // Update UI optimistically
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              comments: [...activity.comments, newCommentObj]
            }
          : activity
      ));
      
      // Clear the input
      setNewComment(prev => ({ ...prev, [activityId]: '' }));
      
      // Send API request
      await activityFeedService.commentOnEvent(activityId, comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      // Revert optimistic update on error
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              comments: activity.comments.filter(c => !c.id.startsWith('temp-'))
            }
          : activity
      ));
    }
  };

  const handleShare = (activityId) => {
    alert(t('activities.actions.shareDemo'));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = async () => {
    if (!formData.titre || !formData.description || !formData.lieu || !formData.heureDebut || !formData.heureFin) {
      alert(t('activities.validation.requiredFields'));
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
        visibility: formData.visibility,
        selectedClasses: formData.visibility === 'PRIVATE' ? formData.selectedClasses : [],
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
      alert(`${t('activities.errors.createEventFailed')}: ${error.message}`);
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
              {t('activities.title')}
            </h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              {t('activities.actions.create')}
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
                    {t('activities.createEvent.title')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {t('activities.createEvent.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('activities.form.title')} *
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => handleInputChange("titre", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('activities.form.titlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('activities.form.description')} *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={t('activities.form.descriptionPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('activities.form.location')} *
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
                    placeholder={t('activities.form.locationPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('activities.form.startTime')} *
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
                    {t('activities.form.endTime')} *
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
                  {t('activities.form.status')}
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => handleInputChange("visibility", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Privé</option>
                </select>
              </div>

              {/* Sélection des Classes - Seulement si PRIVÉ */}
              {formData.visibility === "PRIVATE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner les Classes *
                  </label>
                  {loadingClasses ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={20} className="animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Chargement des classes...</span>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {classes.length === 0 ? (
                        <p className="text-gray-500 text-sm">Aucune classe disponible</p>
                      ) : (
                        <div className="space-y-2">
                          {classes.map((cls) => (
                            <label key={cls.id} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.selectedClasses?.includes(cls.id) || false}
                                onChange={(e) => {
                                  const classId = cls.id;
                                  if (e.target.checked) {
                                    handleInputChange("selectedClasses", [...(formData.selectedClasses || []), classId]);
                                  } else {
                                    handleInputChange("selectedClasses", (formData.selectedClasses || []).filter(id => id !== classId));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{cls.nom || cls.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('activities.form.images')}
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
                        {t('activities.form.addImages')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('activities.form.selectFiles')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      <Upload size={18} />
                      {t('activities.actions.select')}
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
                    {t('activities.form.selectedImages', { count: uploadedImages.length })}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-square">
                          <img
                            src={image.url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openImagePreview([image.url], 0)}
                          />
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => removeImage(index)}
                            className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors"
                            title="Remove image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                          <p className="text-xs truncate">{image.name}</p>
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
                {t('common.actions.cancel')}
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={loading || uploading || !formData.titre || !formData.description || !formData.lieu || !formData.heureDebut || !formData.heureFin || (formData.visibility === 'PRIVATE' && formData.selectedClasses.length === 0)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading || uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {uploading ? t('activities.actions.processing') : t('activities.actions.creating')}
                  </>
                ) : (
                  t('activities.actions.createEvent')
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
                  {t('activities.noActivities.title')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('activities.noActivities.description')}
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  {t('activities.noActivities.createFirst')}
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
                <div className="px-4 py-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      {activity.likes > 0 && (
                        <button className="hover:underline flex items-center gap-1">
                          <Heart size={14} className="text-red-500 fill-current" />
                          {activity.likes} {t('activities.actions.like')}
                        </button>
                      )}
                      {activity.participants > 0 && (
                        <span>
                          {pluralize(activity.participants, 'participant', 'participants')}
                        </span>
                      )}
                    </div>
                    {activity.comments.length > 0 && (
                      <span>
                        {pluralize(activity.comments.length, 'commentaire', 'commentaires')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-around">
                    <button
                      onClick={() => handleLike(activity.id)}
                      disabled={likingActivities[activity.id]}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                        activity.isLiked
                          ? "text-red-600 bg-red-50 hover:bg-red-100"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {likingActivities[activity.id] ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Heart
                          size={18}
                          className={activity.isLiked ? "fill-current text-red-600" : ""}
                        />
                      )}
                      {t('activities.actions.like')} {activity.likes > 0 && `(${activity.likes})`}
                    </button>

                    <button
                      onClick={() => toggleComments(activity.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <MessageCircle size={18} />
                      {t('activities.actions.comment')} {activity.comments.length > 0 && `(${activity.comments.length})`}
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
                      {t('activities.actions.participate')} {activity.participants > 0 && `(${activity.participants})`}
                    </button>

                    <button 
                      onClick={() => handleShare(activity.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Share2 size={18} />
                      {t('activities.actions.share')}
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {activity.showComments && (
                  <div className="border-t border-gray-100">
                    {/* Existing Comments */}
                    {activity.comments.length > 0 && (
                      <div className={`px-4 py-3 space-y-2 ${
                        activity.comments.length > 4 ? 'max-h-48 overflow-y-auto' : ''
                      }`}>
                        {activity.comments.map((comment) => {
                          const commentTime = comment.creationDate ? 
                            new Date(comment.creationDate).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit', 
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'À l\'instant';
                          
                          return (
                            <div key={comment.id} className={`flex gap-2 ${comment.isCurrentUser ? 'flex-row-reverse' : ''}`}>
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {comment.isCurrentUser ? 'V' : 'U'}
                              </div>
                              <div className={`flex-1 ${comment.isCurrentUser ? 'text-right' : ''}`}>
                                <div className={`rounded-2xl px-3 py-2 inline-block max-w-xs ${
                                  comment.isCurrentUser 
                                    ? 'bg-blue-500 text-white ml-auto' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}>
                                  <p className="text-sm">
                                    {comment.content}
                                  </p>
                                </div>
                                <p className={`text-xs text-gray-500 mt-1 ${
                                  comment.isCurrentUser ? 'mr-3' : 'ml-3'
                                }`}>
                                  {commentTime}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Comment */}
                    <div className="px-4 py-3 border-t border-gray-200">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          V
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder={t('activities.form.commentPlaceholder')}
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
                            className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 pr-10"
                          />
                          <button
                            onClick={() => addComment(activity.id)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600"
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