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
  Pencil,
  Loader2,
  Home,
  Video,
  Lock,
  Globe
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

/**
 * BrokenImagePlaceholder — shown when an image fails to load.
 * Uses a subtle SVG icon, no text.
 */
const BrokenImagePlaceholder = ({ className = '' }) => (
  <div className={`w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
    <svg
      viewBox="0 0 64 64"
      className="w-12 h-12 opacity-30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Frame */}
      <rect x="6" y="10" width="52" height="44" rx="4" stroke="currentColor" strokeWidth="3" className="text-gray-500 dark:text-gray-400" />
      {/* Mountain / landscape */}
      <path d="M6 40 L20 24 L32 34 L42 22 L58 40" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400" />
      {/* Sun circle */}
      <circle cx="46" cy="22" r="5" stroke="currentColor" strokeWidth="3" className="text-gray-500 dark:text-gray-400" />
      {/* Diagonal slash indicating broken */}
      <line x1="10" y1="10" x2="54" y2="54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-400 dark:text-gray-500" />
    </svg>
  </div>
);

/**
 * SafeImg — <img> wrapper that swaps in BrokenImagePlaceholder on load error.
 */
const SafeImg = ({ src, className, onClick, style }) => {
  const [broken, setBroken] = React.useState(false);
  if (broken) return <BrokenImagePlaceholder className={className} />;
  return (
    <img
      src={src}
      alt=""
      className={className}
      style={style}
      onClick={onClick}
      onError={() => setBroken(true)}
    />
  );
};

/**
 * ExistingMediaThumb — fetches a presigned URL for an existing media by ID.
 */
const ExistingMediaThumb = ({ mediaId }) => {
  const [url, setUrl] = React.useState(null);
  const [broken, setBroken] = React.useState(false);
  React.useEffect(() => {
    if (!mediaId) return;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    fetch(`${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/download-url`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const resolved = d.url && !isDirectMinioUrl(d.url)
          ? d.url
          : `${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/content`;
        setUrl(resolved);
      })
      .catch(() => setUrl(`${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/content`));
  }, [mediaId]);
  if (!url) return <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />;
  if (broken) return <BrokenImagePlaceholder className="rounded-xl" />;
  return <img src={url} alt="" className="w-full h-full object-cover rounded-xl shadow-md" onError={() => setBroken(true)} />;
};

/**
 * LightboxImage — resolves a presigned URL once when the lightbox opens.
 */
const LightboxImage = ({ mediaId, onClick }) => {
  const [url, setUrl] = React.useState(null);
  const [broken, setBroken] = React.useState(false);

  React.useEffect(() => {
    if (!mediaId) return;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    fetch(`${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/download-url`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const resolved = d.url && !isDirectMinioUrl(d.url)
          ? d.url
          : `${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/content`;
        setUrl(resolved);
      })
      .catch(() => setUrl(`${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/content`));
  }, [mediaId]);

  if (!url) return <Loader2 className="w-10 h-10 text-white animate-spin" />;
  if (broken) return (
    <div className="w-64 h-48 rounded-xl overflow-hidden">
      <BrokenImagePlaceholder />
    </div>
  );
  return (
    <img
      src={url}
      alt=""
      className="object-contain rounded-xl shadow-2xl"
      style={{ maxWidth: 'calc(100% - 96px)', maxHeight: 'calc(100% - 80px)' }}
      onClick={onClick}
      onError={() => setBroken(true)}
    />
  );
};

/**
/**
 * Context that signals LazyMedia components to pause URL resolution
 * while a modal (create/edit) is open — prevents background requests
 * during user input.
 */
const MediaSuspendedContext = React.createContext(false);

/**
 * LazyMedia — resolves the presigned URL only when the element enters the viewport.
 * Images show a skeleton placeholder until visible; videos use VideoPlayer.
 */
// Returns true if the URL is a direct internal MinIO URL that the browser cannot reach.
// AWS S3 presigned URLs (amazonaws.com) are publicly reachable — do NOT proxy them.
const isDirectMinioUrl = (url) => {
  if (!url) return false;
  try {
    const u = new URL(url);
    // AWS S3 presigned URLs are always safe to use directly
    if (u.hostname.endsWith('amazonaws.com') || u.hostname.endsWith('r2.cloudflarestorage.com')) return false;
    // A presigned URL from any other host that has X-Amz-Algorithm is also safe (e.g. MinIO with public endpoint)
    if (u.searchParams.has('X-Amz-Algorithm')) return false;
    // Internal MinIO: same host as API but different port, or a private hostname
    const apiHost = new URL(process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').hostname;
    return u.hostname !== apiHost;
  } catch (e) { return false; }
};

const LazyMedia = React.memo(({ mediaId, mediaType, presignedUrl, className, onClick, overlay }) => {
  const containerRef = React.useRef(null);
  // Always start null — the URL is set only when the element enters the viewport
  const [url, setUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [imgBroken, setImgBroken] = React.useState(false);
  const suspended = React.useContext(MediaSuspendedContext);

  React.useEffect(() => {
    if (suspended) return;
    const el = containerRef.current;
    if (!el || !mediaId) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !url && !loading) {
          observer.disconnect();
          // Use the presigned URL embedded in the event data — zero extra fetch
          if (presignedUrl) {
            setUrl(presignedUrl);
            return;
          }
          setLoading(true);
          const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
          const isVideo = (mediaType || '').toUpperCase() === 'VIDEO';
          if (isVideo) {
            setUrl(`${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/content`);
            setLoading(false);
          } else {
            fetch(`${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/download-url`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.ok ? r.json() : Promise.reject())
              .then((d) => setUrl(d.url || `${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/content`))
              .catch(() => setUrl(`${process.env.REACT_APP_API_BASE_URL}/media/${mediaId}/content`))
              .finally(() => setLoading(false));
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mediaId, mediaType, presignedUrl, suspended]); // eslint-disable-line react-hooks/exhaustive-deps

  const isVideo = (mediaType || '').toUpperCase() === 'VIDEO';

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {!url ? (
        // Skeleton placeholder — zero network cost
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          {loading && <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />}
        </div>
      ) : isVideo ? (
        <VideoPlayer src={url} className="w-full h-full object-cover" />
      ) : imgBroken ? (
        <BrokenImagePlaceholder />
      ) : (
        <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgBroken(true)} />
      )}
      {overlay && (
        <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none">
          <span className="text-white text-2xl font-bold">{overlay}</span>
        </div>
      )}
    </div>
  );
});

/**
 * VideoPlayer — shows a real first-frame thumbnail in preview mode.
 *
 * Phase 1 (preview): Loads video metadata + seeks to 0.5 s to paint a
 *   thumbnail onto a canvas. Only a few KB are fetched (metadata range).
 *   The canvas image is shown as the poster with a play-button overlay.
 *
 * Phase 2 (active): On click, fetches the presigned S3 URL and streams
 *   the video natively with controls. Uses preload="metadata".
 *
 * Auto-pauses when scrolled out of view.
 */
const VideoPlayer = ({ src, className }) => {
  const videoRef = useRef(null);
  const thumbVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [thumbError, setThumbError] = useState(false);
  const [error, setError] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [active, setActive] = useState(false);
  // Pause thumbnail generation while a modal is open
  const suspended = React.useContext(MediaSuspendedContext);

  // ── Generate thumbnail from the first frame ────────────────────────────────
  useEffect(() => {
    if (!src || suspended) return;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      // Seek to 10% of duration (or 0.5 s, whichever is smaller) for a representative frame
      video.currentTime = Math.min(0.5, video.duration * 0.1 || 0.5);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.8));
      } catch (e) {
        // CORS or tainted canvas — fall back to styled preview
        setThumbError(true);
      }
      cleanup();
    };

    video.onerror = () => {
      setThumbError(true);
      cleanup();
    };

    video.src = src;
  }, [src, suspended]);

  const activate = (e) => {
    e.stopPropagation();
    if (active || resolving) return;
    setResolving(true);
    setActive(true);

    const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    const downloadUrlEndpoint = src.replace(/\/content$/, '/download-url');

    fetch(downloadUrlEndpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setStreamUrl(data.url || src);
        setResolving(false);
      })
      .catch(() => {
        setStreamUrl(src);
        setResolving(false);
      });
  };

  // Auto-play once the stream URL is resolved
  useEffect(() => {
    if (streamUrl && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [streamUrl]);

  // Pause when scrolled out of view
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) video.pause(); },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [streamUrl]);

  // ── Phase 2: active player ─────────────────────────────────────────────────
  if (active) {
    if (error) {
      return (
        <div className={`${className} flex flex-col items-center justify-center bg-gray-900 text-gray-400 gap-2`}>
          <Video className="w-8 h-8 opacity-50" />
          <span className="text-xs">Vidéo indisponible</span>
        </div>
      );
    }
    if (resolving || !streamUrl) {
      return (
        <div className={`${className} flex flex-col items-center justify-center bg-gray-900 text-gray-400 gap-2`}>
          <Loader2 className="w-8 h-8 animate-spin opacity-60" />
          <span className="text-xs">Préparation...</span>
        </div>
      );
    }
    return (
      <video
        ref={videoRef}
        src={streamUrl}
        className={`${className} max-w-full`}
        controls
        playsInline
        preload="metadata"
        onError={() => setError(true)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  // ── Phase 1: thumbnail preview ─────────────────────────────────────────────
  const hasThumbnail = thumbnailUrl && !thumbError;

  return (
    <div
      ref={containerRef}
      className={`${className} relative flex items-center justify-center cursor-pointer group overflow-hidden`}
      style={hasThumbnail ? {} : { backgroundColor: '#1a1a2e' }}
      onClick={activate}
      title="Lire la vidéo"
    >
      {/* Real first-frame thumbnail */}
      {hasThumbnail ? (
        <img
          src={thumbnailUrl}
          alt="aperçu vidéo"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        /* Fallback: film-strip pattern when thumbnail not yet ready or CORS blocked */
        <>
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,255,255,.06) 28px,rgba(255,255,255,.06) 29px)',
            }}
          />
          {!thumbError && (
            /* Subtle pulsing skeleton while thumbnail is being captured */
            <div className="absolute inset-0 bg-gray-800 animate-pulse" />
          )}
        </>
      )}

      {/* Dark gradient overlay so the play button is always readable */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-200" />

      {/* Play button */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-white/25 group-hover:bg-white/40 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-2xl">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current ml-1" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-white/80 text-xs font-medium tracking-wide select-none drop-shadow">Lire la vidéo</span>
      </div>

      {/* Video badge */}
      <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
        <Video className="w-3 h-3" />
        <span>Vidéo</span>
      </div>
    </div>
  );
};

// Module-level cache — survives component unmount/remount (navigation away and back)
const _cache = {
  pages: {},       // pageIndex -> processed activities array
  totalElements: 0,
  totalPages: null,  // null = unknown
  timestamp: 0,
  userNames: {},   // userId -> { name, role }
  classNames: {},  // classId -> string name
};
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const PAGE_SIZE = 10;

const ActivitiesContent = () => {
  const { t } = useTranslation();
  const language = useSelector((state) => state.language?.currentLanguage || 'fr');
  const isMobile = useSelector((state) => state.ui.isMobile);
  const { isAdmin, isProfessor, isTutor, isGestionnaire, user } = useAuth();

  // Role check: only professors and admins can create events
  const userRole = (localStorage.getItem('userRole') || '').toUpperCase();
  const canCreateEvent = isAdmin || isProfessor || isTutor || isGestionnaire ||
    userRole.includes('ADMIN') || userRole.includes('PROFESSOR') || userRole.includes('TUTOR') || userRole.includes('GESTIONNAIRE');

  // Build the tab list once based on role.
  // Creators (professor/admin/tutor/gestionnaire) get "Mes publications" since they author events.
  // Viewers (student/parent) never create events so that tab is replaced with "Récents" (past events).
  const sidebarTabs = React.useMemo(() => {
    const base = [
      { key: 'all',          label: 'Fil d\'actualité', labelMobile: 'Tout',           icon: Home,     color: 'text-gray-600',   bg: 'bg-gray-100 dark:bg-gray-700' },
      { key: 'upcoming',     label: 'À venir',          labelMobile: 'À venir',        icon: Calendar, color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/30' },
      { key: 'withMedia',    label: 'Avec médias',      labelMobile: 'Médias',         icon: Image,    color: 'text-pink-600',   bg: 'bg-pink-50 dark:bg-pink-900/30' },
      { key: 'participating',label: 'Participations',   labelMobile: 'Participations', icon: UserPlus, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/30' },
    ];
    if (canCreateEvent) {
      // Insert "Mes publications" right after "Fil d'actualité"
      base.splice(1, 0, {
        key: 'mine', label: 'Mes publications', labelMobile: 'Mes posts',
        icon: Pencil, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      });
    } else {
      // Students/parents: add "Passés" — events that have already happened
      base.push({
        key: 'past', label: 'Passés', labelMobile: 'Passés',
        icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30',
      });
    }
    return base;
  }, [canCreateEvent]);

  const pluralize = (count, singular, plural) => {
    return `${count} ${count === 1 ? singular : plural}`;
  };

  const [activities, setActivities] = useState(() => {
    // Restore from cache: flatten all pages in order
    const pages = _cache.pages;
    const keys = Object.keys(pages).map(Number).sort((a, b) => a - b);
    return keys.length > 0 ? keys.flatMap(k => pages[k]) : [];
  });
  const [loadingActivities, setLoadingActivities] = useState(() => {
    const keys = Object.keys(_cache.pages);
    return keys.length === 0;
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(() => {
    const keys = Object.keys(_cache.pages).map(Number);
    return keys.length > 0 ? Math.max(...keys) : 0;
  });
  const [hasMore, setHasMore] = useState(_cache.totalPages === null || _cache.totalPages > 1);
  const [totalElements, setTotalElements] = useState(_cache.totalElements || 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const [likingActivities, setLikingActivities] = useState({});
  const [localLikes, setLocalLikes] = useState({});
  const [localComments, setLocalComments] = useState({});
  const [likedByUsers, setLikedByUsers] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createFormError, setCreateFormError] = useState("");
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
  const [editingActivity, setEditingActivity] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editUploadedImages, setEditUploadedImages] = useState([]);
  const [editUploading, setEditUploading] = useState(false);
  const editFileInputRef = useRef(null);
  const [userPublicationClassIds, setUserPublicationClassIds] = useState([]);
  const [classFilterId, setClassFilterId] = useState(() => {
    const saved = localStorage.getItem("selectedClassId");
    if (saved) { localStorage.removeItem("selectedClassId"); return saved; }
    return null;
  });
  const [classFilterName, setClassFilterName] = useState("");

  // Module-level cache for classes — shared between publication rights and the create/edit forms.
  // Avoids fetching /classes twice on mount (once for publication rights, once for the form).
  const _classesCache = useRef({ data: null, timestamp: 0, role: null });
  const CLASS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch classes for the current user once and cache the result.
   * - Sets `userPublicationClassIds` (used by permission checks) on every call.
   * - Sets `classes` (used by the create/edit dropdowns) only when `forForm` is true.
   */
  const loadClasses = async ({ forForm = false } = {}) => {
    const userRoleLocal = localStorage.getItem('userRole') || '';
    const userId = localStorage.getItem('userId');
    const isAdminRole = userRoleLocal.toUpperCase().includes('ADMIN');
    const isProfessorRole = userRoleLocal.toUpperCase().includes('PROFESSOR') || userRoleLocal.toUpperCase().includes('TUTOR');
    const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');

    // Use cache if still fresh for the same role
    const now = Date.now();
    const cacheKey = `${userId}-${userRoleLocal}`;
    if (
      _classesCache.current.data &&
      _classesCache.current.role === cacheKey &&
      now - _classesCache.current.timestamp < CLASS_CACHE_TTL
    ) {
      const cached = _classesCache.current.data;
      setUserPublicationClassIds(cached.map(c => c.id));
      if (forForm) setClasses(cached);
      return;
    }

    if (forForm) setLoadingClasses(true);
    try {
      let classesData = [];
      if (isAdminRole) {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/classes`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) classesData = await res.json();
      } else if (isProfessorRole) {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/droits-publication/utilisateurs/${userId}/classes`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) classesData = await res.json();
      } else {
        // Student / parent — for form selection only
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/acceder/utilisateurs/${userId}/classes`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) classesData = await res.json();
      }

      const active = classesData.filter(c => c.etat === 'ACTIF' || !c.etat);
      // Store in cache
      _classesCache.current = { data: active, role: cacheKey, timestamp: now };
      // Always update publication IDs
      setUserPublicationClassIds(active.map(c => c.id));
      // Only update the dropdown list when called from a form
      if (forForm) setClasses(active);
    } catch (err) {
      console.error('Error loading classes:', err);
      if (forForm) setClasses([]);
    } finally {
      if (forForm) setLoadingClasses(false);
    }
  };

  const openImagePreview = (images, index) => {
    setImagePreview({ isOpen: true, images, currentIndex: index });
  };

  useEffect(() => {
    const now = Date.now();
    const hasFreshCache =
      Object.keys(_cache.pages).length > 0 && (now - _cache.timestamp) < CACHE_TTL;
    if (hasFreshCache) {
      const keys = Object.keys(_cache.pages).map(Number).sort((a, b) => a - b);
      setActivities(keys.flatMap(k => _cache.pages[k]));
      setHasMore(!_cache.isLast);
      setTotalElements(_cache.totalElements || 0);
      setLoadingActivities(false);
    } else {
      loadEvents(0, true);
    }
    // Load publication rights once on mount (no form update — just IDs for permission checks)
    loadClasses({ forForm: false });
  }, []);

  useEffect(() => {
    if (formData.visibility === 'PRIVATE') loadClasses({ forForm: true });
  }, [formData.visibility]);

  useEffect(() => {
    if (editingActivity && editFormData.visibility === 'PRIVATE') loadClasses({ forForm: true });
  }, [editFormData.visibility, editingActivity]);

  // Filter activities based on active tab
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    const now = new Date();
    let filtered = [];

    switch (activeTab) {
      case 'mine':
        // Events created by the current user (creators only)
        filtered = activities.filter(a => a.createurId === currentUserId);
        break;
      case 'upcoming':
        // Events whose start time is in the future
        filtered = activities.filter(a => a.heureDebut && new Date(a.heureDebut) > now);
        break;
      case 'withMedia':
        // Events that have at least one image or video
        filtered = activities.filter(a => a.medias && a.medias.length > 0);
        break;
      case 'participating':
        // Events the current user has joined
        filtered = activities.filter(a => a.isParticipating);
        break;
      case 'past':
        // Events whose start time has already passed (viewers only)
        filtered = activities.filter(a => a.heureDebut && new Date(a.heureDebut) <= now);
        break;
      default:
        // 'all' — show everything
        filtered = activities;
    }

    // Apply class filter if active (navigated from class management)
    if (classFilterId) {
      filtered = filtered.filter(a =>
        (a.selectedClasses || []).some(id => String(id) === String(classFilterId))
      );
    }

    setFilteredActivities(filtered);
  }, [activities, activeTab, classFilterId]);

  // When the filter tab changes, reset to show only what's already loaded
  useEffect(() => {
    // no-op: filteredActivities is derived; no page reset needed for server pagination
  }, [activeTab, classFilterId]);

  // Infinite scroll on mobile: load next page when sentinel enters viewport
  useEffect(() => {
    if (!isMobile || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && hasMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isMobile, loadingMore, hasMore]);

  /** Fetch the next page and append its items to the list. */
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    try {
      await loadEvents(nextPage, false);
    } catch (e) { /* ignore */ }
    setLoadingMore(false);
  };

  /**
   * Core paginated loader.
   * @param {number}  page         0-based page index to fetch
   * @param {boolean} showSpinner  show full-screen spinner (true on initial load)
   * @param {boolean} reset        discard existing pages and start fresh (after create/edit/delete)
   */
  const loadEvents = async (page = 0, showSpinner = true, reset = false) => {
    if (showSpinner) setLoadingActivities(true);
    try {
      const pagedResult = await activityFeedService.getActivitiesPaged(page, PAGE_SIZE);
      const events = pagedResult.content || [];
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      const currentUserId = localStorage.getItem('userId');

      // Resolve unknown creator names and class names in parallel (batched, cached)
      const unknownUserIds = new Set();
      const unknownClassIds = new Set();
      events.forEach(event => {
        if (!event.createurPrenom && !event.createurNom && event.createurId) {
          if (!_cache.userNames[event.createurId]) unknownUserIds.add(event.createurId);
        }
        (event.classesIds || []).forEach(id => {
          if (!_cache.classNames[id]) unknownClassIds.add(id);
        });
      });

      await Promise.all([
        ...[...unknownUserIds].map(async (uid) => {
          try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/utilisateurs/${uid}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const d = await res.json();
              const name = `${d.prenom || ''} ${d.nom || ''}`.trim() || d.email || 'Utilisateur';
              const typeMap = { professeur: 'Professeur', eleve: 'Eleve', parent: 'Parent', gestionnaire: 'Gestionnaire', repetiteur: 'Repetiteur' };
              const role = d.admin ? 'Admin' : (typeMap[(d.type || '').toLowerCase()] || '');
              _cache.userNames[uid] = { name, role };
            }
          } catch { /* ignore */ }
        }),
        ...[...unknownClassIds].map(async (classId) => {
          try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/classes/${classId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const cls = await res.json();
              _cache.classNames[classId] = cls.nom || cls.name || null;
            }
          } catch { /* ignore */ }
        }),
      ]);

      // Map raw events to the shape the UI expects
      const mapped = events.map(event => {
        const medias = (event.medias || [])
          .filter(m => {
            const mt = (m.mediaType || '').toUpperCase();
            return (mt === 'IMAGE' || mt === 'PHOTO' || mt === 'VIDEO') && m.id;
          })
          .map(m => ({
            id: m.id,
            type: (m.mediaType || '').toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE',
            presignedUrl: m.presignedUrl || null,
            fileName: m.fileName,
            filePath: m.filePath,
            fileType: m.fileType,
            contentType: m.contentType,
            fileSize: m.fileSize,
            mediaType: m.mediaType,
            bucketName: m.bucketName || 'scholchat',
          }));

        const interactions = event.interactions || [];
        const likes = interactions.filter(i => i.type === 'LIKE').length;
        const comments = interactions
          .filter(i => i.type === 'COMMENT')
          .map(c => ({
            id: c.id,
            content: c.content,
            createdById: c.createdById,
            creationDate: c.creationDate,
            isCurrentUser: c.createdById === currentUserId,
          }));
        const isLiked = interactions.some(i => i.type === 'LIKE' && i.createdById === currentUserId);
        const participants = event.participantsIds?.length || 0;
        const isParticipating = event.participantsIds?.includes(currentUserId) || false;

        let creatorName = '';
        let creatorRole = event.createurRole || '';
        if (event.createurPrenom || event.createurNom) {
          creatorName = `${event.createurPrenom || ''} ${event.createurNom || ''}`.trim();
        } else if (event.createurId && _cache.userNames[event.createurId]) {
          creatorName = _cache.userNames[event.createurId].name;
          if (!creatorRole) creatorRole = _cache.userNames[event.createurId].role;
        }
        if (!creatorName) creatorName = 'Utilisateur';

        const classIds = event.classesIds || [];
        const classNames = classIds.map(id => _cache.classNames[id]).filter(Boolean);

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
          classNames,
          user: { name: creatorName, role: creatorRole },
          titre: event.titre,
          description: event.description,
          content: event.description,
          timestamp: event.creationDate
            ? new Date(event.creationDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : event.heureDebut
              ? new Date(event.heureDebut).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : '',
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
          creationDate: event.creationDate,
          visibility: event.visibility || 'PUBLIC',
          selectedClasses: classIds,
          createurId: event.createurId,
        };
      });

      // Update cache
      if (reset) {
        _cache.pages = {};
      }
      _cache.pages[page] = mapped;
      _cache.totalElements = pagedResult.totalElements;
      _cache.totalPages = pagedResult.totalPages;
      _cache.isLast = pagedResult.last;
      _cache.timestamp = Date.now();

      // Rebuild the activities list from all cached pages in order
      const allKeys = Object.keys(_cache.pages).map(Number).sort((a, b) => a - b);
      const allActivities = allKeys.flatMap(k => _cache.pages[k]);

      setActivities(allActivities);
      setCurrentPage(page);
      setHasMore(!pagedResult.last);
      setTotalElements(pagedResult.totalElements);
    } catch (error) {
      console.error('Error loading activities (page', page, '):', error);
      if (Object.keys(_cache.pages).length === 0) setActivities([]);
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
      setCreateFormError(t('activities.validation.requiredFields', 'Veuillez remplir tous les champs obligatoires.'));
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
      setCreateFormError("");
      setShowCreateForm(false);
      _cache.pages = {};
      await loadEvents(0, true, true);
    } catch (error) {
      console.error('Error creating event:', error);
      const msg = error?.response?.data?.message || error?.response?.data || error?.message || t('activities.errors.createEventFailed', 'Échec de la création de l\'événement');
      setCreateFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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

  const openEditModal = (activity) => {
    setEditFormData({
      titre: activity.titre || '',
      description: activity.description || '',
      lieu: activity.eventDetails?.location || '',
      heureDebut: activity.eventDetails?.startTime ? activity.eventDetails.startTime.slice(0, 16) : '',
      heureFin: activity.eventDetails?.endTime ? activity.eventDetails.endTime.slice(0, 16) : '',
      visibility: activity.visibility || 'PUBLIC',
      classesIds: activity.selectedClasses || [],
      existingMedias: activity.medias || [],
    });
    setEditUploadedImages([]);
    setEditingActivity(activity);
  };

  const handleEditImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setEditUploading(true);
    const newMedia = files
      .filter(f => {
        const max = f.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        if (f.size > max) { alert(`${f.name} est trop volumineux`); return false; }
        return true;
      })
      .map(f => ({ file: f, url: URL.createObjectURL(f), name: f.name, type: f.type.startsWith('video/') ? 'VIDEO' : 'IMAGE', contentType: f.type }));
    setEditUploadedImages(prev => [...prev, ...newMedia]);
    setEditUploading(false);
  };

  const handleEditEvent = async () => {
    if (!editFormData.titre || !editFormData.description || !editFormData.lieu || !editFormData.heureDebut) return;
    if (editFormData.heureFin && new Date(editFormData.heureFin) <= new Date(editFormData.heureDebut)) {
      alert("La date de fin doit être postérieure à la date de début.");
      return;
    }
    setEditLoading(true);
    try {
      const uploadedMedia = [...(editFormData.existingMedias || []).map(m => ({
        id: m.id,                              // keep ID so backend treats this as "preserve, not new"
        fileName: m.fileName || m.name,
        filePath: m.filePath || m.url,
        fileType: m.fileType || m.type || 'IMAGE',
        contentType: m.contentType,
        fileSize: m.fileSize,
        mediaType: m.mediaType || m.type || 'IMAGE',
        bucketName: m.bucketName || 'scholchat',
      }))];

      if (editUploadedImages.length > 0) {
        setEditUploading(true);
        for (const media of editUploadedImages) {
          try {
            const result = await minioS3Service.uploadFile(media.file, media.type === 'VIDEO' ? 'videos' : 'images');
            uploadedMedia.push({ fileName: result.fileName, filePath: result.filePath, contentType: result.contentType, fileSize: result.fileSize, mediaType: media.type, bucketName: 'scholchat' });
          } catch (e) { console.error('Upload error:', e); }
        }
        setEditUploading(false);
      }

      await activityFeedService.editEvent(editingActivity.id, {
        ...editFormData,
        etat: 'PLANIFIE',
        classesIds: editFormData.visibility === 'PRIVATE' ? editFormData.classesIds : [],
        medias: uploadedMedia,
      });
      setEditingActivity(null);
      setEditUploadedImages([]);
      _cache.pages = {};
      await loadEvents(0, true, true);
    } catch (error) {
      console.error('Error updating event:', error);
      alert(`Échec de la mise à jour: ${error.message}`);
    } finally {
      setEditLoading(false);
      setEditUploading(false);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeleteEvent = async (activityId) => {
    setConfirmDeleteId(null);
    setDeletingId(activityId);
    try {
      await activityFeedService.deleteEvent(activityId);
      setActivities(prev => prev.filter(a => a.id !== activityId));
      // Evict from page cache so the deleted item doesn't reappear on next load
      Object.keys(_cache.pages).forEach(k => {
        _cache.pages[k] = _cache.pages[k].filter(a => a.id !== activityId);
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Échec de la suppression: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = async () => {
    setCreateFormError("");
    if (!formData.titre || !formData.description || !formData.lieu || !formData.heureDebut) {
      setCreateFormError(t('activities.validation.requiredFields', 'Veuillez remplir tous les champs obligatoires.'));
      return;
    }
    if (formData.heureFin && new Date(formData.heureFin) <= new Date(formData.heureDebut)) {
      setCreateFormError("La date de fin doit être postérieure à la date de début.");
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
        classesIds: formData.visibility === 'PRIVATE' ? formData.selectedClasses : [],
        participantsIds: [],
        medias: uploadedMedia,
        interactions: []
      };

      await activityFeedService.createEvent(eventData);

      setShowCreateForm(false);
      setCreateFormError("");
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
      
      // Small delay to let the backend fully persist media before re-fetching
      await new Promise(resolve => setTimeout(resolve, 800));
      _cache.pages = {};
      await loadEvents(0, true, true);
      
    } catch (error) {
      console.error('Error creating event:', error);
      const msg = error?.response?.data?.message || error?.response?.data || error?.message || t('activities.errors.createEventFailed', 'Échec de la création de l\'événement');
      setCreateFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const modalOpen = showCreateForm || !!editingActivity;

  return (
    <MediaSuspendedContext.Provider value={modalOpen}>
    <div className="relative -mx-[30px] -mt-4">
      {/* Facebook-like Layout: Sidebar + Main Content */}
      <div className={`w-full px-4 lg:px-6 ${isMobile ? 'pb-32' : ''}`}>
        <div className="flex gap-0 lg:gap-6">
          {/* Left Sidebar - Hidden on mobile, visible on desktop */}
          <aside className="hidden lg:block lg:w-80 xl:w-96 lg:flex-shrink-0">
            <div className="sticky top-20 space-y-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              {sidebarTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                // Count badge for each filter
                const currentUserId = localStorage.getItem('userId');
                const now = new Date();
                const counts = {
                  // 'all' uses the server total so it reflects unloaded pages too
                  all: totalElements || activities.length,
                  mine: activities.filter(a => a.createurId === currentUserId).length,
                  upcoming: activities.filter(a => a.heureDebut && new Date(a.heureDebut) > now).length,
                  withMedia: activities.filter(a => a.medias && a.medias.length > 0).length,
                  participating: activities.filter(a => a.isParticipating).length,
                  past: activities.filter(a => a.heureDebut && new Date(a.heureDebut) <= now).length,
                };
                const count = counts[item.key] ?? 0;
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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-100 dark:bg-blue-800' : item.bg}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : item.color}`} />
                    </div>
                    <span className="text-sm flex-1 truncate">{item.label}</span>
                    {count > 0 && (
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                        isActive
                          ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {count}
                      </span>
                    )}
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
            <div className={`w-full ${isMobile ? 'px-0 py-2' : 'px-0 sm:px-4 py-4 sm:py-6'}`}>
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
                  {sidebarTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3.5 py-1.5 text-xs font-medium whitespace-nowrap rounded-full transition-all ${
                        activeTab === tab.key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {tab.labelMobile}
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
                    if (e.target === e.currentTarget) { setShowCreateForm(false); setCreateFormError(""); }
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
                        onClick={() => { setShowCreateForm(false); setCreateFormError(""); }}
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
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            style={{ color: '#111111' }}
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
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all font-medium"
                            style={{ color: '#111111' }}
                            placeholder={t('activities.form.descriptionPlaceholder', 'Décrivez votre événement...')}
                          />
                        </div>

                        {/* Visibility toggle — full width */}
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            {t('activities.form.status', 'Visibilité')}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleInputChange("visibility", "PUBLIC")}
                              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 font-bold text-xs transition-all ${
                                formData.visibility === "PUBLIC"
                                  ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300"
                                  : "bg-gray-50 border-gray-100 text-gray-500 dark:bg-gray-900 dark:border-white/5 dark:text-gray-400 hover:border-gray-300"
                              }`}
                            >
                              <Globe className="w-4 h-4 flex-shrink-0" />
                              <span className="uppercase tracking-widest text-[10px]">Public</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInputChange("visibility", "PRIVATE")}
                              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 font-bold text-xs transition-all ${
                                formData.visibility === "PRIVATE"
                                  ? "bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-300"
                                  : "bg-gray-50 border-gray-100 text-gray-500 dark:bg-gray-900 dark:border-white/5 dark:text-gray-400 hover:border-gray-300"
                              }`}
                            >
                              <Lock className="w-4 h-4 flex-shrink-0" />
                              <span className="uppercase tracking-widest text-[10px]">Privé</span>
                            </button>
                          </div>
                        </div>

                        {/* Classes — directly below Privé, scrollable for many classes */}
                        {formData.visibility === "PRIVATE" && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                              {t('activities.form.selectClasses', 'Classes Concernées')} *
                            </label>
                            {loadingClasses ? (
                              <div className="flex items-center space-x-2 py-3">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Recherche des classes ...</span>
                              </div>
                            ) : classes.length === 0 ? (
                              <p className="text-xs text-gray-400 py-2">Aucune classe disponible</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 border border-gray-100 dark:border-white/5 rounded-2xl p-2">
                                {classes.map((cls) => (
                                  <label
                                    key={cls.id}
                                    className={`flex items-center space-x-2 p-3 rounded-xl border transition-all cursor-pointer ${
                                      formData.selectedClasses?.includes(cls.id)
                                        ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                        : 'bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-white/5 hover:border-purple-200'
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
                                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-tighter truncate dark:text-white">{cls.nom || cls.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Lieu — below classes */}
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
                              className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                              style={{ color: '#111111' }}
                              placeholder={t('activities.form.locationPlaceholder', 'Ex: Salle 101')}
                            />
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
                              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-xs"
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
                              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-xs"
                            />
                          </div>
                        </div>

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
                    <div className="sticky bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 p-6 flex flex-col gap-3 z-20" style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom, 24px) + 24px)' : '24px' }}>
                      {createFormError && (
                        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-xs font-medium">
                          <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{createFormError}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => { setShowCreateForm(false); setCreateFormError(""); }}
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
                  </div>
                </motion.div>
              )}

              {/* Activities Feed */}
              {/* Class filter banner */}
              {classFilterId && (
                <div className="mb-3 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-2">
                  <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                    Classe filtrée
                  </span>
                  <button onClick={() => { setClassFilterId(null); setClassFilterName(""); }} className="text-amber-400 hover:text-amber-600 text-xs font-bold">✕</button>
                </div>
              )}

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
                      {activeTab === 'all'
                        ? t('activities.noActivities.title', 'Aucune activité')
                        : `Aucun contenu dans "${sidebarTabs.find(t => t.key === activeTab)?.label ?? activeTab}"`
                      }
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
                  <>
                  {filteredActivities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-sm overflow-hidden"
                    >
                      {/* Post Header */}
                      <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
                        <div className={`flex items-center ${isMobile ? 'gap-2 mb-2' : 'gap-3 mb-3'}`}>
                          <div className={`${isMobile ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}>
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
                            </div>
                            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400`}>
                              {activity.timestamp}
                            </p>
                          </div>
                          {(() => {
                            const currentUserId = localStorage.getItem('userId');
                            const isCreator = activity.createurId === currentUserId;
                            const hasPublicationRight = activity.selectedClasses && activity.selectedClasses.some(classId => userPublicationClassIds.includes(classId));
                            const canEdit = isAdmin || isCreator || hasPublicationRight;

                            return canEdit && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => openEditModal(activity)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                  title="Modifier"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(activity.id)}
                                  disabled={deletingId === activity.id}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-50"
                                  title="Supprimer"
                                >
                                  {deletingId === activity.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Trash2 className="w-4 h-4" />}
                                </button>
                              </div>
                            );
                          })()}
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

                        {/* Event details badge - Location left, dates right on desktop */}
                        {(activity.eventDetails?.location || activity.eventDetails?.startTime || activity.eventDetails?.endTime) && (
                          <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 mb-1`}>
                            {/* Location — left */}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              {activity.eventDetails?.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  {activity.eventDetails.location}
                                </span>
                              )}
                            </div>
                            {/* Dates — right on desktop, below on mobile */}
                            {(activity.eventDetails?.startTime || activity.eventDetails?.endTime) && (
                              <div className="flex items-center gap-1 sm:justify-end flex-shrink-0 flex-wrap">
                                <Calendar className="w-3 h-3 flex-shrink-0 text-blue-500" />
                                {activity.eventDetails?.startTime && (
                                  <span className="font-medium text-gray-600 dark:text-gray-300">
                                    du {new Date(activity.eventDetails.startTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                                {activity.eventDetails?.endTime && (
                                  <>
                                    <Clock className="w-3 h-3 flex-shrink-0 text-orange-400" />
                                    <span className="font-medium text-gray-600 dark:text-gray-300">
                                      au {new Date(activity.eventDetails.endTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {activity.classNames && activity.classNames.length > 0 && (
                          <div className={`flex items-center gap-2 flex-wrap ${isMobile ? 'text-xs' : 'text-sm'} mb-1`}>
                            {activity.classNames.map((name, i) => (
                              <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full text-[11px] font-medium">
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Media Gallery - Facebook-style grid, lazy-loaded */}
                      {activity.medias && activity.medias.length > 0 && (
                        <div className="w-full overflow-hidden">
                        {(() => {
                        const medias = activity.medias;
                        const imageIds = medias.filter(m => m.type === 'IMAGE').map(m => m.id);

                        const MediaItem = ({ media, index, className, overlay }) => (
                          <LazyMedia
                            mediaId={media.id}
                            mediaType={media.type}
                            presignedUrl={media.presignedUrl || null}
                            className={`cursor-pointer group ${className}`}
                            overlay={overlay}
                            onClick={() => {
                              if (media.type === 'IMAGE') {
                                openImagePreview(imageIds, imageIds.indexOf(media.id));
                              }
                            }}
                          />
                        );

                        if (medias.length === 1) return (
                          <MediaItem media={medias[0]} index={0} className="w-full h-72 sm:h-96" />
                        );
                        if (medias.length === 2) return (
                          <div className="flex gap-0.5 h-64 sm:h-80">
                            <MediaItem media={medias[0]} index={0} className="flex-1" />
                            <MediaItem media={medias[1]} index={1} className="flex-1" />
                          </div>
                        );
                        if (medias.length === 3) return (
                          <div className="flex gap-0.5 h-64 sm:h-80">
                            <MediaItem media={medias[0]} index={0} className="flex-[2]" />
                            <div className="flex flex-col gap-0.5 flex-1">
                              <MediaItem media={medias[1]} index={1} className="flex-1" />
                              <MediaItem media={medias[2]} index={2} className="flex-1" />
                            </div>
                          </div>
                        );
                        const shown = medias.slice(0, 4);
                        const remaining = medias.length - 4;
                        return (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex gap-0.5 h-48 sm:h-56">
                              <MediaItem media={shown[0]} index={0} className="flex-1" />
                              <MediaItem media={shown[1]} index={1} className="flex-1" />
                            </div>
                            <div className="flex gap-0.5 h-48 sm:h-56">
                              <MediaItem media={shown[2]} index={2} className="flex-1" />
                              <MediaItem media={shown[3]} index={3} className="flex-1" overlay={remaining > 0 ? `+${remaining}` : null} />
                            </div>
                          </div>
                        );
                      })()}
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
                  ))}

                  {/* Load More / All Caught Up */}
                  {hasMore ? (
                    <div ref={sentinelRef} className="flex justify-center py-4">
                      {isMobile ? (
                        loadingMore && <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      ) : (
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all disabled:opacity-60"
                        >
                          {loadingMore ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-blue-600" />
                          )}
                          {loadingMore ? "Chargement..." : "Voir plus"}
                          {!loadingMore && totalElements > activities.length && (
                            <span className="text-xs text-gray-400 font-normal">
                              ({totalElements - activities.length} restant{totalElements - activities.length > 1 ? "s" : ""})
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ) : filteredActivities.length > 0 ? (
                    <div className="flex items-center justify-center gap-3 py-6">
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">Vous êtes à jour</span>
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    </div>
                  ) : null}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Image Preview Modal — resolves full URL on demand */}
      {imagePreview.isOpen && (
        <div
          className="fixed bg-black/75 backdrop-blur-sm z-[500] flex items-center justify-center"
          style={{ top: '70px', bottom: 0, left: isMobile ? 0 : '280px', right: 0 }}
          onClick={closeImagePreview}
        >
          {imagePreview.images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); navigateImage("prev"); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-full transition-all z-10">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); navigateImage("next"); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-full transition-all z-10">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <button onClick={closeImagePreview}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-full transition-all z-10">
            <X className="w-5 h-5" />
          </button>
          {/* Resolve full URL for the lightbox image */}
          <LightboxImage
            mediaId={imagePreview.images[imagePreview.currentIndex]}
            onClick={(e) => e.stopPropagation()}
          />
          {imagePreview.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-medium">
              {imagePreview.currentIndex + 1} / {imagePreview.images.length}
            </div>
          )}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteId(null); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
          >
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white text-center mb-2">Supprimer l'événement</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Cette action est irréversible. L'événement sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteEvent(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId === confirmDeleteId
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Suppression...</span></>
                  : <span>Supprimer</span>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Event Modal */}
      {editingActivity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`fixed inset-0 z-[1100] flex ${isMobile ? 'items-end' : 'items-center justify-center p-4'} bg-black/60 backdrop-blur-sm`}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingActivity(null); }}
        >
          <div className={`bg-white dark:bg-gray-800 shadow-2xl w-full ${isMobile ? 'h-[92vh] rounded-t-[32px]' : 'max-w-2xl max-h-[90vh] rounded-2xl'} overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-5 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Modifier l'événement</h2>
              <button onClick={() => setEditingActivity(null)} className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-2xl transition-all">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4 no-scrollbar pb-40">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Titre *</label>
                <input type="text" value={editFormData.titre} onChange={(e) => setEditFormData(p => ({ ...p, titre: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description *</label>
                <textarea rows={4} value={editFormData.description} onChange={(e) => setEditFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Lieu *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input type="text" value={editFormData.lieu} onChange={(e) => setEditFormData(p => ({ ...p, lieu: e.target.value }))}
                      className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Visibilité</label>
                  <div className="relative">
                    <select value={editFormData.visibility} onChange={(e) => setEditFormData(p => ({ ...p, visibility: e.target.value }))}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold">
                      <option value="PUBLIC">🌍 Public</option>
                      <option value="PRIVATE">🔒 Privé</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Début *</label>
                  <input type="datetime-local" value={editFormData.heureDebut} onChange={(e) => setEditFormData(p => ({ ...p, heureDebut: e.target.value }))}
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Fin</label>
                  <input type="datetime-local" value={editFormData.heureFin} onChange={(e) => setEditFormData(p => ({ ...p, heureFin: e.target.value }))}
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs" />
                </div>
              </div>

              {/* Classes selector */}
              {editFormData.visibility === 'PRIVATE' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Classes concernées *</label>
                  {loadingClasses ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Recherche des classes...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
                      {classes.map((cls) => (
                        <label key={cls.id} className={`flex items-center space-x-2 p-3 rounded-xl border transition-all cursor-pointer ${
                          editFormData.classesIds?.includes(cls.id)
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                            : 'bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-white/5'
                        }`}>
                          <input type="checkbox"
                            checked={editFormData.classesIds?.includes(cls.id) || false}
                            onChange={(e) => {
                              const id = cls.id;
                              setEditFormData(p => ({
                                ...p,
                                classesIds: e.target.checked
                                  ? [...(p.classesIds || []), id]
                                  : (p.classesIds || []).filter(c => c !== id)
                              }));
                            }}
                            className="w-4 h-4 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-tighter truncate dark:text-white">{cls.nom || cls.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Existing media */}
              {editFormData.existingMedias && editFormData.existingMedias.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Médias actuels</label>
                  <div className="grid grid-cols-3 gap-3">
                    {editFormData.existingMedias.map((media, i) => (
                      <div key={i} className="relative group aspect-square">
                        {media.type === 'VIDEO' ? (
                          <video src={media.presignedUrl || media.url} className="w-full h-full object-cover rounded-xl shadow-md" />
                        ) : media.presignedUrl || media.url ? (
                          <SafeImg src={media.presignedUrl || media.url} className="w-full h-full object-cover rounded-xl shadow-md" />
                        ) : (
                          <ExistingMediaThumb mediaId={media.id} />
                        )}
                        <button
                          onClick={() => setEditFormData(p => ({ ...p, existingMedias: p.existingMedias.filter((_, idx) => idx !== i) }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg hover:scale-110 transition-transform">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New media upload */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ajouter des médias</label>
                <div onClick={() => editFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/10 transition-all cursor-pointer">
                  {editUploading
                    ? <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                    : <Image className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto" />}
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Photos ou Vidéos (max 50Mo)</p>
                </div>
                <input ref={editFileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleEditImageUpload} className="hidden" />
              </div>
              {editUploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {editUploadedImages.map((media, i) => (
                    <div key={i} className="relative group aspect-square">
                      {media.type === 'VIDEO'
                        ? <video src={media.url} className="w-full h-full object-cover rounded-xl shadow-md" />
                        : <img src={media.url} alt="new" className="w-full h-full object-cover rounded-xl shadow-md" />}
                      <button onClick={() => setEditUploadedImages(p => p.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg hover:scale-110 transition-transform">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 p-6 flex gap-4 z-20"
              style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom, 24px) + 24px)' : '24px' }}>
              <button onClick={() => setEditingActivity(null)}
                className="flex-1 py-4 text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all">
                Annuler
              </button>
              <button onClick={handleEditEvent}
                disabled={editLoading || !editFormData.titre || !editFormData.description || !editFormData.lieu || !editFormData.heureDebut}
                className="flex-[2] py-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl disabled:grayscale disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {editLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Enregistrement...</span></> : <span>Enregistrer</span>}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
    </MediaSuspendedContext.Provider>
  );
};

export default ActivitiesContent;