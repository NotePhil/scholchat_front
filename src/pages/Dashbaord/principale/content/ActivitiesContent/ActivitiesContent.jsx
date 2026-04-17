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
  ChevronDown,
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
import { useAuth } from "../../../../../hooks/useAuth";

const ActivitiesContent = () => {
  const { t } = useTranslation();
  const language = useSelector((state) => state.language?.currentLanguage || 'fr');
  const isMobile = useSelector((state) => state.ui.isMobile);
  const { isAdmin, isProfessor, isTutor, isGestionnaire, user } = useAuth();

  // Role check: only professors and admins can create events
  const userRole = (localStorage.getItem('userRole') || '').toUpperCase();
  const canCreateEvent = isAdmin || isProfessor || isTutor || isGestionnaire ||
    userRole.includes('ADMIN') || userRole.includes('PROFESSOR') || userRole.includes('TUTOR') || userRole.includes('GESTIONNAIRE');

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
  const [activeTab, setActiveTab] = useState('all'); // New state for active tab
  const [filteredActivities, setFilteredActivities] = useState([]); // Filtered activities
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

      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      const isProfessor = userRole.toUpperCase().includes('PROFESSOR') || userRole.toUpperCase().includes('TUTOR');

      let classesData = [];

      if (isAdmin) {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/classes`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) classesData = await response.json();
      } else if (isProfessor) {
        // Try moderator classes first, then publication rights, then accessible classes
        try {
          const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/classes`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          if (resp.ok) {
            const allClasses = await resp.json();
            // Filter to only classes where this professor is moderator or has access
            const accessResp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/acceder/utilisateurs/${userId}/classes`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const accessClasses = accessResp.ok ? await accessResp.json() : [];
            const accessIds = accessClasses.map(c => c.id);
            classesData = allClasses.filter(c => c.moderatorId === userId || accessIds.includes(c.id));
            if (classesData.length === 0) classesData = allClasses.filter(c => c.etat === 'ACTIF');
          }
        } catch (e) {
          console.warn("Fallback to all classes:", e);
        }
      } else {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/acceder/utilisateurs/${userId}/classes`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) classesData = await response.json();
      }

      // Filter active classes only
      setClasses(classesData.filter(c => c.etat === 'ACTIF' || !c.etat));
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

  // Filter activities based on active tab
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    let filtered = [];
    
    switch (activeTab) {
      case 'user':
        // Show only user's own events
        filtered = activities.filter(activity => 
          activity.eventDetails && activity.eventDetails.createurId === currentUserId
        );
        break;
      case 'groups':
        // Show only private/group events
        filtered = activities.filter(activity => 
          activity.visibility === 'PRIVATE'
        );
        break;
      case 'events':
        // Show only upcoming events
        filtered = activities.filter(activity => 
          activity.eventDetails && new Date(activity.eventDetails.startTime) > new Date()
        );
        break;
      case 'saved':
        // Show only liked/participated events
        filtered = activities.filter(activity => 
          activity.isLiked || activity.isParticipating
        );
        break;
      default:
        filtered = activities;
    }
    
    setFilteredActivities(filtered);
  }, [activities, activeTab]);

  const getImageUrl = async (media) => {
    try {
      if (!media.id) return null;
      // Try proxy first, fallback to presigned URL
      const proxyUrl = `${process.env.REACT_APP_API_BASE_URL}/media/${media.id}/content`;
      // Test if proxy works by doing a HEAD request
      try {
        const testResp = await fetch(proxyUrl, { method: 'HEAD' });
        if (testResp.ok) return proxyUrl;
      } catch (e) { /* proxy failed, try presigned */ }
      // Fallback: get presigned URL from backend
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
        const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/media/${media.id}/download-url`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          return data.url || proxyUrl;
        }
      } catch (e) { /* fallback to proxy */ }
      return proxyUrl;
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
          
          // Resolve creator name and role from backend fields
          let creatorName = '';
          let creatorRole = event.createurRole || '';

          // Backend now sends createurNom, createurPrenom, createurRole
          if (event.createurPrenom || event.createurNom) {
            creatorName = `${event.createurPrenom || ''} ${event.createurNom || ''}`.trim();
          } else if (event.createur) {
            const cPrenom = event.createur.prenom || '';
            const cNom = event.createur.nom || '';
            creatorName = `${cPrenom} ${cNom}`.trim() || event.createur.email || '';
          }

          // Fallback: fetch from API if still no name
          if (!creatorName && event.createurId) {
            try {
              const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
              const userRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/utilisateurs/${event.createurId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                creatorName = `${userData.prenom || ''} ${userData.nom || ''}`.trim() || userData.email || 'Utilisateur';
                if (userData.admin) creatorRole = 'Admin';
                else if (userData.type) {
                  const typeMap = { professeur: 'Professeur', eleve: 'Eleve', parent: 'Parent', gestionnaire: 'Gestionnaire', repetiteur: 'Repetiteur' };
                  creatorRole = typeMap[userData.type.toLowerCase()] || '';
                }
              }
            } catch (e) {
              console.warn('Could not fetch creator details:', e);
            }
          }

          if (!creatorName) creatorName = 'Utilisateur';

          // Resolve class names from selectedClasses IDs
          let classNames = [];
          if (event.selectedClasses && event.selectedClasses.length > 0) {
            try {
              const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
              const classResults = await Promise.all(
                event.selectedClasses.map(async (classId) => {
                  try {
                    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/classes/${classId}`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                      const cls = await res.json();
                      return cls.nom || cls.name || null;
                    }
                  } catch (e) { /* ignore */ }
                  return null;
                })
              );
              classNames = classResults.filter(Boolean);
            } catch (e) { /* ignore */ }
          }

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
            user: { name: creatorName, role: creatorRole, classNames },
            titre: event.titre,
            description: event.description,
            content: event.description,
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
            heureDebut: event.heureDebut,
            visibility: event.visibility || 'PUBLIC',
            selectedClasses: event.selectedClasses || [],
            createurId: event.createurId,
          };
        })
      );
      
      activitiesWithMedias.sort((a, b) => new Date(b.heureDebut) - new Date(a.heureDebut));

      // Filter based on role and visibility
      const currentUserId = localStorage.getItem('userId');
      const selectedRole = (localStorage.getItem('userRole') || '').toUpperCase().replace('ROLE_', '');
      const isParentOrStudentRole = selectedRole === 'PARENT' || selectedRole === 'STUDENT';

      let visibleActivities = activitiesWithMedias;

      if (isParentOrStudentRole) {
        // For parent/student: get child's classes to filter private events
        const childId = selectedRole === 'PARENT'
          ? (localStorage.getItem('selectedChildId') || currentUserId)
          : currentUserId;

        let userClassIds = [];
        try {
          const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
          const classResp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/acceder/utilisateurs/${childId}/classes`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (classResp.ok) {
            const userClasses = await classResp.json();
            userClassIds = userClasses.map(c => c.id);
          }
        } catch (e) { /* ignore */ }

        visibleActivities = activitiesWithMedias.filter(a => {
          // Public events: always visible
          if (!a.visibility || a.visibility === 'PUBLIC') return true;
          // Private events: only if child has access to one of the event's classes
          if (a.selectedClasses && a.selectedClasses.length > 0) {
            return a.selectedClasses.some(classId => userClassIds.includes(classId));
          }
          return false;
        });
      }
      // Professor/Admin see all events

      setActivities(visibleActivities);
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
      // Validate file sizes
      const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
      const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

      const validFiles = [];
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        if (file.size > maxSize) {
          const maxMB = maxSize / 1024 / 1024;
          alert(`${file.name} est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum: ${maxMB} Mo`);
          continue;
        }
        validFiles.push(file);
      }

      const newMedia = validFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        contentType: file.type
      }));

      setUploadedImages(prev => [...prev, ...newMedia]);
    } catch (error) {
      console.error('Error processing media:', error);
      alert(t('activities.errors.mediaUploadFailed', 'Echec du chargement des medias'));
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
        etat: "PLANIFIE",
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
    <div className="relative">
      {/* Facebook-like Layout: Sidebar + Main Content */}
      <div className={`mx-auto max-w-7xl ${isMobile ? 'pb-32' : ''}`}>
        <div className="flex gap-0 lg:gap-6">
          {/* Left Sidebar - Hidden on mobile, visible on desktop */}
          <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0">
            <div className="sticky top-20 space-y-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3">
              {[
                { key: 'all', label: 'Fil d\'actualite', icon: Home, color: 'text-gray-700', bg: '' },
                { key: 'user', label: 'Mes publications', icon: Store, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
                { key: 'groups', label: 'Groupes prives', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                { key: 'events', label: 'A venir', icon: Calendar, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
                { key: 'saved', label: 'Favoris', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-100 dark:bg-blue-800' : item.bg || 'bg-gray-100 dark:bg-gray-700'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : item.color}`} />
                    </div>
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}

              {canCreateEvent && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Creer un evenement
                </button>
              </div>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className={`max-w-2xl mx-auto ${isMobile ? 'px-0 py-2' : 'px-0 sm:px-4 py-4 sm:py-6'}`}>
              {/* Mobile Header with Tabs - Sticky for better accessibility */}
              <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 rounded-none shadow-md mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4">
                  <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-white`}>
                    {t('activities.title', 'Fil d\'actualité')}
                  </h1>
                  {canCreateEvent && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Tab Navigation - Soft pill style */}
                <div className="flex overflow-x-auto scrollbar-hide gap-1.5 px-3 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {[
                    { key: 'all', label: 'Tout' },
                    { key: 'user', label: 'Mes posts' },
                    { key: 'groups', label: 'Groupes' },
                    { key: 'events', label: 'A venir' },
                    { key: 'saved', label: 'Favoris' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3.5 py-1.5 text-xs font-medium whitespace-nowrap rounded-full transition-all ${
                        activeTab === tab.key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Floating Action Button for Mobile */}
              {canCreateEvent && isMobile && !showCreateForm && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCreateForm(true)}
                  className="fixed bottom-32 right-6 z-[100] w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white dark:border-gray-900"
                >
                  <Plus className="w-8 h-8" />
                </motion.button>
              )}

              {/* Create Event Form Modal/Card */}
              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, y: isMobile ? '100%' : 0, scale: isMobile ? 1 : 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`fixed inset-0 z-[1100] flex ${isMobile ? 'items-end' : 'items-center justify-center p-4'} bg-black/60 backdrop-blur-sm overflow-hidden`}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setShowCreateForm(false);
                  }}
                >
                  <div className={`bg-white dark:bg-gray-800 shadow-2xl w-full ${isMobile ? 'h-[92vh] rounded-t-[32px]' : 'max-w-2xl max-h-[90vh] rounded-2xl'} overflow-hidden flex flex-col relative`}>
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-5 flex items-center justify-between z-10">
                      <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">
                          {t('activities.createEvent.title', 'Nouvel Événement')}
                        </h2>
                        {isMobile && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Partagez avec votre communauté</p>}
                      </div>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl transition-all"
                      >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                      </button>
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 no-scrollbar pb-40">
                      {/* Form fields */}
                      <div className="space-y-4">
                        <div className="group">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-blue-500 transition-colors">
                            {t('activities.form.title', 'Titre de l\'événement')} *
                          </label>
                          <input
                            type="text"
                            value={formData.titre}
                            onChange={(e) => handleInputChange("titre", e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            placeholder={t('activities.form.titlePlaceholder', 'Ex: Réunion parents-professeurs')}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            {t('activities.form.description', 'Description')} *
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            rows={4}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all font-medium"
                            placeholder={t('activities.form.descriptionPlaceholder', 'Décrivez votre événement...')}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                              {t('activities.form.location', 'Lieu')} *
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                value={formData.lieu}
                                onChange={(e) => handleInputChange("lieu", e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                placeholder={t('activities.form.locationPlaceholder', 'Ex: Salle 101')}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                              {t('activities.form.status', 'Visibilité')}
                            </label>
                            <div className="relative">
                              <select
                                value={formData.visibility}
                                onChange={(e) => handleInputChange("visibility", e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all font-bold"
                              >
                                <option value="PUBLIC">🌍 Public (Tout le monde)</option>
                                <option value="PRIVATE">🔒 Privé (Classes spécifiques)</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-4.5 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                              {t('activities.form.startTime', 'Date & Heure Début')} *
                            </label>
                            <input
                              type="datetime-local"
                              value={formData.heureDebut}
                              onChange={(e) => handleInputChange("heureDebut", e.target.value)}
                              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                              {t('activities.form.endTime', 'Heure Fin (Optionnel)')}
                            </label>
                            <input
                              type="datetime-local"
                              value={formData.heureFin}
                              onChange={(e) => handleInputChange("heureFin", e.target.value)}
                              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-xs"
                            />
                          </div>
                        </div>

                        {formData.visibility === "PRIVATE" && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                              {t('activities.form.selectClasses', 'Classes Concernées')} *
                            </label>
                            {loadingClasses ? (
                              <div className="flex items-center space-x-2 py-4">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Recherche des classes...</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
                                {classes.map((cls) => (
                                  <label 
                                    key={cls.id} 
                                    className={`flex items-center space-x-2 p-3 rounded-xl border transition-all cursor-pointer ${
                                      formData.selectedClasses?.includes(cls.id)
                                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                        : 'bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-white/5'
                                    }`}
                                  >
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
                                      className="w-4 h-4 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-tighter truncate dark:text-white">{cls.nom || cls.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                            {t('activities.form.images', 'Photos & Vidéos')}
                          </label>
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/10 transition-all cursor-pointer group"
                          >
                            <div className="space-y-4">
                              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                {uploading ? (
                                  <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                                ) : (
                                  <Image className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-black text-sm uppercase tracking-widest text-gray-700 dark:text-gray-300">
                                  {t('activities.form.addImages', 'Ajouter des médias')}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                  Photos ou Vidéos (max 50Mo)
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
                          <div className="grid grid-cols-3 gap-3 pt-2">
                            {uploadedImages.map((media, index) => (
                              <div key={index} className="relative group aspect-square">
                                {media.type === 'VIDEO' ? (
                                  <video src={media.url} className="w-full h-full object-cover rounded-xl shadow-md" />
                                ) : (
                                  <img src={media.url} alt="Upload" className="w-full h-full object-cover rounded-xl shadow-md" />
                                )}
                                <button
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg hover:scale-110 transition-transform"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="sticky bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 p-6 flex items-center justify-between gap-4 z-20" style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom, 24px) + 24px)' : '24px' }}>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 py-4 text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all"
                      >
                        {t('common.actions.cancel', 'Annuler')}
                      </button>
                      <button
                        onClick={handleCreateEvent}
                        disabled={loading || uploading || !formData.titre || !formData.description || !formData.lieu || !formData.heureDebut || (formData.visibility === 'PRIVATE' && formData.selectedClasses.length === 0)}
                        className="flex-[2] py-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 disabled:grayscale disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                      >
                        {loading || uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{uploading ? 'Upload...' : 'Envoi...'}</span>
                          </>
                        ) : (
                          <span>{t('activities.actions.createEvent', 'Publier l\'Événement')}</span>
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
                ) : filteredActivities.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {activeTab === 'all' ? t('activities.noActivities.title', 'Aucune activité') : `Aucun contenu dans "${[
                        { key: 'user', label: 'Mes posts' },
                        { key: 'groups', label: 'Groupes' },
                        { key: 'events', label: 'Événements' },
                        { key: 'saved', label: 'Enregistrés' }
                      ].find(tab => tab.key === activeTab)?.label}"`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {activeTab === 'all' 
                        ? t('activities.noActivities.description', 'Créez votre premier événement')
                        : 'Essayez de changer de filtre ou créez du contenu'
                      }
                    </p>
                    {canCreateEvent && activeTab === 'all' && (
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
                  filteredActivities.map((activity) => (
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
                            {activity.user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-semibold text-gray-900 dark:text-white ${isMobile ? 'text-sm' : ''} truncate`}>
                                {activity.user.name}
                              </h3>
                              {activity.user.role && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full flex-shrink-0">
                                  {activity.user.role}
                                </span>
                              )}
                              {activity.user.classNames && activity.user.classNames.length > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full flex-shrink-0">
                                  {activity.user.classNames.join(', ')}
                                </span>
                              )}
                            </div>
                            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400`}>
                              {activity.timestamp}
                            </p>
                          </div>
                        </div>

                        {/* Post Title + Content */}
                        {activity.titre && (
                          <h4 className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-sm mb-1' : 'text-base mb-1.5'}`}>
                            {activity.titre}
                          </h4>
                        )}
                        {activity.content && (
                          <p className={`text-gray-700 dark:text-gray-300 ${isMobile ? 'text-xs mb-2' : 'text-sm mb-3'} whitespace-pre-wrap line-clamp-4`}>{activity.content}</p>
                        )}

                        {/* Event details badge */}
                        {activity.eventDetails?.location && (
                          <div className={`flex items-center gap-3 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 mb-1`}>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activity.eventDetails.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Media Gallery - Facebook-style grid */}
                      {activity.medias && activity.medias.length > 0 && (() => {
                        const medias = activity.medias;
                        const allImageUrls = medias.filter(m => m.type === 'IMAGE').map(m => m.url);
                        const MediaItem = ({ media, index, className, overlay }) => (
                          <div
                            className={`relative overflow-hidden cursor-pointer group ${className}`}
                            onClick={() => {
                              if (media.type === 'IMAGE') {
                                const idx = allImageUrls.indexOf(media.url);
                                openImagePreview(allImageUrls, idx !== -1 ? idx : 0);
                              }
                            }}
                          >
                            {media.type === 'VIDEO' ? (
                              <video src={media.url} controls playsInline className="w-full h-full object-cover" onClick={e => e.stopPropagation()} />
                            ) : (
                              <img src={media.url} alt={`media-${index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            )}
                            {overlay && (
                              <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">{overlay}</span>
                              </div>
                            )}
                          </div>
                        );

                        // 1 media
                        if (medias.length === 1) return (
                          <MediaItem media={medias[0]} index={0} className="w-full h-72 sm:h-96" />
                        );

                        // 2 medias
                        if (medias.length === 2) return (
                          <div className="flex gap-0.5 h-64 sm:h-80">
                            <MediaItem media={medias[0]} index={0} className="flex-1" />
                            <MediaItem media={medias[1]} index={1} className="flex-1" />
                          </div>
                        );

                        // 3 medias
                        if (medias.length === 3) return (
                          <div className="flex gap-0.5 h-64 sm:h-80">
                            <MediaItem media={medias[0]} index={0} className="flex-[2]" />
                            <div className="flex flex-col gap-0.5 flex-1">
                              <MediaItem media={medias[1]} index={1} className="flex-1" />
                              <MediaItem media={medias[2]} index={2} className="flex-1" />
                            </div>
                          </div>
                        );

                        // 4 medias
                        if (medias.length === 4) return (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex gap-0.5 h-48 sm:h-56">
                              <MediaItem media={medias[0]} index={0} className="flex-1" />
                              <MediaItem media={medias[1]} index={1} className="flex-1" />
                            </div>
                            <div className="flex gap-0.5 h-48 sm:h-56">
                              <MediaItem media={medias[2]} index={2} className="flex-1" />
                              <MediaItem media={medias[3]} index={3} className="flex-1" />
                            </div>
                          </div>
                        );

                        // 5+ medias
                        const remaining = medias.length - 4;
                        return (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex gap-0.5 h-48 sm:h-56">
                              <MediaItem media={medias[0]} index={0} className="flex-1" />
                              <MediaItem media={medias[1]} index={1} className="flex-1" />
                            </div>
                            <div className="flex gap-0.5 h-48 sm:h-56">
                              <MediaItem media={medias[2]} index={2} className="flex-1" />
                              <MediaItem media={medias[3]} index={3} className="flex-1" />
                              <MediaItem
                                media={medias[4]}
                                index={4}
                                className="flex-1"
                                overlay={remaining > 0 ? `+${remaining}` : null}
                              />
                            </div>
                          </div>
                        );
                      })()}

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

      {/* Image Preview Modal */}
      {imagePreview.isOpen && (
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] rounded-xl"
          onClick={closeImagePreview}
        >
          <div
            className="relative w-full h-full flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2.5 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {imagePreview.images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage("prev")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2.5 rounded-full transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateImage("next")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2.5 rounded-full transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <img
              src={imagePreview.images[imagePreview.currentIndex]}
              alt={`Preview ${imagePreview.currentIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            {imagePreview.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium">
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