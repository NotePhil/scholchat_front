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
} from "lucide-react";
import { coursService } from "../../../../../services/CoursService";
import MultiSelectDropdown from "./MultiSelectDropdown";

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

const RichTextEditor = ({ value, onChange, placeholder, chapterIndex }) => {
  const editorRef = useRef(null);

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
          onClick={() => execCommand("bold")}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 font-bold"
          title="Gras"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 italic"
          title="Italique"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 underline"
          title="Souligné"
        >
          U
        </button>
        <div className="w-px bg-slate-300 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-2 hover:bg-slate-200 rounded text-slate-600"
          title="Liste à puces"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 6h13v2H8V6zM8 12h13v2H8v-2zm0 6h13v2H8v-2zM3 6h2v2H3V6zm0 6h2v2H3v-2zm0 6h2v2H3v-2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
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
          onClick={() => execCommand("removeFormat")}
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
      `}</style>
    </div>
  );
};

const ChapterCard = ({
  chapter,
  index,
  isEditing,
  editData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onEditDataChange,
}) => {
  const [errors, setErrors] = useState({});

  const truncateText = (text, length) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  const getPlainText = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editData.titre.trim()) {
      newErrors.titre = "Le titre est requis";
    }
    if (!editData.contenu.replace(/<[^>]*>/g, "").trim()) {
      newErrors.contenu = "Le contenu est requis";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        ...editData,
        ordre: index + 1,
      });
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white border-2 border-indigo-300 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-slate-900">
            Modifier le Chapitre {index + 1}
          </h4>
          <button
            onClick={onCancel}
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
              value={editData.titre}
              onChange={(e) =>
                onEditDataChange({ ...editData, titre: e.target.value })
              }
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
              value={editData.description}
              onChange={(e) =>
                onEditDataChange({ ...editData, description: e.target.value })
              }
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
              value={editData.contenu}
              onChange={(content) =>
                onEditDataChange({ ...editData, contenu: content })
              }
              placeholder="Contenu détaillé du chapitre..."
              chapterIndex={index}
            />
            {errors.contenu && (
              <p className="mt-1 text-sm text-red-600">{errors.contenu}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Sauvegarder
          </button>
        </div>
      </div>
    );
  }

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
              onClick={onMoveUp}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Déplacer vers le haut"
            >
              <ChevronUp size={14} />
            </button>
          )}
          {canMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Déplacer vers le bas"
            >
              <ChevronDown size={14} />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Modifier"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={onDelete}
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

const ChapterForm = ({ onSave, onCancel, totalChapters }) => {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    contenu: "",
  });

  const [errors, setErrors] = useState({});

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
        ordre: totalChapters + 1,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-slate-900">
          Nouveau Chapitre {totalChapters + 1}
        </h4>
        <button
          onClick={onCancel}
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
            chapterIndex={totalChapters}
          />
          {errors.contenu && (
            <p className="mt-1 text-sm text-red-600">{errors.contenu}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Save size={16} />
          Enregistrer
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
    <div className="bg-slate-50 rounded-xl p-6">
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
  isCreatingChapter,
  editingChapterIndex,
  editingChapterData,
  handleSaveChapter,
  handleEditChapter,
  handleEditChapterDataChange,
  handleCancelEdit,
  handleDeleteChapter,
  moveChapter,
  handleCancelChapterForm,
  setIsCreatingChapter,
}) => {
  return (
    <div className="bg-blue-50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Chapitres du cours * ({savedChapters.length})
        </h3>
        {!isCreatingChapter && editingChapterIndex === null && (
          <button
            type="button"
            onClick={() => setIsCreatingChapter(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Nouveau chapitre
          </button>
        )}
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
        {savedChapters.map((chapter, index) => (
          <ChapterCard
            key={index}
            chapter={chapter}
            index={index}
            isEditing={editingChapterIndex === index}
            editData={editingChapterData}
            onEdit={() => handleEditChapter(index)}
            onSave={handleSaveChapter}
            onCancel={handleCancelEdit}
            onDelete={() => handleDeleteChapter(index)}
            onMoveUp={() => moveChapter(index, "up")}
            onMoveDown={() => moveChapter(index, "down")}
            canMoveUp={index > 0}
            canMoveDown={index < savedChapters.length - 1}
            onEditDataChange={handleEditChapterDataChange}
          />
        ))}

        {savedChapters.length === 0 && !isCreatingChapter && (
          <div className="text-center py-8 text-slate-500">
            <p className="mb-4">Aucun chapitre ajouté</p>
            <button
              type="button"
              onClick={() => setIsCreatingChapter(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Créer votre premier chapitre
            </button>
          </div>
        )}
      </div>

      {isCreatingChapter && (
        <ChapterForm
          onSave={handleSaveChapter}
          onCancel={handleCancelChapterForm}
          totalChapters={savedChapters.length}
        />
      )}
    </div>
  );
};

const CourseFormModal = ({
  modalMode,
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
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [editingChapterIndex, setEditingChapterIndex] = useState(null);
  const [editingChapterData, setEditingChapterData] = useState(null);

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

  const handleSaveChapter = (chapterData) => {
    if (editingChapterIndex !== null) {
      // Update existing chapter
      const updatedChapters = [...savedChapters];
      updatedChapters[editingChapterIndex] = {
        ...updatedChapters[editingChapterIndex],
        ...chapterData,
      };
      setSavedChapters(updatedChapters);
      setEditingChapterIndex(null);
      setEditingChapterData(null);
    } else {
      // Add new chapter
      const newChapter = {
        id: null,
        ...chapterData,
        ordre: savedChapters.length + 1,
      };
      setSavedChapters([...savedChapters, newChapter]);
      setIsCreatingChapter(false);
    }
  };

  const handleEditChapter = (index) => {
    setEditingChapterIndex(index);
    setEditingChapterData({ ...savedChapters[index] });
    setIsCreatingChapter(false);
  };

  const handleEditChapterDataChange = (newData) => {
    setEditingChapterData(newData);
  };

  const handleCancelEdit = () => {
    setEditingChapterIndex(null);
    setEditingChapterData(null);
  };

  const handleDeleteChapter = (index) => {
    const updatedChapters = savedChapters.filter((_, i) => i !== index);
    updatedChapters.forEach((chapter, i) => {
      chapter.ordre = i + 1;
    });
    setSavedChapters(updatedChapters);
  };

  const moveChapter = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < savedChapters.length) {
      const updatedChapters = [...savedChapters];
      [updatedChapters[index], updatedChapters[newIndex]] = [
        updatedChapters[newIndex],
        updatedChapters[index],
      ];
      updatedChapters.forEach((chapter, i) => {
        chapter.ordre = i + 1;
      });
      setSavedChapters(updatedChapters);
    }
  };

  const handleCancelChapterForm = () => {
    setIsCreatingChapter(false);
    setEditingChapterIndex(null);
    setEditingChapterData(null);
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
        const htmlContent = chapitre.contenu.replace(/\n/g, "<br>").trim();

        return {
          titre: chapitre.titre,
          description: chapitre.description || "",
          contenu: htmlContent,
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

      let result;
      if (modalMode === "create") {
        result = await coursService.createCours(courseData);
        setSuccess("Cours créé avec succès !");
      } else {
        result = await coursService.updateCours(selectedCourse.id, courseData);
        setSuccess("Cours modifié avec succès !");
      }

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
    setIsCreatingChapter(false);
    setEditingChapterIndex(null);
    setEditingChapterData(null);
  };

  const handleMatiereChange = (newSelectedIds) => {
    setSelectedMatiereIds(newSelectedIds);
    setValue("matieres", newSelectedIds, { shouldValidate: true });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {modalMode === "create" ? "Nouveau Cours" : "Modifier le Cours"}
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

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
              isCreatingChapter={isCreatingChapter}
              editingChapterIndex={editingChapterIndex}
              editingChapterData={editingChapterData}
              handleSaveChapter={handleSaveChapter}
              handleEditChapter={handleEditChapter}
              handleEditChapterDataChange={handleEditChapterDataChange}
              handleCancelEdit={handleCancelEdit}
              handleDeleteChapter={handleDeleteChapter}
              moveChapter={moveChapter}
              handleCancelChapterForm={handleCancelChapterForm}
              setIsCreatingChapter={setIsCreatingChapter}
            />

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {modalMode === "create" ? "Créer le cours" : "Sauvegarder"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseFormModal;
