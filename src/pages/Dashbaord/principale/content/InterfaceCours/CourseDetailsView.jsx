import React, { useState, useEffect } from 'react';
import { Modal, Button, Spin, Empty } from 'antd';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video,
  Download,
  Play,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  Circle,
  Star,
  MessageSquare,
  Share2,
  Eye,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Activity,
  ExternalLink,
  Target
} from 'lucide-react';
import { exerciseService } from '../../../../../services/exerciseService';

const CourseDetailsView = ({ courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [completedItems, setCompletedItems] = useState(() => {
    // Persist completion state per course in localStorage
    try {
      const saved = localStorage.getItem(`course_progress_${courseId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [courseFiles, setCourseFiles] = useState([]);
  const [minioFiles, setMinioFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");
  const [exercises, setExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      
      const { coursService } = await import('../../../../../services/CoursService');
      
      const courseData = await coursService.getCoursWithChapitres(courseId);
      console.log('Course data loaded:', courseData);
      
      const formattedCourse = {
        id: courseData.id,
        titre: courseData.titre || "Titre non disponible",
        description: courseData.description || "Description non disponible",
        redacteurId: courseData.redacteurId,
        instructeur: courseData.redacteurId ? "Professeur" : "Instructeur",
        duree: courseData.chapitres ? `${courseData.chapitres.length} chapitres` : "À déterminer",
        niveau: courseData.etat || "Publié",
        totalStudents: 0,
        progress: 0
      };
      
      const formattedChapters = courseData.chapitres ? courseData.chapitres.map((chapitre, index) => ({
        id: chapitre.id || `ch_${index + 1}`,
        titre: chapitre.titre || `Chapitre ${index + 1}`,
        description: chapitre.description || "",
        duree: "À déterminer",
        completed: false,
        locked: false,
        ordre: chapitre.ordre || index + 1,
        contenu: chapitre.contenu || "",
        imageUrl: chapitre.imageUrl || null,
        materials: [
          {
            id: `${chapitre.id || `ch_${index + 1}`}_content`,
            type: 'document',
            titre: 'Contenu du chapitre',
            size: chapitre.contenu ? `${Math.ceil(chapitre.contenu.length / 1024)} KB` : '0 KB',
            completed: false
          }
        ]
      })) : [];
      
      setCourse(formattedCourse);
      setChapters(formattedChapters);
      setExpandedChapters(new Set(formattedChapters.map(ch => ch.id)));
      
      // Extract embedded files from chapter HTML content
      extractFilesFromChapters(formattedChapters);
      
      // Also fetch professor's uploaded files from MinIO
      if (courseData.redacteurId) {
        fetchMinioFiles(courseData.redacteurId);
      }
      
      // Fetch exercises for this course
      fetchCourseExercises();
    } catch (error) {
      console.error('Erreur lors du chargement du cours:', error);
      setCourse({
        id: courseId,
        titre: "Cours non trouvé",
        description: "Impossible de charger les détails du cours",
        instructeur: "Inconnu",
        duree: "0",
        niveau: "Inconnu",
        rating: 0,
        totalStudents: 0,
        progress: 0
      });
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract files from chapters - accepts chapters array directly to avoid stale state
  const extractFilesFromChapters = (chaptersData) => {
    try {
      setFilesLoading(true);
      console.log('Extracting files from', chaptersData.length, 'chapters');
      
      const extractedFiles = [];
      
      (chaptersData || []).forEach((chapter, chapterIndex) => {
        if (chapter.contenu) {
          // Create a temporary div to parse HTML content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = chapter.contenu;
          
          // Extract images
          const images = tempDiv.querySelectorAll('img');
          images.forEach((img, imgIndex) => {
            if (img.src && img.src.startsWith('http')) {
              extractedFiles.push({
                id: `img_${chapterIndex}_${imgIndex}`,
                fileName: img.alt || `Image_${chapterIndex}_${imgIndex}.jpg`,
                filePath: img.src,
                contentType: 'image/jpeg',
                fileSize: 0,
                documentType: 'chapter_image',
                chapterTitle: chapter.titre,
                type: 'image'
              });
            }
          });
          
          // Extract video elements
          const videos = tempDiv.querySelectorAll('video source, video[src]');
          videos.forEach((video, vidIndex) => {
            const src = video.src || video.getAttribute('src');
            if (src && src.startsWith('http')) {
              extractedFiles.push({
                id: `vid_${chapterIndex}_${vidIndex}`,
                fileName: `Video_${chapterIndex}_${vidIndex}.mp4`,
                filePath: src,
                contentType: 'video/mp4',
                fileSize: 0,
                documentType: 'chapter_video',
                chapterTitle: chapter.titre,
                type: 'video'
              });
            }
          });
          
          // Extract file links
          const links = tempDiv.querySelectorAll('a[href]');
          links.forEach((link, linkIndex) => {
            if (link.href && link.href.startsWith('http')) {
              const fileName = link.textContent || `Document_${chapterIndex}_${linkIndex}`;
              const extension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
              let contentType = 'application/octet-stream';
              let type = 'document';
              
              if (['pdf'].includes(extension)) contentType = 'application/pdf';
              else if (['doc', 'docx'].includes(extension)) contentType = 'application/msword';
              else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                contentType = `image/${extension}`;
                type = 'image';
              }
              else if (['mp4', 'avi', 'mov', 'webm'].includes(extension)) {
                contentType = `video/${extension}`;
                type = 'video';
              }
              
              extractedFiles.push({
                id: `link_${chapterIndex}_${linkIndex}`,
                fileName: fileName,
                filePath: link.href,
                contentType: contentType,
                fileSize: 0,
                documentType: 'chapter_document',
                chapterTitle: chapter.titre,
                type: type
              });
            }
          });
        }
      });
      
      console.log('Extracted files from chapters:', extractedFiles.length);
      setCourseFiles(extractedFiles);
    } catch (error) {
      console.error('Error extracting course files:', error);
      setCourseFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  // Fetch exercises for this course
  const fetchCourseExercises = async () => {
    try {
      setExercisesLoading(true);
      const courseExercises = await exerciseService.getExercisesByCours(courseId);
      console.log('Exercises for course:', courseExercises);
      if (Array.isArray(courseExercises)) {
        setExercises(courseExercises.map(exo => ({
          ...exo,
          type: 'exercise',
          titre: exo.nom || 'Exercice sans nom'
        })));
      }
    } catch (error) {
      console.warn('Could not fetch course exercises:', error.message);
      setExercises([]);
    } finally {
      setExercisesLoading(false);
    }
  };

  // Fetch uploaded files from MinIO for the professor
  const fetchMinioFiles = async (professorId) => {
    try {
      const { minioS3Service } = await import('../../../../../services/minioS3');
      const mediaFiles = await minioS3Service.getUserMedia(professorId);
      console.log('MinIO files for professor:', mediaFiles?.length || 0);
      
      if (Array.isArray(mediaFiles) && mediaFiles.length > 0) {
        const formatted = mediaFiles.map((media, index) => ({
          id: media.id || `minio_${index}`,
          fileName: media.fileName || media.originalFileName || `Fichier_${index}`,
          filePath: media.filePath || media.objectKey || '',
          contentType: media.contentType || 'application/octet-stream',
          fileSize: media.fileSize || 0,
          documentType: media.documentType || media.mediaType || 'general',
          chapterTitle: null,
          type: getFileType(media.contentType, media.fileName),
          source: 'minio',
          mediaId: media.id
        }));
        setMinioFiles(formatted);
      }
    } catch (error) {
      console.warn('Could not fetch MinIO files:', error.message);
      setMinioFiles([]);
    }
  };

  const getFileType = (contentType, fileName) => {
    if (contentType?.startsWith('image/') || fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (contentType?.startsWith('video/') || fileName?.match(/\.(mp4|avi|mov|webm)$/i)) return 'video';
    if (contentType?.includes('pdf') || fileName?.endsWith('.pdf')) return 'pdf';
    return 'document';
  };

  const handleFileDownload = async (file) => {
    try {
      showToast('Téléchargement en cours...', 'info');
      
      // Try MinIO download first for MinIO-sourced files
      if (file.source === 'minio' && file.filePath) {
        try {
          const { minioS3Service } = await import('../../../../../services/minioS3');
          await minioS3Service.downloadFileByPath(file.filePath);
          showToast('Fichier téléchargé avec succès!', 'success');
          return;
        } catch (minioErr) {
          console.warn('MinIO download failed, trying direct link:', minioErr);
        }
      }
      
      if (file.filePath && file.filePath.startsWith('http')) {
        const link = document.createElement('a');
        link.href = file.filePath;
        link.download = file.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Téléchargement lancé!', 'success');
      } else if (file.mediaId) {
        // Try download by media ID
        try {
          const { minioS3Service } = await import('../../../../../services/minioS3');
          const downloadData = await minioS3Service.generateDownloadUrl(file.mediaId);
          if (downloadData?.downloadUrl) {
            window.open(downloadData.downloadUrl, '_blank');
            showToast('Fichier téléchargé!', 'success');
          }
        } catch (err) {
          showToast('Lien de téléchargement non disponible', 'error');
        }
      } else {
        showToast('Lien de téléchargement non disponible', 'error');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast(`Erreur: ${error.message}`, 'error');
    }
  };

  const handleFilePreview = async (file) => {
    try {
      const isVideo = file.contentType?.startsWith('video/') || 
                    file.fileName?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i) ||
                    file.type === 'video';

      // For MinIO files, get a fresh download URL
      let url = file.filePath;
      if (file.source === 'minio' && file.filePath) {
        try {
          const { minioS3Service } = await import('../../../../../services/minioS3');
          const downloadData = await minioS3Service.generateDownloadUrlByPath(file.filePath);
          url = downloadData?.downloadUrl || file.filePath;
        } catch (err) {
          console.warn('Could not get MinIO URL, using stored path');
        }
      }

      if (isVideo && url) {
        setCurrentVideoUrl(url);
        setCurrentVideoTitle(file.fileName || "Vidéo");
        setVideoModalVisible(true);
        return;
      }

      if (url && url.startsWith('http')) {
        window.open(url, '_blank');
      } else if (file.mediaId) {
        const { minioS3Service } = await import('../../../../../services/minioS3');
        const downloadData = await minioS3Service.generateDownloadUrl(file.mediaId);
        if (downloadData?.downloadUrl) {
          window.open(downloadData.downloadUrl, '_blank');
        }
      } else {
        showToast('Aperçu non disponible', 'error');
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      showToast(`Erreur: ${error.message}`, 'error');
    }
  };

  const handlePlayVideo = (material) => {
    // If material has an ID that matches a course file, use that URL
    const file = courseFiles.find(f => f.fileName === material.titre || f.id === material.id);
    const url = file?.filePath || material.url || material.filePath;
    
    if (url) {
      setCurrentVideoUrl(url);
      setCurrentVideoTitle(material.titre || "Vidéo");
      setVideoModalVisible(true);
    } else {
      alert("Source vidéo non trouvée");
    }
  };

  const getFileIcon = (fileName, contentType) => {
    if (contentType?.startsWith('image/') || fileName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return <Image className="w-4 h-4" />;
    }
    if (contentType?.includes('pdf') || fileName?.endsWith('.pdf')) {
      return <FileText className="w-4 h-4" />;
    }
    if (contentType?.startsWith('video/') || fileName?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
      return <Video className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getFileTypeColor = (fileName, contentType) => {
    if (contentType?.startsWith('image/') || fileName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return 'text-purple-600 bg-purple-50';
    }
    if (contentType?.includes('pdf') || fileName?.endsWith('.pdf')) {
      return 'text-red-600 bg-red-50';
    }
    if (contentType?.startsWith('video/') || fileName?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
      return 'text-blue-600 bg-blue-50';
    }
    return 'text-gray-600 bg-gray-50';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Taille inconnue';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderChapterContent = (content) => {
    if (!content) return <p className="text-gray-500 italic">Aucun contenu disponible</p>;
    
    return (
      <div className="prose max-w-none">
        <div 
          className="text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    );
  };

  const toggleChapter = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleItemCompletion = (itemId) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
      showToast('Élément marqué comme non terminé', 'info');
    } else {
      newCompleted.add(itemId);
      showToast('✅ Chapitre marqué comme terminé!', 'success');
    }
    setCompletedItems(newCompleted);
    // Persist to localStorage
    try {
      localStorage.setItem(`course_progress_${courseId}`, JSON.stringify([...newCompleted]));
    } catch (e) { console.warn('Could not save progress'); }
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'exercise': return <Target className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getItemTypeColor = (type) => {
    switch (type) {
      case 'video': return 'text-red-700 bg-red-50 border-red-100';
      case 'document': return 'text-blue-700 bg-blue-50 border-blue-100';
      case 'exercise': return 'text-amber-700 bg-amber-50 border-amber-100';
      default: return 'text-gray-700 bg-gray-50 border-gray-100';
    }
  };

  const handleExerciseClick = (exo) => {
    // If we have a dedicated exercise view or modal, open it here
    // For now, show message
    showToast(`Ouverture de l'exercice: ${exo.nom}`, 'info');
    // If there is any external link for the exercise, we could use that
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-gray-600">Chargement du cours...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux cours</span>
          </button>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="relative p-8 h-full flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-4 py-1.5 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20 uppercase tracking-widest shadow-lg ${
                    course?.restriction === 'PUBLIC' ? 'bg-emerald-500/40' : 'bg-blue-500/30'
                  }`}>
                    {course?.restriction || "Cours"}
                  </span>
                  <span className="px-4 py-1.5 bg-purple-500/30 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20 uppercase tracking-widest shadow-lg">
                    {course?.niveau || "Tous niveaux"}
                  </span>
                </div>
                <div className="text-white transform transition-all duration-500 translate-y-0 group-hover:-translate-y-2">
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight drop-shadow-2xl">
                    {course?.titre || "Titre du cours"}
                  </h1>
                  <p className="text-blue-50 text-xl mb-6 max-w-2xl line-clamp-2 opacity-90 font-medium">
                    {course?.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                      <BookOpen className="w-4 h-4 text-blue-300" />
                      <span className="font-semibold">{chapters.length} chapitres</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                      <Clock className="w-4 h-4 text-purple-300" />
                      <span className="font-semibold">{course?.duree || "12h 30min"}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                      <FileText className="w-4 h-4 text-emerald-300" />
                      <span className="font-semibold">{courseFiles.length} fichiers ressources</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progression du cours</span>
                <span className="text-sm font-bold text-blue-600">
                  {chapters.length > 0 ? Math.round((completedItems.size / Math.max(chapters.reduce((acc, ch) => acc + (ch.materials?.length || 0), 0), 1)) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${chapters.length > 0 ? Math.round((completedItems.size / Math.max(chapters.reduce((acc, ch) => acc + (ch.materials?.length || 0), 0), 1)) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'content'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Contenu du cours
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Aperçu
              </button>
              <button
                onClick={() => setActiveTab('discussions')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'discussions'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Discussions
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'content' && (
              <div className="space-y-4">
                {chapters.length === 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun chapitre</h3>
                    <p className="text-gray-600">Ce cours ne contient pas encore de chapitres.</p>
                  </div>
                )}
                
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div
                      className={`p-6 cursor-pointer transition-all duration-200 ${
                        chapter.locked ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => !chapter.locked && toggleChapter(chapter.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${chapter.completed ? 'bg-green-100' : 'bg-blue-100'}`}>
                            {chapter.completed ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : chapter.locked ? (
                              <Lock className="w-6 h-6 text-gray-400" />
                            ) : (
                              <BookOpen className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className={`text-lg font-bold ${chapter.locked ? 'text-gray-400' : 'text-gray-900'}`}>
                              {chapter.titre}
                            </h3>
                            <p className={`text-sm ${chapter.locked ? 'text-gray-400' : 'text-gray-600'}`}>
                              {chapter.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`text-xs ${chapter.locked ? 'text-gray-400' : 'text-gray-500'}`}>
                                {chapter.duree}
                              </span>
                              <span className={`text-xs ${chapter.locked ? 'text-gray-400' : 'text-gray-500'}`}>
                                {chapter.materials.length} éléments
                              </span>
                            </div>
                          </div>
                        </div>
                        {!chapter.locked && (
                          <div className="flex items-center space-x-2">
                            {expandedChapters.has(chapter.id) ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {expandedChapters.has(chapter.id) && !chapter.locked && (
                      <div className="border-t bg-gray-50">
                        <div className="p-6 space-y-4">
                          {/* Chapter Content */}
                          {chapter.contenu && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                                Contenu du chapitre
                              </h4>
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                {renderChapterContent(chapter.contenu)}
                              </div>
                            </div>
                          )}
                          
                          {/* Course Files Section */}
                          {courseFiles.length > 0 && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-green-600" />
                                Fichiers du chapitre ({courseFiles.filter(f => f.chapterTitle === chapter.titre).length})
                              </h4>
                              
                              {filesLoading ? (
                                <div className="text-center py-4">
                                  <div className="inline-flex items-center space-x-2 text-gray-600">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                                    <span>Extraction des fichiers...</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {courseFiles
                                    .filter(file => file.chapterTitle === chapter.titre)
                                    .map((file, index) => (
                                    <div
                                      key={file.id || index}
                                      className="bg-white rounded-lg p-3 border hover:shadow-md transition-all duration-200"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                          <div className={`p-2 rounded-lg ${getFileTypeColor(file.fileName, file.contentType)}`}>
                                            {getFileIcon(file.fileName, file.contentType)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-gray-900 text-sm truncate" title={file.fileName}>
                                              {file.fileName}
                                            </h5>
                                            <p className="text-xs text-gray-500">
                                              {file.type === 'image' ? 'Image' : 'Document'}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-1 ml-2">
                                          <button
                                            onClick={() => handleFilePreview(file)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Ouvrir"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleFileDownload(file)}
                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                            title="Télécharger"
                                          >
                                            <Download className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Chapter Materials */}
                          {chapter.materials && chapter.materials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer"
                            >
                              <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-lg ${getItemTypeColor(material.type)}`}>
                                  {getItemIcon(material.type)}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{material.titre}</h4>
                                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                                    {material.duree && (
                                      <span className="flex items-center space-x-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{material.duree}</span>
                                      </span>
                                    )}
                                    {material.size && (
                                      <span className="flex items-center space-x-1">
                                        <FileText className="w-3 h-3" />
                                        <span>{material.size}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                {material.type === 'video' && (
                                  <button 
                                    onClick={() => handlePlayVideo(material)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                )}
                                {material.type === 'document' && (
                                  <button 
                                    onClick={() => handleFileDownload({ filePath: material.url, fileName: material.titre })}
                                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItemCompletion(material.id);
                                  }}
                                  className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
                                  title={completedItems.has(material.id) ? "Marquer comme non terminé" : "Marquer comme terminé"}
                                >
                                  {completedItems.has(material.id) || material.completed ? (
                                    <div className="relative">
                                      <CheckCircle className="w-7 h-7 text-emerald-500 fill-emerald-50 drop-shadow-sm transition-transform duration-300 group-hover:rotate-12" />
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                                    </div>
                                  ) : (
                                    <Circle className="w-7 h-7 text-gray-300 hover:text-blue-400 transition-colors duration-300" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          {/* Exercises Section specific to course but displayed here for context */}
                          {exercisesLoading ? (
                            <div className="flex justify-center py-4">
                              <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
                            </div>
                          ) : exercises.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <h4 className="text-sm font-bold text-amber-700 mb-3 flex items-center">
                                <Target className="w-4 h-4 mr-2" />
                                EXERCICES COMPLÉMENTAIRES
                              </h4>
                              <div className="space-y-2">
                                {exercises.map((exo) => (
                                  <div
                                    key={exo.id}
                                    className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100 hover:border-amber-300 transition-all cursor-pointer group"
                                    onClick={() => handleExerciseClick(exo)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Target className="w-4 h-4 text-amber-600" />
                                      </div>
                                      <div>
                                        <Text strong className="text-amber-900 block">{exo.nom}</Text>
                                        <Text type="secondary" className="text-xs">{exo.description || 'Pratiquez vos connaissances'}</Text>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                        exo.restriction === 'PUBLIC' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        {exo.restriction}
                                      </span>
                                      <button className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Combined Resources Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Ressources et fichiers ({courseFiles.length + minioFiles.length})
                    </h4>
                    <span className="text-xs text-gray-400 italic">
                      Les fichiers inclus dans les chapitres et les documents joints
                    </span>
                  </div>
                  
                  {filesLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center space-x-3 text-blue-600">
                        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="font-medium">Chargement des fichiers...</span>
                      </div>
                    </div>
                  ) : (courseFiles.length + minioFiles.length > 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...courseFiles, ...minioFiles].map((file, index) => (
                        <div
                          key={file.id || index}
                          className="group relative bg-gray-50 rounded-xl p-4 border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-3 rounded-xl ${getFileTypeColor(file.fileName, file.contentType)} group-hover:scale-110 transition-transform`}>
                              {getFileIcon(file.fileName, file.contentType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-gray-900 text-sm truncate pr-16" title={file.fileName}>
                                {file.fileName || 'Fichier sans nom'}
                              </h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs font-medium text-gray-500 uppercase">
                                  {file.source === 'minio' ? 'Document' : (file.type || 'Lien')}
                                </span>
                                {file.fileSize > 0 && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</span>
                                  </>
                                )}
                              </div>
                              {file.chapterTitle && (
                                <p className="text-[10px] text-blue-500 mt-1 font-medium bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                                  Dans: {file.chapterTitle}
                                </p>
                              )}
                            </div>
                            
                            <div className="absolute top-4 right-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleFilePreview(file)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white shadow-sm border border-blue-100"
                                title="Prévisualiser"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleFileDownload(file)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors bg-white shadow-sm border border-green-100"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Aucun fichier joint trouvé</p>
                      <p className="text-sm text-gray-400 mt-1">Les fichiers du professeur apparaîtront ici.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
                  À propos du cours
                </h2>
                <div className="prose max-w-none prose-blue">
                  <div className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-100 italic text-blue-900 quote">
                    {course?.description || "Aucune description détaillée disponible pour ce cours."}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Objectifs et apprentissage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Maitrise des concepts abordés",
                      "Application pratique immédiate",
                      "Validation des acquis par exercices",
                      "Accès illimité aux ressources"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 bg-white border border-gray-100 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'discussions' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Discussions</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Nouvelle discussion
                  </button>
                </div>
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune discussion</h3>
                  <p className="text-gray-600">Soyez le premier à démarrer une discussion sur ce cours.</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informations du cours</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Instructeur</span>
                  <span className="font-medium text-gray-900">{course?.instructeur}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Niveau</span>
                  <span className="font-medium text-gray-900">{course?.niveau}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Durée</span>
                  <span className="font-medium text-gray-900">{course?.duree}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Étudiants</span>
                  <span className="font-medium text-gray-900">{course?.totalStudents}</span>
                </div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 group hover:translate-y-[-4px] transition-transform">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Votre progression
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Éléments terminés</span>
                  <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                    {completedItems.size}/{chapters.length + (chapters.reduce((acc, ch) => acc + (ch.materials?.length || 0), 0) || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Statut</span>
                  <span className="font-medium text-blue-600">
                    {completedItems.size === 0 ? "Non commencé" : 
                     completedItems.size >= chapters.length ? "En bonne voie" : "En cours"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Dernière activité</span>
                  <span className="font-medium text-gray-900">Aujourd'hui</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-600 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-[-16px]"></div>
              <h4 className="font-bold mb-2">Besoin d'aide ?</h4>
              <p className="text-blue-100 text-sm mb-4">Contactez votre professeur pour toute question sur le contenu.</p>
              <button className="w-full py-2 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                Contacter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 z-[1000] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' ? 'bg-green-600' : 
          toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`}>
          {toast.type === 'success' ? <CheckCircle className="w-6 h-6" /> : 
           toast.type === 'info' ? <Clock className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}
      {/* Video Player Modal */}
      <Modal
        title={currentVideoTitle}
        open={videoModalVisible}
        onCancel={() => {
          setVideoModalVisible(false);
          setCurrentVideoUrl("");
        }}
        footer={null}
        width={1000}
        centered
        destroyOnClose
        styles={{ body: { padding: 0, backgroundColor: "#000" } }}
      >
        <div className="aspect-video bg-black flex items-center justify-center">
          {currentVideoUrl ? (
            <video 
              src={currentVideoUrl} 
              controls 
              autoPlay 
              className="w-full h-full"
              style={{ maxHeight: "calc(100vh - 200px)" }}
            />
          ) : (
            <div className="text-white flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2"></div>
              <span>Chargement de la vidéo...</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CourseDetailsView;