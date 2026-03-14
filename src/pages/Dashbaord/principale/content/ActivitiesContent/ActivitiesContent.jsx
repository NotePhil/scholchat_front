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
  Home,
  Users,
  Video,
  Store,
  Bell,
  BookOpen
} from "lucide-react";
import { activityFeedService } from "../../../../../services/ActivityFeedService";
import { minioS3Service } from "../../../../../services/minioS3";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

/**
 * ActivitiesContent - Professional Facebook-like Activity Feed
 * Responsive design with left sidebar and main content area
 * All API calls preserved, enhanced UI/UX
 */
const ActivitiesContent = () => {
  const { t } = useTranslation();
  const language = useSelector((state) => state.language?.currentLanguage || 'fr');
  const isMobile = useSelector((state) => state.ui.isMobile);

  // Role check: only professors and admins can create events
  const userRole = (localStorage.getItem('userRole') || '').toUpperCase();
  const canCreateEvent = userRole.includes('ADMIN') || userRole.includes('PROFESSOR') || userRole.includes('TUTOR') || userRole.includes('GESTIONNAIRE');

  const pluralize = (count, singular, plural) => {
    return `${count} ${count === 1 ? singular : plural}`;
  };

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [staticActivities] = useState([]);
  const [likingActivities, setLikingActivities] = useState({});
  const [localLikes, setLocalLikes] = useState({});
  const [localComments, setLocalComments] = useState({});
  const [likedByUsers, setLikedByUsers] = useState({});
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
    visibility: "PUBLIC",
    heureDebut: "",
    heureFin: "",
    createurId: localStorage.getItem("userId") || "user-id-123",
    selectedClasses: []
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const fileInputRef = useRef(null);

  const loadClasses = async () => {
    if (formData.visibility !== 'PRIVATE') return;

    setLoadingClasses(true);
    try {
      const userRole = localStorage.getItem('userRole') || '';
      const userId = localStorage.getItem('userId');
      const isAdmin = userRole.toUpperCase().includes('ADMIN');

      let endpoint;
      if (isAdmin) {
        // Admin sees all classes
        endpoint = `${process.env.REACT_APP_API_BASE_URL}/classes`;
      } else {
        // Professor sees classes they have publication rights for
        // Students/parents see classes they have access to
        endpoint = `${process.env.REACT_APP_API_BASE_URL}/droits-publication/utilisateurs/${userId}/classes`;
      }

      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const classesData = await response.json();
        setClasses(classesData);
      } else {
        console.error('Error loading classes, status:', response.status);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
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
      if (!media.id) return null;
      const downloadData = await minioS3Service.generateDownloadUrl(media.id);
      return downloadData.downloadUrl;
    } catch (error) {
      console.error('Failed to get image URL:', error);
      return null;
    }
  };

  const loadEvents = async () => {
    try {
      setLoadingActivities(true);
      const events = await activityFeedService.getActivities();
      
      const activitiesWithMedias = await Promise.all(
        events.map(async (event) => {
          const medias = [];
          
          if (event.medias && event.medias.length > 0) {
            const mediaItems = await Promise.all(
              event.medias
                .filter(media => (media.mediaType === 'IMAGE' || media.mediaType === 'VIDEO') && media.id)
                .map(async (media) => {
                  const url = await getImageUrl(media);
                  return url ? { type: media.mediaType, url } : null;
                })
            );
            medias.push(...mediaItems.filter(item => item !== null));
          }
          
          const currentUserId = localStorage.getItem('userId');
          const interactions = event.interactions || [];
          const likes = interactions.filter(i => i.type === 'LIKE').length;
          
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
          
          const participants = event.participantsIds?.length || 0;
          const isParticipating = event.participantsIds?.includes(currentUserId) || false;
          
          return {
            id: event.id,
            type: 'event',
            medias,
            likes,
            comments,
            isLiked,
            participants,
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
            participantsIds: event.participantsIds || [],
            heureDebut: event.heureDebut
          };
        })
      );
      
      activitiesWithMedias.sort((a, b) => new Date(b.heureDebut) - new Date(a.heureDebut));
      
      setActivities(activitiesWithMedias);
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
      const newMedia = files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        contentType: file.type
      }));
      
      setUploadedImages(prev => [...prev, ...newMedia]);
    } catch (error) {
      console.error('Error processing media:', error);
      alert(t('activities.errors.mediaUploadFailed', 'Échec du chargement des médias'));
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
      const isCurrentlyLiked = currentActivity?.isLiked || false;
      
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: isCurrentlyLiked ? activity.likes - 1 : activity.likes + 1,
              isLiked: !isCurrentlyLiked 
            }
          : activity
      ));
      
      await activityFeedService.likeEvent(activityId);
    } catch (error) {
      console.error('Error handling like:', error);
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
      
      if (isCurrentlyParticipating) {
        await activityFeedService.unjoinEvent(activityId);
      } else {
        await activityFeedService.joinEvent(activityId);
      }
    } catch (error) {
      console.error('Error handling participation:', error);
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
      
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              comments: [...activity.comments, newCommentObj]
            }
          : activity
      ));
      
      setNewComment(prev => ({ ...prev, [activityId]: '' }));
      
      await activityFeedService.commentOnEvent(activityId, comment);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = (activityId) => {
    alert(t('activities.actions.shareDemo'));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = async () => {
    if (!formData.titre || !formData.description || !formData.lieu || !formData.heureDebut) {
      alert(t('activities.validation.requiredFields'));
      return;
    }

    setLoading(true);
    
    try {
      const uploadedMedia = [];
      if (uploadedImages.length > 0) {
        setUploading(true);
        
        for (const media of uploadedImages) {
          try {
            const result = await minioS3Service.uploadFile(media.file, media.type === 'VIDEO' ? 'videos' : 'images');
            
            uploadedMedia.push({
              fileName: result.fileName,
              filePath: result.filePath,
              contentType: result.contentType,
              fileSize: result.fileSize,
              mediaType: media.type, // 'IMAGE' or 'VIDEO'
              bucketName: "scholchat"
            });
          } catch (uploadError) {
            console.error(`Error uploading ${media.name}:`, uploadError);
          }
        }
        
        setUploading(false);
      }

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
    <div>
      {/* Facebook-like Layout: Sidebar + Main Content */}
      <div className="mx-auto max-w-7xl">
        <div className="flex gap-0 lg:gap-6">
          {/* Left Sidebar - Hidden on mobile, visible on desktop */}
          <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-20 space-y-2">
              <motion.div 
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {localStorage.getItem('userName')?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{localStorage.getItem('userName') || 'User'}</span>
              </motion.div>

              <motion.div 
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('activities.sidebar.groups', 'Groupes')}</span>
              </motion.div>

              <motion.div 
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('activities.sidebar.events', 'Événements')}</span>
              </motion.div>

              <motion.div 
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('activities.sidebar.saved', 'Enregistrés')}</span>
              </motion.div>

              {canCreateEvent && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  {t('activities.actions.create', 'Créer un événement')}
                </button>
              </div>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className={`max-w-2xl mx-auto ${isMobile ? 'px-0 py-2' : 'px-0 sm:px-4 py-4 sm:py-6'}`}>
              {/* Mobile Header */}
              <div className="lg:hidden bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center justify-between">
                  <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-white`}>
                    {t('activities.title', 'Fil d\'actualité')}
                  </h1>
                  {canCreateEvent && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className={`bg-blue-600 hover:bg-blue-700 text-white ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg transition-colors`}
                  >
                    <Plus className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </button>
                  )}
                </div>
              </div>

              {/* Create Event Form Modal/Card */}
              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 overflow-y-auto lg:relative lg:inset-auto lg:bg-transparent lg:p-0 lg:pt-0 lg:mb-4"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setShowCreateForm(false);
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('activities.createEvent.title', 'Créer un événement')}
                      </h2>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4">
                      {/* Form fields - same as before but with better styling */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('activities.form.title', 'Titre')} *
                        </label>
                        <input
                          type="text"
                          value={formData.titre}
                          onChange={(e) => handleInputChange("titre", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder={t('activities.form.titlePlaceholder', 'Ex: Réunion parents-professeurs')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('activities.form.description', 'Description')} *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                          placeholder={t('activities.form.descriptionPlaceholder', 'Décrivez votre événement...')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('activities.form.location', 'Lieu')} *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.lieu}
                            onChange={(e) => handleInputChange("lieu", e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder={t('activities.form.locationPlaceholder', 'Salle 101')}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('activities.form.startTime', 'Début')} *
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.heureDebut}
                            onChange={(e) => handleInputChange("heureDebut", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('activities.form.endTime', 'Fin')}
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.heureFin}
                            onChange={(e) => handleInputChange("heureFin", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('activities.form.status', 'Visibilité')}
                        </label>
                        <select
                          value={formData.visibility}
                          onChange={(e) => handleInputChange("visibility", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="PUBLIC">Public</option>
                          <option value="PRIVATE">Privé</option>
                        </select>
                      </div>

                      {formData.visibility === "PRIVATE" && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('activities.form.selectClasses', 'Sélectionner les Classes')} *
                          </label>
                          {loadingClasses ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                              <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
                            </div>
                          ) : (
                            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto">
                              {classes.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune classe disponible</p>
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
                                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">{cls.nom || cls.name}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          {t('activities.form.images', 'Photos')}
                        </label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                        >
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto">
                              {uploading ? (
                                <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                              ) : (
                                <Image className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 dark:text-gray-300">
                                {t('activities.form.addImages', 'Ajouter des photos')}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('activities.form.selectFiles', 'Cliquez pour sélectionner')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {uploadedImages.map((media, index) => (
                            <div key={index} className="relative group">
                              {media.type === 'VIDEO' ? (
                                <video
                                  src={media.url}
                                  controls
                                  playsInline
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              ) : (
                                <img
                                  src={media.url}
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              )}
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3">
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                      >
                        {t('common.actions.cancel', 'Annuler')}
                      </button>
                      <button
                        onClick={handleCreateEvent}
                        disabled={loading || uploading || !formData.titre || !formData.description || !formData.lieu || !formData.heureDebut || (formData.visibility === 'PRIVATE' && formData.selectedClasses.length === 0)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading || uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {uploading ? t('activities.actions.processing', 'Traitement...') : t('activities.actions.creating', 'Création...')}
                          </>
                        ) : (
                          t('activities.actions.createEvent', 'Créer l\'événement')
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Activities Feed */}
              <div className="space-y-4">
                {loadingActivities ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('activities.noActivities.title', 'Aucune activité')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {t('activities.noActivities.description', 'Créez votre premier événement')}
                    </p>
                    {canCreateEvent && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                      {t('activities.noActivities.createFirst', 'Créer un événement')}
                    </button>
                    )}
                  </div>
                ) : (
                  activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-sm overflow-hidden"
                    >
                      {/* Post Header */}
                      <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
                        <div className={`flex items-center ${isMobile ? 'gap-2 mb-2' : 'gap-3 mb-3'}`}>
                          <div className={`${isMobile ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md`}>
                            {activity.user.name?.charAt(0)?.toUpperCase() || 'E'}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold text-gray-900 dark:text-white ${isMobile ? 'text-sm' : ''}`}>
                              {activity.user.name}
                            </h3>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
                              {activity.timestamp}
                            </p>
                          </div>
                        </div>

                        {/* Post Content */}
                        <p className={`text-gray-800 dark:text-gray-200 ${isMobile ? 'text-sm mb-2' : 'mb-4'} whitespace-pre-wrap`}>{activity.content}</p>
                      </div>

                      {/* Media Gallery */}
                      {activity.medias && activity.medias.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900/50">
                          {activity.medias.length === 1 && (
                            <div className="w-full">
                              {activity.medias[0].type === 'VIDEO' ? (
                                <video
                                  src={activity.medias[0].url}
                                  controls
                                  playsInline
                                  className="w-full max-h-96 object-contain"
                                />
                              ) : (
                                <div
                                  className="w-full cursor-pointer"
                                  onClick={() => openImagePreview(activity.medias.filter(m => m.type === 'IMAGE').map(m => m.url), 0)}
                                >
                                  <img
                                    src={activity.medias[0].url}
                                    alt="Post"
                                    className="w-full max-h-96 object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {activity.medias.length > 1 && (
                            <div className={`grid gap-1 ${activity.medias.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                              {activity.medias.map((media, idx) => (
                                <div key={idx} className="relative">
                                  {media.type === 'VIDEO' ? (
                                    <video
                                      src={media.url}
                                      controls
                                      playsInline
                                      className="w-full h-48 sm:h-64 object-cover"
                                    />
                                  ) : (
                                    <img
                                      src={media.url}
                                      alt={`Post ${idx + 1}`}
                                      className="w-full h-48 sm:h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                      onClick={() => {
                                        const imageUrls = activity.medias.filter(m => m.type === 'IMAGE').map(m => m.url);
                                        const imgIdx = imageUrls.indexOf(media.url);
                                        openImagePreview(imageUrls, imgIdx !== -1 ? imgIdx : 0);
                                      }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Engagement Stats */}
                      {(activity.likes > 0 || activity.participants > 0 || activity.comments.length > 0) && (
                        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-3">
                              {activity.likes > 0 && (
                                <span className="flex items-center gap-1">
                                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                                  {activity.likes}
                                </span>
                              )}
                              {activity.participants > 0 && (
                                <span className="flex items-center gap-1">
                                  <UserPlus className="w-4 h-4 text-green-500" />
                                  {pluralize(activity.participants, 'participant', 'participants')}
                                </span>
                              )}
                            </div>
                            {activity.comments.length > 0 && (
                              <button
                                onClick={() => toggleComments(activity.id)}
                                className="hover:underline"
                              >
                                {pluralize(activity.comments.length, 'commentaire', 'commentaires')}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className={`${isMobile ? 'px-1 py-1' : 'px-2 sm:px-4 py-2'} border-t border-gray-100 dark:border-gray-700`}>
                        <div className="flex items-center justify-around gap-1">
                          <button
                            onClick={() => handleLike(activity.id)}
                            disabled={likingActivities[activity.id]}
                            className={`flex-1 flex items-center justify-center ${isMobile ? 'gap-1 px-1 py-1.5' : 'gap-2 px-2 py-2.5'} rounded-lg font-semibold ${isMobile ? 'text-xs' : 'text-sm'} transition-all ${
                              activity.isLiked
                                ? "text-red-600 bg-red-50 dark:bg-red-900/20"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {likingActivities[activity.id] ? (
                              <Loader2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
                            ) : (
                              <Heart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${activity.isLiked ? 'fill-current' : ''}`} />
                            )}
                            <span className={`${isMobile ? 'hidden' : 'hidden sm:inline'}`}>{t('activities.actions.like', 'J\'aime')}</span>
                          </button>

                          <button
                            onClick={() => toggleComments(activity.id)}
                            className={`flex-1 flex items-center justify-center ${isMobile ? 'gap-1 px-1 py-1.5' : 'gap-2 px-2 py-2.5'} rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold ${isMobile ? 'text-xs' : 'text-sm'} transition-all`}
                          >
                            <MessageCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                            <span className={`${isMobile ? 'hidden' : 'hidden sm:inline'}`}>{t('activities.actions.comment', 'Commenter')}</span>
                          </button>

                          <button
                            onClick={() => handleParticipate(activity.id)}
                            className={`flex-1 flex items-center justify-center ${isMobile ? 'gap-1 px-1 py-1.5' : 'gap-2 px-2 py-2.5'} rounded-lg font-semibold ${isMobile ? 'text-xs' : 'text-sm'} transition-all ${
                              activity.isParticipating
                                ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            <UserPlus className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                            <span className={`${isMobile ? 'hidden' : 'hidden sm:inline'}`}>{t('activities.actions.participate', 'Participer')}</span>
                          </button>

                          <button
                            onClick={() => handleShare(activity.id)}
                            className={`flex-1 flex items-center justify-center ${isMobile ? 'gap-1 px-1 py-1.5' : 'gap-2 px-2 py-2.5'} rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold ${isMobile ? 'text-xs' : 'text-sm'} transition-all`}
                          >
                            <Share2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                            <span className={`${isMobile ? 'hidden' : 'hidden sm:inline'}`}>{t('activities.actions.share', 'Partager')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {activity.showComments && (
                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                          {activity.comments.length > 0 && (
                            <div className="px-4 py-3 space-y-3 max-h-96 overflow-y-auto">
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
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                      {comment.isCurrentUser ? 'V' : 'U'}
                                    </div>
                                    <div className={`flex-1 max-w-[75%] ${comment.isCurrentUser ? 'text-right' : ''}`}>
                                      <div className={`rounded-2xl px-4 py-2 inline-block ${
                                        comment.isCurrentUser 
                                          ? 'bg-blue-600 text-white' 
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                      }`}>
                                        <p className="text-sm break-words">{comment.content}</p>
                                      </div>
                                      <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
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
                          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                V
                              </div>
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  placeholder={t('activities.form.commentPlaceholder', 'Écrire un commentaire...')}
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
                                  className="w-full bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                                <button
                                  onClick={() => addComment(activity.id)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 transition-colors"
                                  >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Image Preview Modal - Same as before */}
      {imagePreview.isOpen && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100]"
          onClick={closeImagePreview}
        >
          <div
            className="relative max-w-6xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {imagePreview.images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage("prev")}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigateImage("next")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <img
              src={imagePreview.images[imagePreview.currentIndex]}
              alt={`Preview ${imagePreview.currentIndex + 1}`}
              className="w-full h-full object-contain rounded-lg"
            />

            {imagePreview.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
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