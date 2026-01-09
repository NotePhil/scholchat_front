import React, { useState, useEffect } from 'react';
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
  Award,
  Target,
  Image,
  File,
  ExternalLink
} from 'lucide-react';

const CourseDetailsView = ({ courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [completedItems, setCompletedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [courseFiles, setCourseFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      
      // Import services
      const { coursService } = await import('../../../../../services/CoursService');
      const { minioS3Service } = await import('../../../../../services/minioS3');
      
      // Get course with chapters from API
      const courseData = await coursService.getCoursWithChapitres(courseId);
      console.log('Course data loaded:', courseData);
      
      // Extract files from course content after chapters are loaded
      // We'll call fetchCourseFiles after chapters are set
      
      console.log('Course data with chapters:', courseData);
      
      // Format course data
      const formattedCourse = {
        id: courseData.id,
        titre: courseData.titre || "Titre non disponible",
        description: courseData.description || "Description non disponible",
        instructeur: "Instructeur", // TODO: Get from backend
        duree: "À déterminer", // TODO: Calculate from chapters
        niveau: "Niveau", // TODO: Get from backend
        rating: 4.5,
        totalStudents: 0, // TODO: Get from backend
        progress: 0, // TODO: Calculate user progress
        thumbnail: "/api/placeholder/400/250"
      };
      
      // Format chapters data
      const formattedChapters = courseData.chapitres ? courseData.chapitres.map((chapitre, index) => ({
        id: chapitre.id || index + 1,
        titre: chapitre.titre || `Chapitre ${index + 1}`,
        description: chapitre.description || "Description non disponible",
        duree: "À déterminer", // TODO: Calculate from content
        completed: false, // TODO: Get user progress
        locked: index > 0, // Lock all except first chapter for now
        ordre: chapitre.ordre || index + 1,
        contenu: chapitre.contenu || "",
        materials: [
          {
            id: `${chapitre.id || index + 1}_content`,
            type: 'document',
            titre: 'Contenu du chapitre',
            size: '1 MB',
            completed: false
          }
        ]
      })) : [];
      
      setCourse(formattedCourse);
      setChapters(formattedChapters);
      setExpandedChapters(new Set([formattedChapters[0]?.id])); // Expand first chapter by default
      
      // Extract files from chapters after they are set
      setTimeout(() => {
        fetchCourseFiles(courseId);
      }, 100);
    } catch (error) {
      console.error('Erreur lors du chargement du cours:', error);
      // Fallback to empty state
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

  const fetchCourseFiles = async (courseId) => {
    try {
      setFilesLoading(true);
      console.log('Fetching files for course:', courseId);
      
      // Extract files from chapter content (images and links)
      const extractedFiles = [];
      
      chapters.forEach((chapter, chapterIndex) => {
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
          
          // Extract file links
          const links = tempDiv.querySelectorAll('a[href]');
          links.forEach((link, linkIndex) => {
            if (link.href && link.href.startsWith('http')) {
              const fileName = link.textContent || `Document_${chapterIndex}_${linkIndex}`;
              const extension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
              let contentType = 'application/octet-stream';
              
              if (['pdf'].includes(extension)) contentType = 'application/pdf';
              else if (['doc', 'docx'].includes(extension)) contentType = 'application/msword';
              else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) contentType = `image/${extension}`;
              
              extractedFiles.push({
                id: `link_${chapterIndex}_${linkIndex}`,
                fileName: fileName,
                filePath: link.href,
                contentType: contentType,
                fileSize: 0,
                documentType: 'chapter_document',
                chapterTitle: chapter.titre,
                type: 'document'
              });
            }
          });
        }
      });
      
      console.log('Extracted files from chapters:', extractedFiles);
      setCourseFiles(extractedFiles);
    } catch (error) {
      console.error('Error extracting course files:', error);
      setCourseFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleFileDownload = async (file) => {
    try {
      console.log('Downloading file:', file);
      
      if (file.filePath && file.filePath.startsWith('http')) {
        // Direct download from URL
        const link = document.createElement('a');
        link.href = file.filePath;
        link.download = file.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Lien de téléchargement non disponible');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Erreur lors du téléchargement: ${error.message}`);
    }
  };

  const handleFilePreview = async (file) => {
    try {
      console.log('Previewing file:', file);
      
      if (file.filePath && file.filePath.startsWith('http')) {
        window.open(file.filePath, '_blank');
      } else {
        alert('Lien de prévisualisation non disponible');
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      alert(`Erreur lors de la prévisualisation: ${error.message}`);
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
    
    // Remove HTML tags and render as formatted text
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    
    return (
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {cleanContent}
        </div>
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
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
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
      case 'video': return 'text-red-600 bg-red-50';
      case 'document': return 'text-blue-600 bg-blue-50';
      case 'exercise': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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
              <div className="relative p-8 h-full flex items-end">
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2">{course?.titre}</h1>
                  <p className="text-blue-100 text-lg mb-4">{course?.description}</p>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{course?.totalStudents} étudiants</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{course?.duree}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{course?.rating}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progression du cours</span>
                <span className="text-sm font-bold text-blue-600">{course?.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${course?.progress}%` }}
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
                {/* Debug Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Debug Info</h4>
                  <p className="text-sm text-yellow-700">Course ID: {courseId}</p>
                  <p className="text-sm text-yellow-700">Files Loading: {filesLoading ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-yellow-700">Files Count: {courseFiles.length}</p>
                  <button 
                    onClick={() => fetchCourseFiles(courseId)}
                    className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Recharger les fichiers
                  </button>
                </div>
                
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
                                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Play className="w-4 h-4" />
                                  </button>
                                )}
                                {material.type === 'document' && (
                                  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleItemCompletion(material.id)}
                                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  {completedItems.has(material.id) || material.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Global Files Section (outside chapters) */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Tous les fichiers utilisateur ({courseFiles.length})
                  </h4>
                  
                  {filesLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center space-x-2 text-gray-600">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                        <span>Chargement des fichiers...</span>
                      </div>
                    </div>
                  ) : courseFiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {courseFiles.map((file, index) => (
                        <div
                          key={file.id || index}
                          className="bg-white rounded-lg p-4 border hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${getFileTypeColor(file.fileName, file.contentType)}`}>
                              {getFileIcon(file.fileName, file.contentType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm truncate" title={file.fileName}>
                                {file.fileName || 'Fichier sans nom'}
                              </h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatFileSize(file.fileSize)}
                              </p>
                              {file.documentType && (
                                <p className="text-xs text-gray-400">
                                  {file.documentType}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <button
                                  onClick={() => handleFilePreview(file)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Prévisualiser"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleFileDownload(file)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Télécharger"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">Aucun fichier trouvé</p>
                      <p className="text-sm text-gray-500">Vérifiez que des fichiers ont été uploadés dans Minio</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">À propos de ce cours</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600 mb-4">
                    Ce cours complet vous permettra de maîtriser React.js, l'une des bibliothèques JavaScript 
                    les plus populaires pour créer des interfaces utilisateur modernes et interactives.
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ce que vous apprendrez :</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Les concepts fondamentaux de React</li>
                    <li>Création et gestion des composants</li>
                    <li>Gestion de l'état avec les hooks</li>
                    <li>Routage et navigation</li>
                    <li>Intégration avec des APIs</li>
                    <li>Bonnes pratiques et optimisation</li>
                  </ul>
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Votre progression</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Chapitres terminés</span>
                  <span className="font-bold text-green-600">
                    {chapters.filter(c => c.completed).length}/{chapters.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Temps passé</span>
                  <span className="font-medium text-gray-900">12h 30min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Dernière activité</span>
                  <span className="font-medium text-gray-900">Il y a 2 jours</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Partager le cours</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Award className="w-4 h-4" />
                  <span>Voir le certificat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsView;