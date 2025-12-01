import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Save,
  ChevronUp,
  ChevronDown,
  XCircle,
  FileText,
  Paperclip,
  Loader,
  BookOpen,
  Users2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { coursService } from "../../../../../services/CoursService";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { minioS3Service } from "../../../../../services/minioS3";

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

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  chapterIndex,
  onFileAdd,
}) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [pendingFiles, setPendingFiles] = useState([]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      onChange(htmlContent);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setTimeout(() => {
        handleContentChange();
      }, 10);
      return;
    }

    if (e.key === " " || e.key === "Backspace" || e.key === "Delete") {
      setTimeout(() => {
        handleContentChange();
      }, 10);
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    for (const file of files) {
      const timestamp = Date.now() + Math.random();
      const fileId = `file_${timestamp}`;

      if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        img.dataset.fileId = fileId;
        img.style.maxWidth = "300px";
        img.style.maxHeight = "200px";
        img.style.width = "auto";
        img.style.height = "auto";
        img.style.objectFit = "contain";
        img.style.borderRadius = "8px";
        img.style.margin = "8px 0";
        img.style.display = "block";
        img.style.border = "1px solid #e2e8f0";
        img.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";

        if (range) {
          range.insertNode(img);
          range.setStartAfter(img);
          range.collapse(false);
        } else {
          editorRef.current.appendChild(img);
        }
      } else {
        const linkContainer = document.createElement("div");
        linkContainer.dataset.fileId = fileId;
        linkContainer.style.margin = "8px 0";
        linkContainer.style.padding = "8px 12px";
        linkContainer.style.backgroundColor = "#f8fafc";
        linkContainer.style.border = "1px solid #e2e8f0";
        linkContainer.style.borderRadius = "6px";
        linkContainer.style.display = "flex";
        linkContainer.style.alignItems = "center";
        linkContainer.style.gap = "8px";

        const icon = document.createElement("span");
        icon.innerHTML = "📄";
        icon.style.fontSize = "16px";

        const link = document.createElement("span");
        link.style.color = "#3b82f6";
        link.style.fontWeight = "500";
        link.textContent = file.name;

        linkContainer.appendChild(icon);
        linkContainer.appendChild(link);

        if (range) {
          range.insertNode(linkContainer);
          range.setStartAfter(linkContainer);
          range.collapse(false);
        } else {
          editorRef.current.appendChild(linkContainer);
        }
      }

      setPendingFiles((prev) => [
        ...prev,
        {
          id: fileId,
          file,
          name: file.name,
          type: file.type,
          timestamp,
        },
      ]);

      onFileAdd && onFileAdd(fileId, file);
    }

    handleContentChange();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (fileId) => {
    // Remove from DOM
    const elements = editorRef.current.querySelectorAll(
      `[data-file-id="${fileId}"]`
    );
    elements.forEach((el) => el.remove());

    // Remove from pending files
    setPendingFiles((prev) => prev.filter((file) => file.id !== fileId));

    handleContentChange();
  };

  const downloadFile = async (file) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      window.open(file.url, "_blank");
    }
  };

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const fragment = document.createDocumentFragment();
      const lines = text.split("\n");

      lines.forEach((line, index) => {
        if (index > 0) {
          fragment.appendChild(document.createElement("br"));
        }
        if (line.trim()) {
          fragment.appendChild(document.createTextNode(line));
        }
      });

      range.insertNode(fragment);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    setTimeout(() => handleContentChange(), 10);
  };

  const handleInput = (e) => {
    handleContentChange();
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {pendingFiles.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Fichiers en attente:
            </span>
          </div>
          <div className="space-y-2">
            {pendingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-white p-2 rounded border"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {file.type.startsWith("image/") ? "🖼️" : "📄"}
                  </span>
                  <span className="text-sm text-slate-700">{file.name}</span>
                </div>
                <button
                  onClick={() => removePendingFile(file.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Supprimer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            execCommand("bold");
          }}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 font-bold"
          title="Gras"
        >
          B
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            execCommand("italic");
          }}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 italic"
          title="Italique"
        >
          I
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            execCommand("underline");
          }}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 underline"
          title="Souligné"
        >
          U
        </button>
        <div className="w-px bg-slate-300 mx-1"></div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            execCommand("insertUnorderedList");
          }}
          className="p-2 hover:bg-slate-200 rounded text-slate-600"
          title="Liste à puces"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 6h13v2H8V6zM8 12h13v2H8v-2zm0 6h13v2H8v-2zM3 6h2v2H3V6zm0 6h2v2H3v-2zm0 6h2v2H3v-2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            execCommand("insertOrderedList");
          }}
          className="p-2 hover:bg-slate-200 rounded text-slate-600"
          title="Liste numérotée"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V6H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
          </svg>
        </button>
        <div className="w-px bg-slate-300 mx-1"></div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 flex items-center gap-1"
          title="Insérer fichier/image (plusieurs fichiers possibles)"
        >
          <Paperclip size={14} />
          <span className="text-xs hidden sm:inline">Fichiers</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            execCommand("removeFormat");
          }}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 text-xs"
          title="Supprimer le formatage"
        >
          Clear
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onClick={(e) => e.stopPropagation()}
        className="w-full min-h-[150px] p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
        style={{
          minHeight: "150px",
          maxHeight: "300px",
          overflowY: "auto",
          lineHeight: "1.6",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
        onChange={handleFileInputChange}
        multiple
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        [contenteditable] p {
          margin: 0.5em 0;
        }
        [contenteditable] div {
          margin: 0.25em 0;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          margin: 0.5em 0;
          padding-left: 2em;
        }
        [contenteditable] li {
          margin: 0.25em 0;
        }
        [contenteditable] img {
          max-width: 300px;
          max-height: 200px;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 8px;
          margin: 8px 0;
          display: block;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        [contenteditable] br {
          display: block;
          margin: 0;
          line-height: 1.2;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        [contenteditable] a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

const ChapterCard = ({
  chapter,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  const truncateText = (text, length) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  const getPlainText = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow relative group">
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
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Déplacer vers le haut"
            >
              <ChevronUp size={14} />
            </button>
          )}
          {canMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Déplacer vers le bas"
            >
              <ChevronDown size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Modifier"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 size={14} />
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
  onFileUpload,
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
    if (!formData.contenu.replace(/<[^>]*>/g, "").trim()) {
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
          <FileText size={20} className="text-indigo-600" />
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
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Annuler"
        >
          <XCircle size={18} />
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
              setFormData({ ...formData, titre: e.target.value })
            }
            onClick={(e) => e.stopPropagation()}
            className={`w-full px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
              errors.titre ? "border-red-300 bg-red-50" : "border-slate-200"
            }`}
            placeholder="Titre du chapitre"
          />
          {errors.titre && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle size={14} className="mr-1" />
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
              setFormData({ ...formData, description: e.target.value })
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
              setFormData({ ...formData, contenu: content })
            }
            placeholder="Contenu détaillé du chapitre..."
            chapterIndex={chapterNumber - 1}
            onFileUpload={onFileUpload}
          />
          {errors.contenu && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle size={14} className="mr-1" />
              {errors.contenu}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-12 mt-4 sm:mt-6">
        <button
          type="button"
          onClick={(e) => {
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
            e.stopPropagation();
            handleSave();
          }}
          className="px-4 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Save size={16} />
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
        <X size={16} />
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

  const handleFileAdd = (fileId, file) => {
    setPendingFiles((prev) => new Map(prev.set(fileId, file)));
  };

  const uploadPendingFiles = async () => {
    const uploadPromises = [];
    const fileMap = new Map();

    for (const [fileId, file] of pendingFiles) {
      const uploadPromise = (async () => {
        try {
          let documentType = "documents";
          let mediaType = "DOCUMENT";

          if (file.type.startsWith("image/")) {
            documentType = "images";
            mediaType = "IMAGE";
          } else if (file.type.startsWith("video/")) {
            documentType = "videos";
            mediaType = "VIDEO";
          }

          const timestamp = Date.now();
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const uniqueFileName = `${timestamp}_${cleanFileName}`;

          const result = await minioS3Service.uploadFile(
            new File([file], uniqueFileName, { type: file.type }),
            mediaType,
            documentType
          );

          const userId = minioS3Service.getValidUserId();
          const expectedFilePath = `users/${userId}/${mediaType.toLowerCase()}/${documentType}/${uniqueFileName}`;
          const downloadData = await minioS3Service.generateDownloadUrlByPath(
            expectedFilePath
          );

          fileMap.set(fileId, downloadData.downloadUrl);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw error;
        }
      })();

      uploadPromises.push(uploadPromise);
    }

    await Promise.all(uploadPromises);
    return fileMap;
  };

  const updateContentWithUploadedFiles = (content, fileUrlMap) => {
    let updatedContent = content;

    // Update images
    const imgRegex = /<img[^>]*data-file-id="([^"]*)"[^>]*>/g;
    updatedContent = updatedContent.replace(imgRegex, (match, fileId) => {
      const url = fileUrlMap.get(fileId);
      if (url) {
        return match.replace(/src="[^"]*"/, `src="${url}"`);
      }
      return match;
    });

    // Update file links
    const divRegex = /<div[^>]*data-file-id="([^"]*)"[^>]*>.*?<\/div>/g;
    updatedContent = updatedContent.replace(divRegex, (match, fileId) => {
      const url = fileUrlMap.get(fileId);
      if (url) {
        const fileName = pendingFiles.get(fileId)?.name || "File";
        return match.replace(
          /<span[^>]*>([^<]*)<\/span>/,
          `<a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: 500;">$1</a>`
        );
      }
      return match;
    });

    return updatedContent;
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
    setEditingData({ ...savedChapters[index] });
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
    console.log('Form submitted with data:', data);
    console.log('Saved chapters:', savedChapters);
    console.log('Selected matiere IDs:', selectedMatiereIds);
    
    try {
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

      // Upload all pending files first
      let fileUrlMap = new Map();
      if (pendingFiles.size > 0) {
        fileUrlMap = await uploadPendingFiles();
      }

      // Update chapter content with uploaded file URLs
      const chapitresData = savedChapters.map((chapitre, index) => {
        let updatedContent = chapitre.contenu;
        if (fileUrlMap.size > 0) {
          updatedContent = updateContentWithUploadedFiles(
            chapitre.contenu,
            fileUrlMap
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

      const matieresData = selectedMatiereIds.map((id) => ({ id: String(id) }));

      const courseData = {
        titre: data.titre,
        description: data.description,
        redacteurId: String(professorId),
        etat: "BROUILLON",
        references: data.references || "",
        restriction: data.restriction || "PRIVE",
        matieres: matieresData,
        chapitres: chapitresData,
      };

      await coursService.createCours(courseData);

      setShowSuccessModal(true);
      loadCourses();
      setTimeout(() => onBack(), 2000);
    } catch (err) {
      console.error("Error in onSubmit:", err);
      const errorMessage = err.message || "Erreur lors de l'enregistrement";
      setError(errorMessage);
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleMatiereChange = (newSelectedIds) => {
    setSelectedMatiereIds(newSelectedIds);
    setValue("matieres", newSelectedIds, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Créer un nouveau cours
              </h1>
              <p className="text-slate-600 mt-1">
                Créez et organisez votre contenu pédagogique
              </p>
            </div>
          </div>

          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
              <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
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
                <BookOpen size={18} className="mr-2 text-indigo-600" />
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
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      errors.titre
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200"
                    }`}
                    placeholder="Introduction à la programmation"
                  />
                  {errors.titre && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
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
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none ${
                    errors.description
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                  placeholder="Décrivez le contenu général de ce cours..."
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  <Users2 size={16} className="mr-2 text-indigo-600" />
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
                    <AlertCircle size={14} className="mr-1" />
                    {errors.matieres.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  <FileText size={16} className="mr-2 text-indigo-600" />
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
                <FileText size={18} className="mr-2 text-indigo-600" />
                Chapitres du cours * ({savedChapters.length})
              </h3>
              {!activeEditor && (
                <button
                  type="button"
                  onClick={() => setActiveEditor("create")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={16} />
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
                  />
                </div>
              ))}

              {savedChapters.length === 0 && !activeEditor && (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="mx-auto mb-4 text-slate-400" size={48} />
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

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 pt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors rounded-lg hover:bg-slate-100 flex items-center justify-center gap-2 border border-slate-300"
            >
              <ArrowLeft size={16} />
              Annuler
            </button>
            <button
              type="submit"
              disabled={savedChapters.length === 0 || isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Créer le cour
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <SuccessModal
        show={showSuccessModal}
        message="Cours créé avec succès !"
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default CreateCourseComponent;
