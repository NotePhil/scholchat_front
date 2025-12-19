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
  const [staticActivities] = useState([
    {
      id: 1,
      user: { name: "Jean Dupont", avatar: "JD" },
      content:
        "Excellente conférence sur l'IA aujourd'hui ! Les nouvelles technologies nous ouvrent de nombreuses perspectives.",
      timestamp: "Il y a 2 heures",
      likes: 12,
      isLiked: false,
      participants: 5,
      isParticipating: false,
      images: ["https://picsum.photos/600/400?random=1"],
      comments: [
        {
          id: 1,
          user: "Marie Martin",
          content: "Très intéressant ! Merci pour le partage",
          time: "Il y a 1h",
        },
        {
          id: 2,
          user: "Paul Kenzo",
          content: "J'aurais aimé y être présent",
          time: "Il y a 30min",
        },
      ],
      showComments: false,
    },
    {
      id: 2,
      user: { name: "Sophie Laurent", avatar: "SL" },
      content:
        "Nouveau projet de recherche lancé ! Nous recherchons des étudiants motivés pour rejoindre notre équipe.",
      timestamp: "Il y a 4 heures",
      likes: 8,
      isLiked: true,
      participants: 12,
      isParticipating: true,
      images: [
        "https://picsum.photos/600/400?random=2",
        "https://picsum.photos/600/400?random=3",
      ],
      comments: [
        {
          id: 1,
          user: "Alex Chen",
          content: "Je suis très intéressé ! Comment puis-je postuler ?",
          time: "Il y a 2h",
        },
      ],
      showComments: false,
    },
    {
      id: 3,
      user: { name: "Dr. Martin Rousseau", avatar: "MR" },
      content:
        "Félicitations à tous les étudiants qui ont participé au hackathon ce weekend ! Les projets présentés étaient remarquables.",
      timestamp: "Il y a 1 jour",
      likes: 25,
      isLiked: false,
      participants: 8,
      isParticipating: false,
      images: [
        "https://picsum.photos/600/400?random=4",
        "https://picsum.photos/600/400?random=5",
        "https://picsum.photos/600/400?random=6",
      ],
      comments: [],
      showComments: false,
    },
    {
      id: 4,
      user: { name: "Emma Wilson", avatar: "EW" },
      content:
        "Sortie étudiante au musée des sciences ! Une journée enrichissante avec de belles découvertes.",
      timestamp: "Il y a 2 jours",
      likes: 18,
      isLiked: false,
      participants: 15,
      isParticipating: false,
      images: [
        "https://picsum.photos/600/400?random=7",
        "https://picsum.photos/600/400?random=8",
        "https://picsum.photos/600/400?random=9",
        "https://picsum.photos/600/400?random=10",
      ],
      comments: [
        {
          id: 1,
          user: "Lucas Martin",
          content: "J'aurais aimé être là !",
          time: "Il y a 1 jour",
        },
      ],
      showComments: false,
    },
    {
      id: 5,
      user: { name: "Prof. Claire Dubois", avatar: "CD" },
      content:
        "Présentation des projets de fin d'année. Bravo à tous les étudiants pour leur créativité et leur travail acharné !",
      timestamp: "Il y a 3 jours",
      likes: 32,
      isLiked: true,
      participants: 22,
      isParticipating: true,
      images: [
        "https://picsum.photos/600/400?random=11",
        "https://picsum.photos/600/400?random=12",
        "https://picsum.photos/600/400?random=13",
        "https://picsum.photos/600/400?random=14",
        "https://picsum.photos/600/400?random=15",
      ],
      comments: [
        {
          id: 1,
          user: "Sarah Johnson",
          content: "Merci pour cette belle expérience !",
          time: "Il y a 2 jours",
        },
        {
          id: 2,
          user: "Tom Anderson",
          content: "Les projets étaient impressionnants",
          time: "Il y a 2 jours",
        },
      ],
      showComments: false,
    },
    {
      id: 6,
      user: { name: "Association Étudiante", avatar: "AE" },
      content:
        "Événement de networking réussi ! Merci à tous les participants et aux entreprises partenaires.",
      timestamp: "Il y a 4 jours",
      likes: 45,
      isLiked: false,
      participants: 35,
      isParticipating: false,
      images: [
        "https://picsum.photos/600/400?random=16",
        "https://picsum.photos/600/400?random=17",
        "https://picsum.photos/600/400?random=18",
        "https://picsum.photos/600/400?random=19",
        "https://picsum.photos/600/400?random=20",
        "https://picsum.photos/600/400?random=21",
      ],
      comments: [
        {
          id: 1,
          user: "Marie Leroy",
          content: "Super événement, très enrichissant !",
          time: "Il y a 3 jours",
        },
      ],
      showComments: false,
    },
  ]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoadingActivities(true);
      const events = await activityFeedService.getEvents();
      
      const activitiesWithImages = await Promise.all(
        events.map(async (event) => {
          const images = [];
          
          if (event.medias && event.medias.length > 0) {
            for (const media of event.medias) {
              if (media.mediaType === 'IMAGE' && media.filePath) {
                try {
                  const downloadUrl = await minioS3Service.getMediaUrlByPath(media.filePath);
                  if (downloadUrl) {
                    images.push(downloadUrl);
                  }
                } catch (error) {
                  console.error(`Error getting image URL for ${media.filePath}:`, error);
                }
              }
            }
          }
          
          const likes = event.interactions?.filter(i => i.type === 'LIKE').length || 0;
          const participants = event.participantsIds?.length || 0;
          
          return {
            id: event.id,
            user: { name: "Organisateur", avatar: "O" },
            content: `${event.titre} - ${event.description}`,
            timestamp: new Date(event.heureDebut).toLocaleString('fr-FR'),
            likes,
            isLiked: false,
            participants,
            isParticipating: false,
            images,
            comments: [],
            showComments: false,
            eventDetails: {
              title: event.titre,
              location: event.lieu,
              startTime: event.heureDebut,
              endTime: event.heureFin,
              status: event.etat
            }
          };
        })
      );
      
      setActivities([...activitiesWithImages, ...staticActivities]);
    } catch (error) {
      console.error('Error loading events:', error);
      setActivities(staticActivities);
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
    createurId: "user-id-123",
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

  const handleLike = (activityId) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              isLiked: !activity.isLiked,
              likes: activity.isLiked ? activity.likes - 1 : activity.likes + 1,
            }
          : activity
      )
    );
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

  const addComment = (activityId) => {
    const comment = newComment[activityId];
    if (!comment?.trim()) return;

    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              comments: [
                ...activity.comments,
                {
                  id: Date.now(),
                  user: "Vous",
                  content: comment,
                  time: "À l'instant",
                },
              ],
            }
          : activity
      )
    );
    setNewComment((prev) => ({ ...prev, [activityId]: "" }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      alert('Veuillez sélectionner des fichiers image (JPG, PNG, GIF)');
      return;
    }

    setUploading(true);

    try {
      for (const file of imageFiles) {
        if (!file.name || file.name.trim() === "") {
          console.error("Fichier sans nom valide:", file);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} est trop volumineux (max 5MB)`);
          continue;
        }

        try {
          const timestamp = Date.now() + Math.random();
          const extension = file.name.split(".").pop();
          const uniqueFileName = `event_image_${timestamp}.${extension}`;

          const previewUrl = URL.createObjectURL(file);

          const imageData = {
            id: timestamp,
            fileName: uniqueFileName,
            originalFileName: file.name,
            filePath: `temp/${uniqueFileName}`,
            type: "IMAGE",
            contentType: file.type,
            size: file.size,
            previewUrl: previewUrl,
            uploadedAt: new Date().toISOString(),
            file: file,
          };

          setUploadedImages((prev) => [...prev, imageData]);
        } catch (error) {
          console.error(`Erreur traitement ${file.name}:`, error);
          alert(`Erreur lors du traitement de ${file.name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Erreur générale de traitement:", error);
      alert("Erreur lors du traitement des images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (imageId) => {
    const imageToRemove = uploadedImages.find((img) => img.id === imageId);
    if (imageToRemove && imageToRemove.previewUrl) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleCreateEvent = async () => {
    if (!formData.titre || !formData.description || !formData.lieu || !formData.heureDebut || !formData.heureFin) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Create event without media
      const eventData = {
        titre: formData.titre,
        description: formData.description,
        lieu: formData.lieu,
        etat: formData.etat,
        heureDebut: formData.heureDebut,
        heureFin: formData.heureFin,
        createurId: formData.createurId,
        participantsIds: [],
        medias: [],
        interactions: []
      };

      const createdEvent = await activityFeedService.createEvent(eventData);

      // Step 2: Upload images using minioS3Service.uploadFile
      const uploadedMedia = [];
      if (uploadedImages.length > 0) {
        setUploading(true);
        
        for (const img of uploadedImages) {
          try {
            const result = await minioS3Service.uploadFile(
              img.file,
              "IMAGE",
              "event_images"
            );
            
            uploadedMedia.push({
              fileName: result.fileName,
              filePath: result.filePath,
              contentType: result.contentType,
              fileSize: result.fileSize,
              mediaType: "IMAGE",
              bucketName: "scholchat",
              ownerId: formData.createurId
            });
          } catch (uploadError) {
            console.error(`Error uploading ${img.fileName}:`, uploadError);
          }
        }
        
        // Step 3: Update event with media
        if (uploadedMedia.length > 0) {
          await activityFeedService.editEvent(createdEvent.id, {
            ...eventData,
            medias: uploadedMedia
          });
        }
        
        setUploading(false);
      }

      // Add to activities list
      const newActivity = {
        id: createdEvent.id,
        user: { name: "Vous", avatar: "V" },
        content: `${formData.titre} - ${formData.description}`,
        timestamp: "À l'instant",
        likes: 0,
        isLiked: false,
        participants: 1,
        isParticipating: true,
        images: uploadedImages.map(img => img.previewUrl),
        comments: [],
        showComments: false
      };
      
      setActivities(prev => [newActivity, ...prev]);
      
      // Reset form
      setShowCreateForm(false);
      setFormData({
        titre: "",
        description: "",
        lieu: "",
        etat: "PLANIFIE",
        heureDebut: "",
        heureFin: "",
        createurId: "user-id-123"
      });
      setUploadedImages([]);
      
    } catch (error) {
      console.error('Error creating event:', error);
      alert(`Erreur lors de la création de l'événement: ${error.message}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative group">
                          <img
                            src={image.previewUrl}
                            alt={image.originalFileName}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate" title={image.originalFileName}>
                                {image.originalFileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(image.size / 1024).toFixed(1)} KB • Prêt à être uploadé
                              </p>
                            </div>
                            <button
                              onClick={() => removeImage(image.id)}
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
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-lg shadow-sm">
                {/* Post Header */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {activity.user.avatar}
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
                        className="w-full cursor-pointer"
                        onClick={() => openImagePreview(activity.images, 0)}
                      >
                        <img
                          src={activity.images[0]}
                          alt="Post image"
                          className="w-full h-96 object-cover"
                        />
                      </div>
                    )}

                    {activity.images.length === 2 && (
                      <div className="grid grid-cols-2 gap-1">
                        {activity.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Post image ${idx + 1}`}
                            className="w-full h-48 object-cover cursor-pointer"
                            onClick={() =>
                              openImagePreview(activity.images, idx)
                            }
                          />
                        ))}
                      </div>
                    )}

                    {activity.images.length === 3 && (
                      <div className="grid grid-cols-2 gap-1 h-96">
                        <img
                          src={activity.images[0]}
                          alt="Post image 1"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openImagePreview(activity.images, 0)}
                        />
                        <div className="grid grid-rows-2 gap-1">
                          <img
                            src={activity.images[1]}
                            alt="Post image 2"
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openImagePreview(activity.images, 1)}
                          />
                          <img
                            src={activity.images[2]}
                            alt="Post image 3"
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openImagePreview(activity.images, 2)}
                          />
                        </div>
                      </div>
                    )}

                    {activity.images.length >= 4 && (
                      <div className="grid grid-cols-2 gap-1">
                        {activity.images.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Post image ${idx + 1}`}
                            className="w-full h-48 object-cover cursor-pointer"
                            onClick={() =>
                              openImagePreview(activity.images, idx)
                            }
                          />
                        ))}
                        <div
                          className="relative cursor-pointer"
                          onClick={() => openImagePreview(activity.images, 3)}
                        >
                          <img
                            src={activity.images[3]}
                            alt="Post image 4"
                            className="w-full h-48 object-cover"
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
                          <span>{activity.likes} J'aime</span>
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        activity.isLiked
                          ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Heart
                        size={18}
                        className={activity.isLiked ? "fill-current" : ""}
                      />
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

                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
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
                        {activity.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {comment.user.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="bg-white rounded-lg px-3 py-2">
                                <p className="font-semibold text-sm text-gray-900">
                                  {comment.user}
                                </p>
                                <p className="text-gray-800">
                                  {comment.content}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 ml-3">
                                {comment.time}
                              </p>
                            </div>
                          </div>
                        ))}
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
            ))}
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
