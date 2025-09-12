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

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      const cleanedContent = htmlContent
        .replace(/<div>/g, "<br>")
        .replace(/<\/div>/g, "")
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/&nbsp;/g, " ");
      onChange(cleanedContent);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const uploadResult = await onFileUpload(file);

      if (uploadResult.success) {
        if (file.type.startsWith("image/")) {
          const downloadData = await minioS3Service.generateDownloadUrl(
            uploadResult.fileName
          );
          document.execCommand("insertImage", false, downloadData.downloadUrl);
        } else {
          const downloadData = await minioS3Service.generateDownloadUrl(
            uploadResult.fileName
          );
          const fileName = file.name;
          const link = `<a href="${downloadData.downloadUrl}" target="_blank" style="color: #3b82f6; text-decoration: underline;">${fileName}</a>`;
          document.execCommand("insertHTML", false, link);
        }
        handleContentChange();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Erreur lors du téléchargement du fichier: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      const displayContent = value.replace(/\n/g, "<br>");
      editorRef.current.innerHTML = displayContent;
    }
  }, [value]);

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
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
          title="Insérer fichier/image"
          disabled={uploading}
        >
          {uploading ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <Paperclip size={14} />
          )}
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
        onInput={handleContentChange}
        onPaste={handlePaste}
        onClick={(e) => e.stopPropagation()}
        className="w-full min-h-[150px] p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
        style={{
          minHeight: "150px",
          maxHeight: "300px",
          overflowY: "auto",
          lineHeight: "1.5",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        onChange={handleFileUpload}
        disabled={uploading}
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
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
              Chapitre {index + 1}
            </span>
          </div>
          <h4 className="font-semibold text-slate-900 text-sm mb-1">
            {truncateText(chapter.titre, 40)}
          </h4>
          {chapter.description && (
            <p className="text-slate-600 text-xs mb-2">
              {truncateText(chapter.description, 60)}
            </p>
          )}
          <p className="text-slate-500 text-xs">
            {truncateText(getPlainText(chapter.contenu), 80)}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-3">
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
    <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FileText size={20} className="text-indigo-600" />
          {mode === "create"
            ? `Nouveau Chapitre ${chapterNumber}`
            : `Modifier Chapitre ${chapterNumber}`}
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.titre ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="Titre du chapitre"
          />
          {errors.titre && (
            <p className="mt-1 text-sm text-red-600">{errors.titre}</p>
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            <p className="mt-1 text-sm text-red-600">{errors.contenu}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
    <div className="bg-slate-50 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Informations générales
      </h3>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label
            htmlFor="titre"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Titre du cours *
          </label>
          <input
            id="titre"
            type="text"
            {...register("titre")}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
              errors.titre ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="Introduction à la programmation"
          />
          {errors.titre && (
            <p className="mt-2 text-sm text-red-600">{errors.titre.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="restriction"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Visibilité *
          </label>
          <select
            id="restriction"
            {...register("restriction")}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="PRIVE">Privé</option>
            <option value="PUBLIC">Public</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Description du cours *
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={3}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
              errors.description ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="Décrivez le contenu général de ce cours..."
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
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
            <p className="mt-2 text-sm text-red-600">
              {errors.matieres.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="references"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Références
          </label>
          <textarea
            id="references"
            {...register("references")}
            rows={2}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
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
    <div className="bg-blue-50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Chapitres du cours * ({savedChapters.length})
        </h3>
        {!activeEditor && (
          <button
            type="button"
            onClick={() => setActiveEditor("create")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Nouveau chapitre
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

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {savedChapters.map((chapter, index) => (
          <ChapterCard
            key={index}
            chapter={chapter}
            index={index}
            onEdit={() => handleEditChapter(index)}
            onDelete={() => handleDeleteChapter(index)}
            onMoveUp={() => moveChapter(index, "up")}
            onMoveDown={() => moveChapter(index, "down")}
            canMoveUp={index > 0}
            canMoveDown={index < savedChapters.length - 1}
          />
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

const EditCourseFormModal = ({
  selectedCourse,
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
    if (selectedCourse) {
      reset({
        titre: selectedCourse.titre,
        description: selectedCourse.description,
        matieres: selectedCourse.matieres?.map((m) => m.id) || [],
        references: selectedCourse.references || "",
        restriction: selectedCourse.restriction || "PRIVE",
      });
      setSelectedMatiereIds(selectedCourse.matieres?.map((m) => m.id) || []);

      if (selectedCourse.chapitres && selectedCourse.chapitres.length > 0) {
        setSavedChapters(
          selectedCourse.chapitres.map((ch) => ({
            id: ch.id,
            titre: ch.titre,
            description: ch.description || "",
            contenu: ch.contenu,
            ordre: ch.ordre,
          }))
        );
      }
    } else {
      resetForm();
    }
  }, [selectedCourse, reset]);

  useEffect(() => {
    setSelectedMatiereIds(watchedMatiereIds || []);
  }, [watchedMatiereIds]);

  const handleFileUpload = async (file) => {
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

      const result = await minioS3Service.uploadFile(
        file,
        mediaType,
        documentType
      );
      return result;
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
      setLoading(true);
      setError("");

      if (savedChapters.length === 0) {
        setError("Au moins un chapitre est requis");
        return;
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
        restriction: data.restriction,
        matieres: matieresData,
        chapitres: chapitresData,
      };

      const result = await coursService.updateCours(
        selectedCourse.id,
        courseData
      );
      setSuccess("Cours modifié avec succès !");

      setShowCreateModal(false);
      resetForm();
      loadCourses();
    } catch (err) {
      console.error("Error in onSubmit:", err);
      setError("Erreur lors de l'enregistrement: " + err.message);
    } finally {
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
  };

  const handleMatiereChange = (newSelectedIds) => {
    setSelectedMatiereIds(newSelectedIds);
    setValue("matieres", newSelectedIds, { shouldValidate: true });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) {
      setShowCreateModal(false);
    }
  };

  if (!showCreateModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto"
      onClick={handleModalClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-slate-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Modifier le Cours
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleFormSubmit} className="space-y-6">
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
              onFileUpload={handleFileUpload}
            />
          </form>
        </div>

        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-slate-200 p-6 z-10">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={savedChapters.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCourseFormModal;
