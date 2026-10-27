import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { coursService } from "../../../../../services/CoursService";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { minioS3Service } from "../../../../../services/minioS3";
import RichTextEditor from "../../../../../components/richtext/RichTextEditor";
import { isRichHtmlEmpty, richHtmlToText } from "../../../../../components/richtext/sanitizeRichHtml";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faChevronDown,
  faChevronUp,
  faCircleExclamation,
  faCircleXmark,
  faFileLines,
  faFloppyDisk,
  faPencil,
  faPlus,
  faSpinner,
  faTrashCan,
  faUserGroup,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
const chapterSchema = yup.object().shape({
  titre: yup.string().required("Le titre du chapitre est requis"),
  description: yup.string(),
  contenu: yup.string().required("Le contenu du chapitre est requis"),
  ordre: yup.number().required(),
});
const courseSchema = yup.object().shape({
  titre: yup.string().required("Le titre est requis"),
  description: yup.string().required("La description est requise"),
  matieres: yup
    .array()
    .of(yup.string().required())
    .min(1, "Au moins une matière est requise"),
  references: yup.string(),
  restriction: yup.string().required("La restriction est requise"),
});
const ChapterCard = ({
  chapter,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  loading = false,
}) => {
  const truncateText = (text, length) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };
  const getPlainText = (html) => richHtmlToText(html || "");
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow relative group ${loading ? "opacity-50 pointer-events-none" : ""}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg z-10">
          <FontAwesomeIcon
            icon={faSpinner}
            className="animate-spin text-indigo-600"
            style={{
              fontSize: 20,
            }}
          />
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
              Chapitre {index + 1}
            </span>
          </div>
          <h4 className="font-semibold text-slate-900 text-sm mb-1 truncate">
            {truncateText(chapter.titre, 40)}
          </h4>
          {chapter.description && (
            <p className="text-slate-600 text-xs mb-2">
              {truncateText(chapter.description, 60)}
            </p>
          )}
          <p className="text-slate-500 text-xs line-clamp-2">
            {truncateText(getPlainText(chapter.contenu), 80)}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {canMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Déplacer vers le haut"
            >
              <FontAwesomeIcon
                icon={faChevronUp}
                style={{
                  fontSize: 14,
                }}
              />
            </button>
          )}
          {canMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Déplacer vers le bas"
            >
              <FontAwesomeIcon
                icon={faChevronDown}
                style={{
                  fontSize: 14,
                }}
              />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Modifier"
          >
            <FontAwesomeIcon
              icon={faPencil}
              style={{
                fontSize: 14,
              }}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (
                window.confirm(
                  "Êtes-vous sûr de vouloir supprimer ce chapitre ?",
                )
              ) {
                onDelete();
              }
            }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Supprimer"
          >
            <FontAwesomeIcon
              icon={faTrashCan}
              style={{
                fontSize: 14,
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
const ChapterEditor = ({
  mode,
  initialData,
  totalChapters,
  onSave,
  onCancel,
  onFileAdd,
  onFileRemove,
  pendingFiles,
}) => {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    contenu: "",
    ordre: 0,
  });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (initialData) {
      setFormData({
        titre: initialData.titre || "",
        description: initialData.description || "",
        contenu: initialData.contenu || "",
        ordre: initialData.ordre || (mode === "create" ? totalChapters + 1 : 0),
      });
    }
  }, [initialData, mode, totalChapters]);
  const validateForm = () => {
    const newErrors = {};
    if (!formData.titre.trim()) {
      newErrors.titre = "Le titre est requis";
    }
    if (isRichHtmlEmpty(formData.contenu)) {
      newErrors.contenu = "Le contenu est requis";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSave = () => {
    if (validateForm()) {
      onSave({
        ...formData,
        ordre: mode === "create" ? totalChapters + 1 : formData.ordre,
      });
      if (mode === "create") {
        setFormData({
          titre: "",
          description: "",
          contenu: "",
          ordre: totalChapters + 1,
        });
        setErrors({});
      }
    }
  };
  const chapterNumber = mode === "create" ? totalChapters + 1 : formData.ordre;
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-indigo-200 shadow-sm mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FontAwesomeIcon
            icon={faFileLines}
            className="text-indigo-600"
            style={{
              fontSize: 20,
            }}
          />
          <span className="hidden sm:inline">
            {mode === "create"
              ? `Nouveau Chapitre ${chapterNumber}`
              : `Modifier Chapitre ${chapterNumber}`}
          </span>
          <span className="sm:hidden">
            {mode === "create"
              ? `Ch. ${chapterNumber}`
              : `Modifier Ch. ${chapterNumber}`}
          </span>
        </h4>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Annuler"
        >
          <FontAwesomeIcon
            icon={faCircleXmark}
            style={{
              fontSize: 18,
            }}
          />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Titre du chapitre *
          </label>
          <input
            type="text"
            value={formData.titre}
            onChange={(e) =>
              setFormData({
                ...formData,
                titre: e.target.value,
              })
            }
            onClick={(e) => e.stopPropagation()}
            className={`w-full px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.titre ? "border-red-300 bg-red-50" : "border-slate-200"}`}
            placeholder="Titre du chapitre"
          />
          {errors.titre && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mr-1"
                style={{
                  fontSize: 14,
                }}
              />
              {errors.titre}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description du chapitre
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
            onClick={(e) => e.stopPropagation()}
            rows={2}
            className="w-full px-3 py-2 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
            placeholder="Description du chapitre"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Contenu du chapitre *
          </label>
          <RichTextEditor
            value={formData.contenu}
            onChange={(content) =>
              setFormData((prev) => ({
                ...prev,
                contenu: content,
              }))
            }
            placeholder="Contenu détaillé du chapitre..."
            onFileAdd={onFileAdd}
            onFileRemove={onFileRemove}
            pendingFiles={pendingFiles}
          />
          {errors.contenu && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mr-1"
                style={{
                  fontSize: 14,
                }}
              />
              {errors.contenu}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-12 mt-4 sm:mt-6">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }}
          className="px-4 py-2 sm:py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors border border-slate-200 rounded-lg hover:bg-slate-50 "
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
          }}
          className="px-4 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon
            icon={faFloppyDisk}
            style={{
              fontSize: 16,
            }}
          />
          {mode === "create" ? "Ajouter" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
};
const SuccessModal = ({ show, message, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right duration-300">
      <div className="w-2 h-2 bg-white rounded-full"></div>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-green-600 rounded p-1">
        <FontAwesomeIcon
          icon={faXmark}
          style={{
            fontSize: 16,
          }}
        />
      </button>
    </div>
  );
};
const CreateCourseComponent = ({
  onBack,
  subjects,
  setSuccess,
  setError,
  loadCourses,
  setLoading,
  editMode = false,
  courseToEdit = null,
}) => {
  const [selectedMatiereIds, setSelectedMatiereIds] = useState([]);
  const [savedChapters, setSavedChapters] = useState([]);
  const [activeEditor, setActiveEditor] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState(new Map());
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      matieres: [],
      restriction: "PRIVE",
      chapitres: [],
    },
  });
  const watchedMatiereIds = watch("matieres");
  useEffect(() => {
    setSelectedMatiereIds(watchedMatiereIds || []);
  }, [watchedMatiereIds]);

  // Extracts relative storage key from a full Wasabi/MinIO URL (never use raw URLs)
  const toRelativePath = (raw) => {
    if (!raw || !raw.startsWith("http")) return raw;
    try {
      const pathname = new URL(raw).pathname.replace(/^\//, "");
      const idx = pathname.indexOf("users/");
      if (idx >= 0) return pathname.slice(idx);
      const parts = pathname.split("/");
      return parts.length > 1 ? parts.slice(1).join("/") : pathname;
    } catch {
      return raw;
    }
  };

  // Returns true for any URL that points to stored media (not backend proxy, not blob)
  const isStorageUrl = (url) => {
    if (!url) return false;
    if (url.startsWith("blob:")) return false; // local blob — handled by upload flow
    const apiBase = process.env.REACT_APP_API_BASE_URL || "";
    if (apiBase && url.startsWith(apiBase)) return false; // already a backend proxy URL
    return url.startsWith("http");
  };

  // Refresh presigned MinIO URLs inside HTML chapter content
  const refreshChapterContentUrls = async (html) => {
    if (!html) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<div id="root">${html}</div>`,
      "text/html",
    );
    const root = doc.getElementById("root");
    const refreshUrl = async (url) => {
      try {
        const data = await minioS3Service.generateDownloadUrlByPath(
          toRelativePath(url),
        );
        return data?.downloadUrl || url;
      } catch {
        return url;
      }
    };
    const tasks = [
      ...Array.from(root.querySelectorAll("img")).map(async (img) => {
        const src = img.getAttribute("src");
        if (isStorageUrl(src)) img.setAttribute("src", await refreshUrl(src));
      }),
      ...Array.from(root.querySelectorAll("video")).map(async (video) => {
        const src = video.getAttribute("src");
        if (isStorageUrl(src)) video.setAttribute("src", await refreshUrl(src));
        video.querySelectorAll("source").forEach(async (s) => {
          const ssrc = s.getAttribute("src");
          if (isStorageUrl(ssrc)) s.setAttribute("src", await refreshUrl(ssrc));
        });
      }),
      ...Array.from(root.querySelectorAll("a[href]")).map(async (a) => {
        const href = a.getAttribute("href");
        if (isStorageUrl(href)) a.setAttribute("href", await refreshUrl(href));
      }),
    ];
    await Promise.all(tasks);
    return root.innerHTML;
  };

  // Initialize form with existing course data in edit mode
  useEffect(() => {
    if (editMode && courseToEdit) {
      setValue("titre", courseToEdit.titre || "");
      setValue("description", courseToEdit.description || "");
      setValue("restriction", courseToEdit.restriction || "PRIVE");
      setValue("references", courseToEdit.references || "");
      const matiereIds = courseToEdit.matieres?.map((m) => String(m.id)) || [];
      setSelectedMatiereIds(matiereIds);
      setValue("matieres", matiereIds);
      if (courseToEdit.chapitres && courseToEdit.chapitres.length > 0) {
        const sortedChapters = [...courseToEdit.chapitres].sort(
          (a, b) => a.ordre - b.ordre,
        );
        // Refresh presigned URLs in chapter content before displaying
        Promise.all(
          sortedChapters.map(async (ch) => ({
            ...ch,
            contenu: await refreshChapterContentUrls(ch.contenu),
          })),
        ).then(setSavedChapters);
      }
    }
  }, [editMode, courseToEdit, setValue]);
  const [uploadProgress, setUploadProgress] = useState(null); // { done, total, percent, name }
  const handleFileAdd = (fileId, file) => {
    setPendingFiles((prev) => new Map(prev).set(fileId, file));
  };
  const handleFileRemove = (fileId) => {
    setPendingFiles((prev) => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  };
  // Uploads only the pending files still referenced by a chapter (a file whose
  // placeholder was deleted from the text is not sent), with progress.
  const uploadPendingFiles = async (chapters) => {
    const allContent = chapters.map((c) => c.contenu || "").join("\n");
    const toUpload = Array.from(pendingFiles.entries()).filter(([fileId]) =>
      allContent.includes(`data-file-id="${fileId}"`),
    );
    const fileMap = new Map();
    if (toUpload.length === 0) return fileMap;
    const totalBytes = toUpload.reduce((n, [, f]) => n + (f.size || 0), 0) || 1;
    const loaded = new Map();
    let done = 0;
    const report = (name) =>
      setUploadProgress({
        done,
        total: toUpload.length,
        name,
        percent: Math.min(
          100,
          Math.round(
            (Array.from(loaded.values()).reduce((n, v) => n + v, 0) / totalBytes) * 100,
          ),
        ),
      });
    report(toUpload[0][1].name);
    await Promise.all(
      toUpload.map(async ([fileId, file]) => {
        let documentType = "documents";
        let mediaType = "DOCUMENT";
        if (file.type.startsWith("image/")) {
          documentType = "images";
          mediaType = "IMAGE";
        } else if (file.type.startsWith("video/")) {
          documentType = "videos";
          mediaType = "VIDEO";
        }
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueFileName = `${Date.now()}_${cleanFileName}`;
        try {
          const result = await minioS3Service.uploadFile(
            new File([file], uniqueFileName, { type: file.type }),
            mediaType,
            documentType,
            null,
            null,
            (bytes) => {
              loaded.set(fileId, Math.min(bytes, file.size));
              report(file.name);
            },
          );
          loaded.set(fileId, file.size);
          done += 1;
          report(file.name);
          const downloadData = await minioS3Service.generateDownloadUrlByPath(
            result.filePath,
          );
          fileMap.set(fileId, {
            url: downloadData.downloadUrl,
            name: file.name,
            type: file.type,
            size: file.size,
          });
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw new Error(
            `Échec de l'envoi de « ${file.name} » : ${error.message || "erreur réseau"}`,
          );
        }
      }),
    );
    return fileMap;
  };
  const updateContentWithUploadedFiles = (content, fileUrlMap) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<div id="root">${content}</div>`,
      "text/html",
    );
    const root = doc.getElementById("root");
    const urlOf = (id) => fileUrlMap.get(id)?.url;

    // Images / videos carry data-file-id themselves
    root.querySelectorAll("img[data-file-id]").forEach((img) => {
      const url = urlOf(img.dataset.fileId);
      if (url) img.setAttribute("src", url);
    });
    root.querySelectorAll("video[data-file-id]").forEach((video) => {
      const url = urlOf(video.dataset.fileId);
      if (url) video.setAttribute("src", url);
    });

    // New attachment chips: name placeholder -> real link
    root.querySelectorAll(".rc-attachment[data-file-id]").forEach((chip) => {
      const info = fileUrlMap.get(chip.dataset.fileId);
      const nameEl = chip.querySelector(".rc-attachment-name");
      if (!info || !nameEl) return;
      const anchor = doc.createElement("a");
      anchor.href = info.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute("data-file-name", info.name);
      anchor.setAttribute("data-file-type", info.type || "");
      anchor.setAttribute("data-file-size", String(info.size || ""));
      anchor.textContent = info.name;
      nameEl.replaceWith(anchor);
    });

    // Legacy file blocks: replace the name span with a link
    root
      .querySelectorAll("div[data-file-id]:not(.rc-attachment):not(.rc-figure)")
      .forEach((div) => {
        const info = fileUrlMap.get(div.dataset.fileId);
        if (!info || div.querySelector("img,video,a")) return;
        const nameSpan = div.querySelector("span:last-child");
        const anchor = doc.createElement("a");
        anchor.href = info.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.setAttribute("data-file-name", info.name);
        anchor.textContent = nameSpan?.textContent || info.name;
        if (nameSpan) nameSpan.replaceWith(anchor);
        else div.appendChild(anchor);
      });
    return root.innerHTML;
  };
  const handleSaveChapter = (chapterData) => {
    if (activeEditor === "edit" && editingIndex !== null) {
      const updatedChapters = [...savedChapters];
      updatedChapters[editingIndex] = {
        ...updatedChapters[editingIndex],
        ...chapterData,
      };
      setSavedChapters(updatedChapters);
    } else {
      const newChapter = {
        id: null,
        ...chapterData,
        ordre: savedChapters.length + 1,
      };
      setSavedChapters([...savedChapters, newChapter]);
    }
    setActiveEditor(null);
    setEditingData(null);
    setEditingIndex(null);
  };
  const handleEditChapter = (index) => {
    setActiveEditor("edit");
    setEditingData({
      ...savedChapters[index],
    });
    setEditingIndex(index);
  };
  const handleDeleteChapter = (index) => {
    const updatedChapters = savedChapters.filter((_, i) => i !== index);
    const reorderedChapters = updatedChapters.map((chapter, i) => ({
      ...chapter,
      ordre: i + 1,
    }));
    setSavedChapters(reorderedChapters);
  };
  const moveChapter = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < savedChapters.length) {
      const updatedChapters = [...savedChapters];
      [updatedChapters[index], updatedChapters[newIndex]] = [
        updatedChapters[newIndex],
        updatedChapters[index],
      ];
      const reorderedChapters = updatedChapters.map((chapter, i) => ({
        ...chapter,
        ordre: i + 1,
      }));
      setSavedChapters(reorderedChapters);
    }
  };
  const handleCancelEditor = () => {
    setActiveEditor(null);
    setEditingData(null);
    setEditingIndex(null);
  };
  const onSubmit = async (data) => {
    try {
      console.log("ONSUBMIT CALLED with data:", data);
      setIsSubmitting(true);
      setLoading(true);
      setError("");
      setSubmitError("");
      if (savedChapters.length === 0) {
        throw new Error("Au moins un chapitre est requis");
      }
      if (selectedMatiereIds.length === 0) {
        throw new Error("Au moins une matière est requise");
      }
      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error("ID du professeur non trouvé");
      }

      // Upload the pending files still used by a chapter
      let fileUrlMap = new Map();
      if (pendingFiles.size > 0) {
        fileUrlMap = await uploadPendingFiles(savedChapters);
      }

      // Update chapter content with uploaded file URLs
      const chapitresData = savedChapters.map((chapitre, index) => {
        let updatedContent = chapitre.contenu;
        if (fileUrlMap.size > 0) {
          updatedContent = updateContentWithUploadedFiles(
            chapitre.contenu,
            fileUrlMap,
          );
        }
        return {
          id: chapitre.id || null,
          titre: chapitre.titre,
          description: chapitre.description || "",
          contenu: updatedContent,
          ordre: index + 1,
        };
      });
      const matieresData = selectedMatiereIds.map((id) => ({
        id: String(id),
      }));
      const courseData = {
        titre: data.titre,
        description: data.description,
        redacteurId: String(professorId),
        etat: editMode ? courseToEdit.etat : "BROUILLON",
        references: data.references || "",
        restriction: data.restriction || "PRIVE",
        matieres: matieresData,
        chapitres: chapitresData,
      };
      if (editMode && courseToEdit) {
        courseData.id = courseToEdit.id;
        await coursService.updateCours(courseToEdit.id, courseData);
      } else {
        await coursService.createCours(courseData);
      }
      setPendingFiles(new Map());
      setShowSuccessModal(true);
      loadCourses();
      setTimeout(() => onBack(), 2000);
    } catch (err) {
      const errorMessage = err.message || "Erreur lors de l'enregistrement";
      setError(errorMessage);
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
      setUploadProgress(null);
    }
  };
  const handleMatiereChange = (newSelectedIds) => {
    setSelectedMatiereIds(newSelectedIds);
    setValue("matieres", newSelectedIds, {
      shouldValidate: true,
    });
  };
  return (
    <div>
      <div className="w-full px-0 py-2">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-sm flex-shrink-0"
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                style={{
                  fontSize: 16,
                }}
              />
              Retour
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {editMode ? "Modifier le cours" : "Créer un nouveau cours"}
              </h1>
              <p className="text-slate-600 mt-1">
                {editMode
                  ? "Modifiez et organisez votre contenu pédagogique"
                  : "Créez et organisez votre contenu pédagogique"}
              </p>
            </div>
          </div>

          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mr-2 flex-shrink-0 mt-0.5"
                style={{
                  fontSize: 16,
                }}
              />
              <span className="text-sm">{submitError}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* General Information */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                <FontAwesomeIcon
                  icon={faBookOpen}
                  className="mr-2 text-indigo-600"
                  style={{
                    fontSize: 18,
                  }}
                />
                Informations générales
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Titre du cours *
                    </label>
                    <input
                      {...register("titre")}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.titre ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                      placeholder="Introduction à la programmation"
                    />
                    {errors.titre && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <FontAwesomeIcon
                          icon={faCircleExclamation}
                          className="mr-1"
                          style={{
                            fontSize: 14,
                          }}
                        />
                        {errors.titre.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Visibilité *
                    </label>
                    <select
                      {...register("restriction")}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="PRIVE">Privé</option>
                      <option value="PUBLIC">Public</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description du cours *
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none ${errors.description ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                    placeholder="Décrivez le contenu général de ce cours..."
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="mr-1"
                        style={{
                          fontSize: 14,
                        }}
                      />
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <FontAwesomeIcon
                      icon={faUserGroup}
                      className="mr-2 text-indigo-600"
                      style={{
                        fontSize: 16,
                      }}
                    />
                    Matières associées *
                  </label>
                  <MultiSelectDropdown
                    options={subjects}
                    selected={selectedMatiereIds}
                    onChange={handleMatiereChange}
                    placeholder="Sélectionnez les matières..."
                    error={errors.matieres}
                  />
                  {errors.matieres && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="mr-1"
                        style={{
                          fontSize: 14,
                        }}
                      />
                      {errors.matieres.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <FontAwesomeIcon
                      icon={faFileLines}
                      className="mr-2 text-indigo-600"
                      style={{
                        fontSize: 16,
                      }}
                    />
                    Références
                  </label>
                  <textarea
                    {...register("references")}
                    rows={2}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                    placeholder="Livres, articles, liens utiles..."
                  />
                </div>
              </div>
            </div>

            {/* Chapters Section */}
            <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 sm:gap-0">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <FontAwesomeIcon
                    icon={faFileLines}
                    className="mr-2 text-indigo-600"
                    style={{
                      fontSize: 18,
                    }}
                  />
                  Chapitres du cours * ({savedChapters.length})
                </h3>
                {!activeEditor && (
                  <button
                    type="button"
                    onClick={() => setActiveEditor("create")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      style={{
                        fontSize: 16,
                      }}
                    />
                    <span className="hidden sm:inline">Nouveau chapitre</span>
                    <span className="sm:hidden">Nouveau</span>
                  </button>
                )}
              </div>

              {activeEditor && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ChapterEditor
                    mode={activeEditor}
                    initialData={editingData}
                    totalChapters={savedChapters.length}
                    onSave={handleSaveChapter}
                    onCancel={handleCancelEditor}
                    onFileAdd={handleFileAdd}
                    onFileRemove={handleFileRemove}
                    pendingFiles={pendingFiles}
                  />
                </div>
              )}

              <div className="space-y-3 max-h-[50vh] sm:max-h-[400px] overflow-y-auto">
                {savedChapters.map((chapter, index) => (
                  <div key={index} onClick={(e) => e.stopPropagation()}>
                    <ChapterCard
                      chapter={chapter}
                      index={index}
                      onEdit={() => handleEditChapter(index)}
                      onDelete={() => handleDeleteChapter(index)}
                      onMoveUp={() => moveChapter(index, "up")}
                      onMoveDown={() => moveChapter(index, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < savedChapters.length - 1}
                      loading={isSubmitting}
                    />
                  </div>
                ))}

                {savedChapters.length === 0 && !activeEditor && (
                  <div className="text-center py-8 text-slate-500">
                    <FontAwesomeIcon
                      icon={faFileLines}
                      className="mx-auto mb-4 text-slate-400"
                      style={{
                        fontSize: 48,
                      }}
                    />
                    <p className="mb-4">Aucun chapitre ajouté</p>
                    <button
                      type="button"
                      onClick={() => setActiveEditor("create")}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Créer votre premier chapitre
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {uploadProgress && uploadProgress.done < uploadProgress.total && (
            <div
              className="max-w-md mx-auto px-2 sm:px-0"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadProgress.percent}
              aria-label="Envoi des fichiers joints"
            >
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="truncate pr-2">{uploadProgress.name}</span>
                <span>{uploadProgress.percent} %</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 pt-6 pb-12 px-2 sm:px-0">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 font-semibold transition-all rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                style={{
                  fontSize: 16,
                }}
              />
              Annuler
            </button>
            <button
              type="submit"
              disabled={savedChapters.length === 0 || isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin"
                    style={{
                      fontSize: 16,
                    }}
                  />
                  {uploadProgress && uploadProgress.done < uploadProgress.total
                    ? `Envoi des fichiers ${uploadProgress.done}/${uploadProgress.total} — ${uploadProgress.percent} %`
                    : "Traitement..."}
                </>
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={faFloppyDisk}
                    style={{
                      fontSize: 16,
                    }}
                  />
                  {editMode ? "Modifier le cours" : "Créer le cours"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <SuccessModal
        show={showSuccessModal}
        message={
          editMode ? "Cours modifié avec succès !" : "Cours créé avec succès !"
        }
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
};
export default CreateCourseComponent;
