import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  User,
  MapPin,
  Timer,
  CalendarPlus,
  FileText,
  School,
  UserCheck,
  Users,
  Mail,
  Phone,
  AlertCircle,
  Search,
  Eye,
  CheckCircle,
  Share2,
  Archive,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { minioS3Service } from "../../../../../services/minioS3";
import { useNavigate } from "react-router-dom";
import DocumentViewer from "../../../../../components/viewers/DocumentViewer";

const CourseContentView = ({ course, onBack }) => {
  const navigate = useNavigate();
  const tabsRef = useRef(null);
  const [processedChapters, setProcessedChapters] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [participants, setParticipants] = useState([]);
  const [courseDocuments, setCourseDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [viewerConfig, setViewerConfig] = useState({
    isOpen: false,
    url: "",
    fileName: "",
    contentType: ""
  });

  useEffect(() => {
    if (course) {
      fetchCourseData();
    }
  }, [course]);

  useEffect(() => {
    if (processedChapters.length > 0) {
      // Use processedChapters directly (they already have processedContent with proxied URLs)
      const docs = extractDocumentsFromChapters(processedChapters);
      setCourseDocuments(docs);
      setFilteredDocuments(docs);
    }
    // Don't fall back to raw chapitres — wait for processChapterContent to finish
    // (avoids showing broken Wasabi URLs in the Documents tab)
  }, [processedChapters]);

  const extractDocumentsFromChapters = (chapitres) => {
    const docs = [];
    if (!chapitres) return docs;

    // Only list documents that are backend proxy URLs (already verified & owned by this course)
    // Skip raw Wasabi/S3 URLs (they'd be AccessDenied) and blob: URLs
    const apiBase = process.env.REACT_APP_API_BASE_URL || "";
    const isProxied = (url) => url && apiBase && url.startsWith(apiBase) && url.includes("/media/");

    chapitres.forEach((chapter) => {
      const content = chapter.processedContent || chapter.contenu || "";
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${content}</div>`, "text/html");

      // Extract images (only proxied URLs — direct Wasabi links excluded)
      doc.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (src && isProxied(src)) {
          const name = img.getAttribute("alt") || src.split("/").pop().split("?")[0] || "Image";
          docs.push({ id: src, title: name, url: src, type: "image", chapterTitle: chapter.titre });
        }
      });

      // Extract file links (only proxied URLs)
      doc.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (href && isProxied(href)) {
          const name = a.textContent.trim() || href.split("/").pop().split("?")[0] || "Fichier";
          docs.push({ id: href, title: name, url: href, type: "file", chapterTitle: chapter.titre });
        }
      });

      // Extract videos (only proxied URLs)
      doc.querySelectorAll("video, video source").forEach((el) => {
        const src = el.getAttribute("src");
        if (src && isProxied(src)) {
          const name = src.split("/").pop().split("?")[0] || "Vidéo";
          docs.push({ id: src, title: name, url: src, type: "video", chapterTitle: chapter.titre });
        }
      });
    });
    return docs;
  };

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);

      if (course.participants && course.participants.length > 0) {
        setParticipants(course.participants);
      } else if (course.eleves && course.eleves.length > 0) {
        setParticipants(course.eleves);
      }
    } catch (err) {
      console.error("Failed to load course data:", err);
      setError("Failed to load course data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {};

  const checkTabScroll = () => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    checkTabScroll();
    el.addEventListener("scroll", checkTabScroll);
    window.addEventListener("resize", checkTabScroll);
    return () => {
      el.removeEventListener("scroll", checkTabScroll);
      window.removeEventListener("resize", checkTabScroll);
    };
  }, [processedChapters, participants, courseDocuments]);

  const scrollTabs = (dir) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };

  // Extract relative storage key from a full Wasabi/MinIO URL (never use direct URLs)
  const toRelativePath = (raw) => {
    if (!raw || !raw.startsWith("http")) return raw;
    try {
      const pathname = new URL(raw).pathname.replace(/^\//, "");
      const idx = pathname.indexOf("users/");
      if (idx >= 0) return pathname.slice(idx);
      const parts = pathname.split("/");
      return parts.length > 1 ? parts.slice(1).join("/") : pathname;
    } catch { return raw; }
  };

  // Returns true for any direct storage URL that needs proxying (not a backend proxy, not blob)
  const isStorageUrl = (url) => {
    if (!url) return false;
    if (url.startsWith("blob:")) return false;
    const apiBase = process.env.REACT_APP_API_BASE_URL || "";
    if (apiBase && url.startsWith(apiBase)) return false; // already a proxy URL
    return url.startsWith("http");
  };

  const processChapterContent = async () => {
    if (!course.chapitres) return;

    try {
      const processedChaps = await Promise.all(
        course.chapitres.map(async (chapter) => {
          let processedContent = chapter.contenu || "";

          // Collect all storage URLs that need to be replaced with backend proxy URLs
          const urlsToRefresh = new Set();
          const allUrlRegex = /(src|href)="(https?:\/\/[^"]+)"/g;
          let match;
          while ((match = allUrlRegex.exec(processedContent)) !== null) {
            const url = match[2];
            if (isStorageUrl(url)) urlsToRefresh.add(url);
          }

          // Replace each storage URL with the backend proxy URL
          for (const original of urlsToRefresh) {
            try {
              const relativePath = toRelativePath(original);
              const downloadData = await minioS3Service.generateDownloadUrlByPath(relativePath);
              if (downloadData?.downloadUrl) {
                // Use a global replace (all occurrences in the HTML)
                processedContent = processedContent.split(original).join(downloadData.downloadUrl);
              }
            } catch {
              // Keep original — will fail gracefully in the browser
            }
          }

          return { ...chapter, processedContent };
        })
      );

      setProcessedChapters(processedChaps);
    } catch (error) {
      console.error("Error processing chapter content:", error);
      setProcessedChapters(course.chapitres.map(ch => ({ ...ch, processedContent: ch.contenu || "" })));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non défini";
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const words = name.split(" ");
    return words
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      BROUILLON: {
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        text: "Brouillon",
      },
      EN_ATTENTE_VALIDATION: {
        className: "bg-blue-50 text-blue-700 border-blue-200",
        text: "En attente",
      },
      PUBLIE: {
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        text: "Publié",
      },
      ARCHIVE: {
        className: "bg-red-50 text-red-700 border-red-200",
        text: "Archivé",
      },
      default: {
        className: "bg-slate-50 text-slate-700 border-slate-200",
        text: status || "Non défini",
      },
    };

    const config = statusConfig[status] || statusConfig.default;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full mr-2 ${
            status === "PUBLIE"
              ? "bg-emerald-500"
              : status === "BROUILLON"
              ? "bg-yellow-500"
              : status === "EN_ATTENTE_VALIDATION"
              ? "bg-blue-500"
              : "bg-red-500"
          }`}
        ></div>
        {config.text}
      </span>
    );
  };

  const handleDocumentClick = (e) => {
    // Click on image → popup viewer
    if (e.target.tagName === "IMG") {
      const url = e.target.getAttribute("src");
      const fileName = e.target.getAttribute("alt") || "Image";
      if (url && url.startsWith("http")) {
        e.preventDefault();
        e.stopPropagation();
        setViewerConfig({ isOpen: true, url, fileName, contentType: "image" });
        return;
      }
    }
    // Click on anchor link → open viewer
    const anchor = e.target.closest("a");
    if (anchor) {
      const url = anchor.getAttribute("href");
      const fileName = anchor.textContent.trim() || url?.split("/").pop().split("?")[0] || "Document";
      if (url && url.startsWith("http")) {
        e.preventDefault();
        e.stopPropagation();
        setViewerConfig({ isOpen: true, url, fileName, contentType: "" });
      }
    }
  };

  const renderChapterContent = (content) => {
    if (!content) return null;

    return (
      <>
        <div
          className="course-content-container text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
          style={{ wordBreak: "break-word" }}
          onClick={handleDocumentClick}
        />
        <style>{`
          .course-content-container img {
            max-width: 250px;
            max-height: 200px;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            display: block;
            margin: 8px 0;
          }
          .course-content-container div[data-file-id] {
            margin: 8px 0;
            padding: 8px 12px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .course-content-container a {
            color: #3b82f6;
            text-decoration: underline;
            font-weight: 500;
            cursor: pointer;
          }
          .course-content-container a:hover {
            color: #1d4ed8;
          }
          .course-content-container ul {
            list-style-type: disc;
            padding-left: 2em;
            margin: 0.5em 0;
          }
          .course-content-container ol {
            list-style-type: decimal;
            padding-left: 2em;
            margin: 0.5em 0;
          }
          .course-content-container li {
            margin: 0.25em 0;
          }
          .course-content-container p {
            margin: 0.5em 0;
          }
        `}</style>
      </>
    );
  };

  if (!course) {
    return null;
  }

  return (
    <div className="full-bleed-page">
      <div className="w-full">

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 60%, #4f8ec9 100%)" }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{ background: "#fff" }} />

          <div className="relative px-3 sm:px-6 py-3 sm:py-4">
            {/* Row 1: back + programme */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                <ArrowLeft size={14} />
                Retour
              </button>
              <button
                onClick={() => navigate('/schoolchat/Principal/ProfessorDashboard/schedule-course', { state: { course } })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
              >
                <CalendarPlus size={14} />
                <span>Programmer</span>
              </button>
            </div>

            {/* Row 2: title + meta — NO abbreviation avatar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-white font-bold text-base sm:text-xl leading-tight m-0">
                  {course?.titre}
                </h1>
                {getStatusBadge(course?.etat)}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {course?.matiere?.nom && (
                  <span className="flex items-center gap-1 text-blue-100 text-xs">
                    <School size={10} />{course.matiere.nom}
                  </span>
                )}
                {course?.dateCreation && (
                  <span className="flex items-center gap-1 text-blue-100 text-xs">
                    <Calendar size={10} />{formatDate(course.dateCreation)}
                  </span>
                )}
                {course?.redacteur && (
                  <span className="flex items-center gap-1 text-blue-100 text-xs">
                    <User size={10} />
                    {`${course.redacteur.prenom || ""} ${course.redacteur.nom || ""}`.trim() || "Professeur"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable tab bar with arrow buttons ── */}
        <div className="bg-white border-b border-slate-200 relative">
          {/* Left scroll arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scrollTabs("left")}
              className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-1.5 bg-gradient-to-r from-white via-white to-transparent"
              aria-label="Défiler à gauche"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                <ChevronLeft size={14} />
              </span>
            </button>
          )}

          {/* Right scroll arrow */}
          {canScrollRight && (
            <button
              onClick={() => scrollTabs("right")}
              className="absolute right-0 top-0 bottom-0 z-10 flex items-center px-1.5 bg-gradient-to-l from-white via-white to-transparent"
              aria-label="Défiler à droite"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                <ChevronRight size={14} />
              </span>
            </button>
          )}

          {/* Tabs */}
          <div
            ref={tabsRef}
            className="flex overflow-x-auto px-3 sm:px-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {[
              { key: "details", label: "Détails" },
              ...(processedChapters.length > 0 || (course?.chapitres?.length > 0)
                ? [{ key: "chapters", label: `Chapitres (${processedChapters.length || course?.chapitres?.length || 0})` }]
                : []),
              ...(participants.length > 0
                ? [{ key: "participants", label: `Participants (${participants.length})` }]
                : []),
              { key: "documents", label: `Documents (${courseDocuments.length})` },
              { key: "history", label: "Historique" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="px-3 sm:px-6 py-4 sm:py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-4 sm:space-y-6">
                {/* Course Information */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                    style={{ background: "#f8faff" }}>
                    <BookOpen size={14} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Informations du Cours
                    </span>
                  </div>
                  <div className="p-4 sm:p-6">
                    {/* Title + subject — no avatar */}
                    <div className="mb-4 pb-4 border-b border-slate-100">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                        {course?.titre}
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {course?.matiere?.nom || "Matière non définie"}
                      </p>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                          <Calendar size={14} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 font-medium">Date de début</p>
                          <p className="text-sm text-slate-800 font-medium">{formatDate(course?.dateHeureDebut)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                          <Clock size={14} className="text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 font-medium">Date de fin</p>
                          <p className="text-sm text-slate-800 font-medium">{formatDate(course?.dateHeureFin)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg flex-shrink-0">
                          <MapPin size={14} className="text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 font-medium">Lieu</p>
                          <p className="text-sm text-slate-800 font-medium">{course?.lieu || "Non spécifié"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                          <User size={14} className="text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 font-medium">Professeur</p>
                          <p className="text-sm text-slate-800 font-medium">
                            {course?.redacteur?.nom || course?.redacteur?.prenom
                              ? `${course.redacteur.prenom || ""} ${course.redacteur.nom || ""}`.trim()
                              : "Non spécifié"}
                          </p>
                        </div>
                      </div>
                      {course?.dateCreation && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                            <CalendarPlus size={14} className="text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 font-medium">Date de création</p>
                            <p className="text-sm text-slate-800 font-medium">{formatDate(course.dateCreation)}</p>
                          </div>
                        </div>
                      )}
                      {course?.duree && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-50 rounded-lg flex-shrink-0">
                            <Timer size={14} className="text-rose-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 font-medium">Durée</p>
                            <p className="text-sm text-slate-800 font-medium">{course.duree} minutes</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {course?.description && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                      style={{ background: "#f8faff" }}>
                      <FileText size={14} className="text-indigo-600" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</span>
                    </div>
                    <div className="p-4 sm:p-6">
                      <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{course.description}</p>
                    </div>
                  </div>
                )}

                {/* Contenu */}
                {course?.contenu && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                      style={{ background: "#f8faff" }}>
                      <BookOpen size={14} className="text-indigo-600" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contenu du cours</span>
                    </div>
                    <div className="p-4 sm:p-6">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{course.contenu}</p>
                    </div>
                  </div>
                )}

                {/* Références */}
                {course?.references && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                      style={{ background: "#f8faff" }}>
                      <FileText size={14} className="text-indigo-600" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Références</span>
                    </div>
                    <div className="p-4 sm:p-6">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{course.references}</p>
                    </div>
                  </div>
                )}

                {/* Matière(s) */}
                {(course?.matiere || (course?.matieres?.length > 0)) && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                      style={{ background: "#f8faff" }}>
                      <School size={14} className="text-indigo-600" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {course?.matieres?.length > 1 ? "Matières Associées" : "Matière Associée"}
                      </span>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3">
                      {(course?.matiere ? [course.matiere] : course.matieres).map((m, i) => (
                        <div key={m.id || i} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{m.nom}</p>
                            {m.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.description}</p>}
                            {m.coefficient && (
                              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                Coeff: {m.coefficient}
                              </span>
                            )}
                          </div>
                          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.etat === "ACTIF" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {m.etat || "ACTIF"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chapters Tab */}
            {activeTab === "chapters" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                    Chapitres du Cours (
                    {processedChapters.length || course?.chapitres?.length || 0}
                    )
                  </h3>
                </div>

                {(!processedChapters || processedChapters.length === 0) &&
                (!course?.chapitres || course.chapitres.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Aucun chapitre disponible
                    </h4>
                    <p className="text-slate-600">
                      Ce cours ne contient pas encore de chapitres.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(processedChapters.length > 0
                      ? processedChapters
                      : course.chapitres
                    ).map((chapter, index) => (
                      <div
                        key={chapter.id || index}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                                {chapter.ordre || index + 1}
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-slate-900">
                                  {chapter.titre}
                                </h4>
                                {chapter.description && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {chapter.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-6">
                          {chapter.processedContent ? (
                            renderChapterContent(chapter.processedContent)
                          ) : chapter.contenu ? (
                            renderChapterContent(chapter.contenu)
                          ) : (
                            <div className="text-slate-500 italic">
                              Aucun contenu disponible pour ce chapitre.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === "participants" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-indigo-600" />
                    Participants ({participants.length})
                  </h3>
                </div>

                {participants.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Aucun participant inscrit
                    </h4>
                    <p className="text-slate-600">
                      Les étudiants pourront s'inscrire à ce cours.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {participants.map((participant, index) => (
                      <div
                        key={participant.id || index}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                              <span className="text-white font-medium">
                                {participant.prenom?.charAt(0) || "U"}
                                {participant.nom?.charAt(0) || ""}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900">
                              {participant.prenom} {participant.nom}
                            </h4>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                              {participant.email && (
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                                  <span className="truncate">
                                    {participant.email}
                                  </span>
                                </div>
                              )}
                              {participant.telephone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                  <span>{participant.telephone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                participant.etat === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : participant.etat === "INACTIVE"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {participant.etat === "ACTIVE"
                                ? "Actif"
                                : participant.etat === "INACTIVE"
                                ? "Inactif"
                                : participant.etat || "Statut inconnu"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                    Documents ({filteredDocuments.length})
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={documentSearchTerm}
                      onChange={(e) => {
                        setDocumentSearchTerm(e.target.value);
                        const q = e.target.value.toLowerCase();
                        setFilteredDocuments(
                          q ? courseDocuments.filter((d) => d.title.toLowerCase().includes(q)) : courseDocuments
                        );
                      }}
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">Aucun document disponible</h4>
                    <p className="text-slate-600">Aucun document n'a été associé à ce cours.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map((doc, index) => {
                      const isImage = doc.type === "image";
                      return (
                        <button
                          key={doc.id || index}
                          onClick={() => setViewerConfig({ isOpen: true, url: doc.url, fileName: doc.title, contentType: isImage ? "image" : "" })}
                          className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${ isImage ? "bg-purple-50" : "bg-blue-50" }`}>
                              {isImage ? (
                                <img src={doc.url} alt={doc.title} className="w-10 h-10 object-cover rounded-lg" />
                              ) : (
                                <FileText className={`w-5 h-5 ${ isImage ? "text-purple-500" : "text-blue-500" }`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{doc.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.chapterTitle}</p>
                              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${ isImage ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700" }`}>
                                {isImage ? "Image" : "Fichier"}
                              </span>
                            </div>
                            <Eye className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 mt-1 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                    Historique des Modifications
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">
                          Cours créé
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Le cours a été créé avec succès
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {course?.dateCreation
                            ? formatDate(course.dateCreation)
                            : "Date de création non disponible"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {course?.dateHeureDebut && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Date de début programmée
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours est programmé pour commencer
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDate(course.dateHeureDebut)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {course?.dateHeureFin && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Date de fin programmée
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours est programmé pour se terminer
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDate(course.dateHeureFin)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {course?.etat === "PUBLIE" && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Cours publié
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours a été publié et est maintenant accessible
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {course?.etat === "ARCHIVE" && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Archive className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Cours archivé
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours a été archivé
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>{/* end tab content */}
      </div>{/* end w-full */}
      <DocumentViewer
        isOpen={viewerConfig.isOpen}
        url={viewerConfig.url}
        fileName={viewerConfig.fileName}
        contentType={viewerConfig.contentType}
        onClose={() => setViewerConfig({ ...viewerConfig, isOpen: false })}
      />
    </div>
  );
};

export default CourseContentView;