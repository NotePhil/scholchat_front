import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video,
  Download,
  Clock,
  Calendar,
  CheckCircle,
  Circle,
  Eye,
  ChevronDown,
  ChevronRight,
  Award,
  AlertTriangle,
  Image,
  File,
  TrendingUp
} from 'lucide-react';
import DocumentViewer from '../../../../../components/viewers/DocumentViewer';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

const fetchWithAuth = async (url) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res;
};

// Extract relative MinIO path from a direct storage URL
const toRelativePath = (raw) => {
  try {
    const { pathname } = new URL(raw);
    const idx = pathname.indexOf('users/');
    if (idx >= 0) return pathname.slice(idx);
    const parts = pathname.split('/');
    return parts.length > 1 ? parts.slice(1).join('/') : pathname;
  } catch { return raw; }
};

// Returns true for direct MinIO/S3 storage URLs that need proxying
const isStorageUrl = (url) => {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return false;
  if (url.startsWith(API_BASE)) return false; // already a proxy URL
  return url.startsWith('http');
};

const processHtmlImages = async (html, blobUrls) => {
  if (!html) return html;
  const div = document.createElement('div');
  div.innerHTML = html;

  // Process images that are backend proxy URLs with auth
  const imgs = div.querySelectorAll('img');
  await Promise.all(Array.from(imgs).map(async (img) => {
    const src = img.getAttribute('src') || '';
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    if (src.startsWith(API_BASE) && src.includes('/media/')) {
      try {
        const res = await fetchWithAuth(src);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobUrls.push(blobUrl);
        img.src = blobUrl;
      } catch (e) {
        console.warn('Could not load image with auth:', src);
      }
    }
  }));

  // Fix video/img src to absolute for any relative /media/ paths
  div.querySelectorAll('video[src], video source[src]').forEach((el) => {
    const src = el.getAttribute('src') || '';
    if (src && !src.startsWith('http') && !src.startsWith('blob:')) {
      el.setAttribute('src', `${API_BASE}${src}`);
    }
  });

  return div.innerHTML;
};

// Replace all direct storage URLs in HTML with fresh backend proxy URLs
// Also fixes videos with blob src by finding the real media via the caption filename
const processStorageUrls = async (html, redacteurId) => {
  if (!html) return html;
  const { minioS3Service } = await import('../../../../../services/minioS3');

  // 1. Replace direct MinIO storage URLs with proxy URLs
  const urlsToRefresh = new Set();
  const regex = /(src|href)="(https?:\/\/[^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (isStorageUrl(match[2])) urlsToRefresh.add(match[2]);
  }
  let processed = html;
  for (const original of urlsToRefresh) {
    try {
      const relativePath = toRelativePath(original);
      const downloadData = await minioS3Service.generateDownloadUrlByPath(relativePath);
      if (downloadData?.downloadUrl) {
        processed = processed.split(original).join(downloadData.downloadUrl);
      }
    } catch { /* keep original */ }
  }

  // 2. Fix video elements with blob: src (saved with blob URL — look up by caption filename)
  if (processed.includes('src="blob:') && redacteurId) {
    try {
      const div = document.createElement('div');
      div.innerHTML = processed;
      const videos = div.querySelectorAll('video[src^="blob:"]');
      await Promise.all(Array.from(videos).map(async (video) => {
        const container = video.parentElement;
        const caption = container?.querySelector('div');
        const captionText = caption?.textContent?.trim() || '';
        if (!captionText) return;
        // Use precise filename lookup via backend
        const media = await minioS3Service.findMediaByFileName(captionText, redacteurId);
        if (media?.id) {
          video.setAttribute('src', `${API_BASE}/media/${media.id}/content`);
        }
      }));
      processed = div.innerHTML;
    } catch (e) {
      console.warn('Could not resolve blob video URLs:', e);
    }
  }

  return processed;
};

