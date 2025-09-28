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
  Upload,
  Image,
  Paperclip,
  Loader,
  BookOpen,
  Users2,
  AlertCircle,
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
  chapitres: yup
    .array()
    .of(chapterSchema)
    .min(1, "Au moins un chapitre est requis"),
});

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  chapterIndex,
  onFileUpload,
}) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

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

  const handleFileInputChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.name || file.name.trim() === "") {
        alert("Un des fichiers sélectionnés n'a pas de nom valide.");
        return;
      }
    }

    try {
      setUploading(true);
      const uploadResults = [];

      for (const file of files) {
        try {
          const uploadResult = await onFileUpload(file);
          if (uploadResult.success) {
            uploadResults.push({
              file,
              result: uploadResult,
              downloadData: await minioS3Service.generateDownloadUrlByPath(
                uploadResult.filePath
              ),
            });
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          alert(
            `Erreur lors du téléchargement de ${file.name}: ${error.message}`
          );
        }
      }

      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      for (const { file, result, downloadData } of uploadResults) {
        if (file.type.startsWith("image/")) {
          const img = document.createElement("img");
          img.src = downloadData.downloadUrl;
          img.alt = file.name;
          img.style.maxWidth = "100%";
          img.style.height = "auto";
          img.style.borderRadius = "4px";
          img.style.margin = "8px 0";
          img.style.display = "block";

          if (range) {
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(false);
          } else {
            editorRef.current.appendChild(img);
          }
        } else {
          const linkContainer = document.createElement("div");
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

          const link = document.createElement("a");
          link.href = downloadData.downloadUrl;
          link.target = "_blank";
          link.style.color = "#3b82f6";
          link.style.textDecoration = "underline";
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

        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            url: downloadData.downloadUrl,
            timestamp: Date.now(),
          },
        ]);
      }

      if (uploadResults.length > 0) {
        handleContentChange();
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert(`Erreur lors du téléchargement: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeUploadedFile = (timestamp) => {
    setUploadedFiles((prev) =>
      prev.filter((file) => file.timestamp !== timestamp)
    );
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
      {uploadedFiles.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Fichiers téléchargés:
            </span>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.timestamp}
                className="flex items-center justify-between bg-white p-2 rounded border"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {file.type.startsWith("image/") ? "🖼️" : "📄"}
                  </span>
                  <button
                    onClick={() => downloadFile(file)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer text-left"
                    title="Cliquer pour télécharger"
                  >
                    {file.name}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => downloadFile(file)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Télécharger le fichier"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm5-13v2h2v13H5V5h2V3h10z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeUploadedFile(file.timestamp)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Supprimer de la liste"
                  >
                    <X size={14} />
                  </button>
                </div>
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
          disabled={uploading}
        >
          {uploading ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <Paperclip size={14} />
          )}
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
        disabled={uploading}
        multiple
      />

      <style jsx>{`
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
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 8px 0;
          display: block;
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

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="px-4 py-2 sm:py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors border border-slate-200 rounded-lg hover:bg-slate-50 order-2 sm:order-1"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className="px-4 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
        >
          <Save size={16} />
          {mode === "create" ? "Ajouter" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
};

const GeneralInfoSection = ({
  register,
  errors,
  subjects,
  selectedMatiereIds,
  handleMatiereChange,
  setValue,
}) => {
  return (
    <div className="bg-slate-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <BookOpen size={18} className="mr-2 text-indigo-600" />
        Informations générales
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="titre"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Titre du cours *
          </label>
          <input
            id="titre"
            type="text"
            {...register("titre")}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
              errors.titre ? "border-red-300 bg-red-50" : "border-slate-200"
            }`}
            placeholder="Introduction à la programmation"
          />
          {errors.titre && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle size={14} className="mr-1" />
              {errors.titre.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="restriction"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Visibilité *
          </label>
          <select
            id="restriction"
            {...register("restriction")}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
          >
            <option value="PRIVE">Privé</option>
            <option value="PUBLIC">Public</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Description du cours *
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={3}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white resize-none ${
              errors.description
                ? "border-red-300 bg-red-50"
                : "border-slate-200"
            }`}
            placeholder="Décrivez le contenu général de ce cours..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
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
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle size={14} className="mr-1" />
              {errors.matieres.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="references"
            className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"
          >
            <FileText size={16} className="mr-2 text-indigo-600" />
            Références
          </label>
          <textarea
            id="references"
            {...register("references")}
            rows={2}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white resize-none"
            placeholder="Livres, articles, liens utiles..."
          />
        </div>
      </div>
    </div>
  );
};

const ChaptersSection = ({
  savedChapters,
  activeEditor,
  editingData,
  handleSaveChapter,
  handleEditChapter,
  handleDeleteChapter,
  moveChapter,
  handleCancelEditor,
  setActiveEditor,
  setEditingData,
  onFileUpload,
}) => {
  return (
    <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <FileText size={18} className="mr-2 text-indigo-600" />
          Chapitres du cours * ({savedChapters.length})
        </h3>
        {!activeEditor && (
          <button
            type="button"
            onClick={() => setActiveEditor("create")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            data-testid="create-chapter-button"
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
            onFileUpload={onFileUpload}
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
  );
};

const CreateCourseFormModal = ({
  subjects,
  showCreateModal,
  setShowCreateModal,
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

  // Add missing refs and state for file handling
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

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

  // Fixed onFileUpload function for actual file upload
  const onFileUpload = async (file) => {
    try {
      if (!file || !file.name) {
        throw new Error("Invalid file or missing file name");
      }

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
      const uniqueFileName = `temp_${timestamp}_${cleanFileName}`;

      // Upload the file
      const result = await minioS3Service.uploadFile(
        new File([file], uniqueFileName, { type: file.type }),
        mediaType,
        documentType
      );

      // Get the current user ID to construct the expected file path
      const userId = minioS3Service.getValidUserId();

      // Construct the file path that matches your backend structure
      const expectedFilePath = `users/${userId}/${mediaType.toLowerCase()}/${documentType}/${uniqueFileName}`;

      return {
        ...result,
        filePath: expectedFilePath,
        success: true,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
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
    try {
      setIsSubmitting(true);
      setLoading(true);
      setError("");
      setSubmitError("");

      if (savedChapters.length === 0) {
        throw new Error("Au moins un chapitre est requis");
      }

      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error("ID du professeur non trouvé");
      }

      const chapitresData = savedChapters.map((chapitre, index) => {
        return {
          id: chapitre.id || null,
          titre: chapitre.titre,
          description: chapitre.description || "",
          contenu: chapitre.contenu,
          ordre: index + 1,
        };
      });

      const matieresData = selectedMatiereIds.map((id) => ({ id }));

      const courseData = {
        titre: data.titre,
        description: data.description,
        redacteurId: professorId,
        etat: "BROUILLON",
        references: data.references || "",
        restriction: data.restriction || "PRIVE",
        matieres: matieresData,
        chapitres: chapitresData,
      };

      const result = await coursService.createCours(courseData);

      setSuccess("Cours créé avec succès !");
      setShowCreateModal(false);
      resetForm();
      loadCourses();
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

  const resetForm = () => {
    reset({
      titre: "",
      description: "",
      matieres: [],
      references: "",
      restriction: "PRIVE",
    });
    setSelectedMatiereIds([]);
    setSavedChapters([]);
    setActiveEditor(null);
    setEditingData(null);
    setEditingIndex(null);
    setSubmitError("");
  };

  const handleMatiereChange = (newSelectedIds) => {
    setSelectedMatiereIds(newSelectedIds);
    setValue("matieres", newSelectedIds, { shouldValidate: true });
  };

  const handleClose = () => {
    setShowCreateModal(false);
    resetForm();
  };

  if (!showCreateModal) return null;

  return (
    // FIXED: Added higher z-index and proper positioning to match CoursProgrammerForm
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
        {/* FIXED: Header with better spacing and positioning */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
              <BookOpen className="mr-2 sm:mr-3 text-indigo-600" size={24} />
              <span className="hidden sm:inline">Nouveau Cours</span>
              <span className="sm:hidden">Nouveau Cours</span>
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
              <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}
        </div>

        {/* FIXED: Scrollable Form Content with proper spacing */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form
            id="course-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            <GeneralInfoSection
              register={register}
              errors={errors}
              subjects={subjects}
              selectedMatiereIds={selectedMatiereIds}
              handleMatiereChange={handleMatiereChange}
              setValue={setValue}
            />

            <ChaptersSection
              savedChapters={savedChapters}
              activeEditor={activeEditor}
              editingData={editingData}
              handleSaveChapter={handleSaveChapter}
              handleEditChapter={handleEditChapter}
              handleDeleteChapter={handleDeleteChapter}
              moveChapter={moveChapter}
              handleCancelEditor={handleCancelEditor}
              setActiveEditor={setActiveEditor}
              setEditingData={setEditingData}
              onFileUpload={onFileUpload}
            />
          </form>
        </div>

        {/* FIXED: Footer with Action Buttons - Better responsive design */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex-shrink-0 sticky bottom-0 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors rounded-lg hover:bg-slate-200 flex items-center justify-center order-2 sm:order-1"
            >
              <X size={16} className="mr-2" />
              Annuler
            </button>
            <button
              type="submit"
              form="course-form"
              disabled={savedChapters.length === 0 || isSubmitting}
              className="px-6 sm:px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="hidden sm:inline">Création...</span>
                  <span className="sm:hidden">En cours...</span>
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  <span className="hidden sm:inline">Créer le cours</span>
                  <span className="sm:hidden">Créer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourseFormModal;