const CourseDetailsView = ({ courseId, onBack }) => {
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [processedContents, setProcessedContents] = useState({});
  const blobUrlsRef = React.useRef([]);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [progression, setProgression] = useState({ pourcentage: 0, chapitresCompletesIds: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [courseFiles, setCourseFiles] = useState([]);
  const [minioFiles, setMinioFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [docViewerFile, setDocViewerFile] = useState(null);
  const [instructeurNom] = useState('Professeur');
  const [totalStudents] = useState(0);

  useEffect(() => {
    fetchCourseDetails();
    return () => {
      blobUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    };
  }, [courseId]);

  const fetchProgression = async () => {
    if (!user?.id) return;
    try {
      const { coursService } = await import('../../../../../services/CoursService');
      const data = await coursService.getProgression(courseId, user.id);
      setProgression(data);
    } catch (e) {
      console.warn('Could not fetch progression:', e.message);
    }
  };

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
      setExpandedChapters(new Set());
      fetchProgression();

      // Process chapter HTML: replace direct MinIO URLs with proxy URLs, then handle auth images
      const processed = {};
      const storageUrlMap = {}; // original MinIO URL -> proxy URL, per chapter
      await Promise.all(formattedChapters.map(async (ch) => {
        if (ch.contenu) {
          try {
            const withProxyUrls = await processStorageUrls(ch.contenu, courseData.redacteurId);
            processed[ch.id] = await processHtmlImages(withProxyUrls, blobUrlsRef.current);
          } catch (e) {
            processed[ch.id] = ch.contenu;
          }
        }
      }));
      setProcessedContents(processed);

      // Extract files from PROCESSED contenu (blob URLs already resolved)
      const chaptersWithResolved = formattedChapters.map(ch => ({
        ...ch,
        contenu: processed[ch.id] || ch.contenu
      }));
      extractFilesFromChapters(chaptersWithResolved);
      
      // Fetch uploaded files from MinIO filtered by course
      fetchMinioFiles(courseId);
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
          console.log(`Chapter ${chapterIndex} contenu preview:`, chapter.contenu.substring(0, 500));
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = chapter.contenu;
          
          // Extract images
          const images = tempDiv.querySelectorAll('img');
          images.forEach((img, imgIndex) => {
            const src = img.getAttribute('src') || '';
            if (!src || src.startsWith('blob:') || src.startsWith('data:')) return;
            const absoluteSrc = src.startsWith('http') ? src : `${API_BASE}${src}`;
            const fileName = img.getAttribute('alt') || absoluteSrc.split('/').pop().split('?')[0] || `Image_${chapterIndex}_${imgIndex}.jpg`;
            extractedFiles.push({
              id: `img_${chapterIndex}_${imgIndex}`,
              fileName,
              filePath: absoluteSrc,
              contentType: 'image/jpeg',
              fileSize: 0,
              documentType: 'chapter_image',
              chapterTitle: chapter.titre,
              type: 'image'
            });
          });
          
          // Extract video elements (src now resolved to backend proxy URL)
          const videos = tempDiv.querySelectorAll('video, video source');
          videos.forEach((video, vidIndex) => {
            const src = video.getAttribute('src') || '';
            if (!src || src.startsWith('blob:')) return; // skip unresolved blobs
            const absoluteSrc = src.startsWith('http') ? src : `${API_BASE}${src}`;
            try {
              const urlPath = new URL(absoluteSrc).pathname;
              const name = urlPath.split('/').pop().split('?')[0] || `Video_${chapterIndex}_${vidIndex}.mp4`;
              extractedFiles.push({
                id: `vid_${chapterIndex}_${vidIndex}`,
                fileName: decodeURIComponent(name),
                filePath: absoluteSrc,
                contentType: 'video/mp4',
                fileSize: 0,
                documentType: 'chapter_video',
                chapterTitle: chapter.titre,
                type: 'video'
              });
            } catch { }
          });
          
          // Extract file links (videos and docs inserted as <a> tags)
          const links = tempDiv.querySelectorAll('a[href]');
          links.forEach((link, linkIndex) => {
            const href = link.getAttribute('href') || '';
            if (!href || !href.startsWith('http')) return;
            const fileName = link.textContent.trim() || href.split('/').pop().split('?')[0] || `File_${chapterIndex}_${linkIndex}`;
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            let contentType = 'application/octet-stream';
            let type = 'document';
            if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(ext)) { contentType = `video/${ext === 'mkv' ? 'x-matroska' : ext}`; type = 'video'; }
            else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) { contentType = `image/${ext}`; type = 'image'; }
            else if (ext === 'pdf') { contentType = 'application/pdf'; type = 'pdf'; }
            // Also detect video by URL pattern (/media/*/content) if extension missing
            else if (href.includes('/media/') && href.includes('/content')) { contentType = 'video/mp4'; type = 'video'; }
            extractedFiles.push({
              id: `link_${chapterIndex}_${linkIndex}`,
              fileName,
              filePath: href,
              contentType,
              fileSize: 0,
              documentType: 'chapter_document',
              chapterTitle: chapter.titre,
              type
            });
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

  // Fetch uploaded files from MinIO for this specific course
  const fetchMinioFiles = async (coursId) => {
    try {
      const { minioS3Service } = await import('../../../../../services/minioS3');
      const mediaFiles = await minioS3Service.getUserMediaByCours(coursId);
      console.log('MinIO files for course:', mediaFiles?.length || 0);
      
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
      let url = file.filePath || '';

      // Make relative paths absolute
      if (url && !url.startsWith('http') && !url.startsWith('blob:')) {
        url = `${API_BASE}${url}`;
      }

      // If it's a direct MinIO/S3 storage URL (not the backend API), convert to proxy URL
      if (url && isStorageUrl(url)) {
        try {
          const { minioS3Service } = await import('../../../../../services/minioS3');
          const relativePath = toRelativePath(url);
          const downloadData = await minioS3Service.generateDownloadUrlByPath(relativePath);
          if (downloadData?.downloadUrl) url = downloadData.downloadUrl;
        } catch (err) {
          console.warn('Could not refresh storage URL:', err);
        }
      }

      if (!url && file.mediaId) {
        url = `${API_BASE}/media/${file.mediaId}/content`;
      }

      console.log('Preview URL:', url, 'fileName:', file.fileName);

      if (!url) { showToast('Aper\u00e7u non disponible', 'error'); return; }

      // Use DocumentViewer for all file types (handles video by filename extension)
      setDocViewerFile({ url, fileName: file.fileName, contentType: file.contentType || '' });
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

  const renderChapterContent = (content, chapterId) => {
    const html = (chapterId && processedContents[chapterId]) || content;
    if (!html) return <p className="text-gray-500 italic">Aucun contenu disponible</p>;
    return (
      <div className="prose max-w-none">
        <div
          className="text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
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

  const toggleItemCompletion = async (chapterId) => {
    if (!user?.id) return;
    try {
      const { coursService } = await import('../../../../../services/CoursService');
      await coursService.marquerChapitreComplete(courseId, chapterId, user.id);
      showToast('✅ Chapitre marqué comme terminé!', 'success');
      await fetchProgression();
    } catch (e) {
      showToast(`Erreur: ${e.message}`, 'error');
    }
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
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-gray-600">Chargement du cours...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
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
                      <FileText className="w-4 h-4 text-emerald-300" />
                      <span className="font-semibold">{courseFiles.length + minioFiles.length} fichiers ressources</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar - Revamped */}
            <div className="p-6 bg-white/50 backdrop-blur-sm border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Progression du cours</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-blue-600">
                    {progression.pourcentage}%
                  </span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Complété</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 p-0.5 border border-gray-200 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progression.pourcentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full shadow-lg relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_2s_linear_infinite]"></div>
                </motion.div>
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
                
                {chapters.map((chapter, index) => (
                  <div key={chapter.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div
                      className={`p-6 cursor-pointer transition-all duration-200 ${
                        chapter.locked ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => !chapter.locked && toggleChapter(chapter.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-white ${
                            chapter.completed ? 'bg-green-500' : 
                            chapter.locked ? 'bg-gray-400' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className={`text-xl font-bold ${chapter.locked ? 'text-gray-400' : 'text-gray-900'}`}>
                              Chapitre {index + 1}: {chapter.titre}
                            </h3>
                            {chapter.description && (
                              <p className={`text-sm mt-1 ${chapter.locked ? 'text-gray-400' : 'text-gray-600'}`}>
                                {chapter.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`text-xs flex items-center ${chapter.locked ? 'text-gray-400' : 'text-gray-500'}`}>
                                <FileText className="w-3 h-3 mr-1" />
                                1 éléments
                              </span>
                              {progression.chapitresCompletesIds?.includes(chapter.id) && (
                                <span className="text-xs text-green-600 font-medium flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Terminé
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* Completion Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItemCompletion(chapter.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
                            title={progression.chapitresCompletesIds?.includes(chapter.id) ? "Chapitre terminé" : "Marquer comme terminé"}
                          >
                            {progression.chapitresCompletesIds?.includes(chapter.id) ? (
                              <div className="relative">
                                <CheckCircle className="w-8 h-8 text-emerald-500 fill-emerald-50 drop-shadow-sm transition-transform duration-300 group-hover:rotate-12" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                              </div>
                            ) : (
                              <Circle className="w-8 h-8 text-gray-300 hover:text-blue-400 transition-colors duration-300" />
                            )}
                          </button>
                          
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
                    </div>

                    {expandedChapters.has(chapter.id) && !chapter.locked && (
                      <div className="border-t bg-gray-50">
                        <div className="p-6 space-y-6">
                          {/* Chapter Content */}
                          {chapter.contenu && (
                            <div className="bg-white rounded-xl p-6 border border-blue-100">
                              <div className="prose max-w-none">
                                {renderChapterContent(chapter.contenu, chapter.id)}
                              </div>
                            </div>
                          )}
                          
                          {/* Chapter Resources and Files */}
                          <div className="bg-white rounded-xl p-6 border border-green-100">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                              <FileText className="w-5 h-5 mr-2 text-green-600" />
                              Ressources et fichiers
                            </h4>
                            
                            {filesLoading ? (
                              <div className="text-center py-8">
                                <div className="inline-flex items-center space-x-2 text-gray-600">
                                  <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                                  <span>Chargement des ressources...</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {courseFiles
                                  .filter(file => file.chapterTitle === chapter.titre)
                                  .length > 0 ? (
                                  courseFiles
                                    .filter(file => file.chapterTitle === chapter.titre)
                                    .map((file, fileIndex) => (
                                    <div
                                      key={file.id || fileIndex}
                                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-all duration-200 hover:bg-white"
                                    >
                                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <div className={`p-3 rounded-lg ${getFileTypeColor(file.fileName, file.contentType)}`}>
                                          {getFileIcon(file.fileName, file.contentType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-medium text-gray-900 truncate" title={file.fileName}>
                                            {file.fileName}
                                          </h5>
                                          <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs font-medium text-gray-500 uppercase">
                                              {file.type === 'image' ? 'Image' : 
                                               file.type === 'video' ? 'Vidéo' : 
                                               file.type === 'pdf' ? 'PDF' : 'Document'}
                                            </span>
                                            {file.fileSize > 0 && (
                                              <>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2 ml-3">
                                        <button
                                          onClick={() => handleFilePreview(file)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Ouvrir"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleFileDownload(file)}
                                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Télécharger"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">Aucune ressource disponible pour ce chapitre</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* General Resources Section — only MinIO-uploaded files (not chapter-embedded ones) */}
                {minioFiles.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-gray-900 flex items-center text-xl">
                      <FileText className="w-6 h-6 mr-3 text-purple-600" />
                      Ressources générales du cours
                    </h4>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {minioFiles.length} fichier{minioFiles.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 italic">
                    Fichiers supplémentaires fournis par le professeur pour l'ensemble du cours
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {minioFiles.map((file, index) => (
                      <div
                        key={file.id || index}
                        className="group relative bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300"
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
                              <span className="text-xs font-medium text-purple-600 uppercase bg-purple-100 px-2 py-0.5 rounded">
                                {file.type === 'image' ? 'Image' : 
                                 file.type === 'video' ? 'Vidéo' : 
                                 file.type === 'pdf' ? 'PDF' : 'Document'}
                              </span>
                              {file.fileSize > 0 && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</span>
                                </>
                              )}
                            </div>
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
                </div>
                )}
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
                  <span className="font-medium text-gray-900">{instructeurNom}</span>
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
                  <span className="font-medium text-gray-900">{totalStudents}</span>
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
                    {progression.chapitresCompletes ?? 0}/{progression.totalChapitres ?? chapters.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Statut</span>
                  <span className="font-medium text-blue-600">
                    {progression.pourcentage === 0 ? "Non commencé" :
                     progression.pourcentage === 100 ? "Terminé" : "En cours"}
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
        title={null}
        open={videoModalVisible}
        onCancel={() => { setVideoModalVisible(false); setCurrentVideoUrl(''); }}
        footer={null}
        width="auto"
        centered
        destroyOnClose
        closable={false}
        styles={{
          content: { padding: 0, background: '#0f0f0f', borderRadius: 12, overflow: 'hidden' },
          mask: { background: 'rgba(0,0,0,0.85)' }
        }}
      >
        <div style={{ position: 'relative', width: '90vw', maxWidth: 960 }}>
          {/* Header bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: '#1a1a1a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Video style={{ color: '#60a5fa', width: 18, height: 18 }} />
              <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14,
                maxWidth: '70vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentVideoTitle}
              </span>
            </div>
            <button
              onClick={() => { setVideoModalVisible(false); setCurrentVideoUrl(''); }}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6,
                color: '#e2e8f0', cursor: 'pointer', padding: '6px 10px', fontSize: 18,
                lineHeight: 1, display: 'flex', alignItems: 'center'
              }}
            >
              ×
            </button>
          </div>
          {/* Video */}
          <div style={{ background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {currentVideoUrl ? (
              <video
                key={currentVideoUrl}
                controls
                autoPlay
                playsInline
                style={{
                  display: 'block',
                  width: '100%',
                  maxHeight: '75vh',
                  background: '#000'
                }}
                onError={(e) => console.error('Video error:', e.target.error)}
              >
                <source src={currentVideoUrl} />
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            ) : (
              <div style={{ padding: 48, color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, border: '3px solid #374151',
                  borderTop: '3px solid #60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Chargement de la vidéo...</span>
              </div>
            )}
          </div>
        </div>
      </Modal>
      {/* Document Viewer */}
      <DocumentViewer
        isOpen={!!docViewerFile}
        url={docViewerFile?.url}
        fileName={docViewerFile?.fileName}
        contentType={docViewerFile?.contentType}
        onClose={() => setDocViewerFile(null)}
      />
    </div>
  );
};

export default CourseDetailsView;