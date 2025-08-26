import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { X, Plus, Trash2, Move, ChevronUp, ChevronDown } from "lucide-react";
import { coursService } from "../../../../../services/CoursService";
import MultiSelectDropdown from "./MultiSelectDropdown";

const chapterSchema = yup.object().shape({
  titre: yup.string().required("Le titre du chapitre est requis"),
  description: yup.string(),
  contenu: yup.string().required("Le contenu du chapitre est requis"),
  matiereId: yup.string().required("La matière est requise"),
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

// Rich Text Editor Component
const RichTextEditor = ({ value, onChange, placeholder, chapterIndex }) => {
  const editorRef = useRef(null);

  // Convert HTML to display text and vice versa
  const htmlToText = (html) => {
    if (!html) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const textToHtml = (text) => {
    return text.replace(/\n/g, "<br>");
  };

  // Handle formatting commands
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleContentChange();
  };

  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      // Clean up the HTML and convert <div> to <br> for consistency
      const cleanedContent = htmlContent
        .replace(/<div>/g, "<br>")
        .replace(/<\/div>/g, "")
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/&nbsp;/g, " ");
      onChange(cleanedContent);
    }
  };

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      // Convert newlines back to <br> for display
      const displayContent = value.replace(/\n/g, "<br>");
      editorRef.current.innerHTML = displayContent;
    }
  }, [value]);

  // Handle paste events to clean up pasted content
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 font-bold"
          title="Gras (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 italic"
          title="Italique (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          className="p-2 hover:bg-slate-200 rounded text-slate-600 underline"
          title="Souligné (Ctrl+U)"
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

      {/* Editor */}
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
  const [chapitres, setChapitres] = useState([
    {
      id: null,
      titre: "",
      description: "",
      contenu: "",
      matiereId: "",
      ordre: 1,
    },
  ]);

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
        setChapitres(
          selectedCourse.chapitres.map((ch) => ({
            id: ch.id,
            titre: ch.titre,
            description: ch.description || "",
            contenu: ch.contenu,
            matiereId: ch.matiereId,
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

  const addChapter = () => {
    const newChapter = {
      id: null,
      titre: "",
      description: "",
      contenu: "",
      matiereId: "",
      ordre: chapitres.length + 1,
    };
    setChapitres([...chapitres, newChapter]);
  };

  const removeChapter = (index) => {
    if (chapitres.length > 1) {
      const updatedChapitres = chapitres.filter((_, i) => i !== index);
      // Réorganiser les ordres
      updatedChapitres.forEach((chapitre, i) => {
        chapitre.ordre = i + 1;
      });
      setChapitres(updatedChapitres);
    }
  };

  const moveChapter = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < chapitres.length) {
      const updatedChapitres = [...chapitres];
      [updatedChapitres[index], updatedChapitres[newIndex]] = [
        updatedChapitres[newIndex],
        updatedChapitres[index],
      ];

      // Réorganiser les ordres
      updatedChapitres.forEach((chapitre, i) => {
        chapitre.ordre = i + 1;
      });
      setChapitres(updatedChapitres);
    }
  };

  const updateChapter = (index, field, value) => {
    const updatedChapitres = [...chapitres];
    updatedChapitres[index] = {
      ...updatedChapitres[index],
      [field]: value,
    };
    setChapitres(updatedChapitres);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");

      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error("ID du professeur non trouvé");
      }

      // Validation des chapitres
      const chapitresData = chapitres.map((chapitre, index) => {
        // Convert newlines to proper HTML for storage
        const htmlContent = chapitre.contenu.replace(/\n/g, "<br>").trim();

        return {
          titre: chapitre.titre,
          description: chapitre.description || "",
          contenu: htmlContent,
          matiereId: chapitre.matiereId,
          ordre: index + 1,
        };
      });

      // Validation - tous les chapitres doivent avoir les champs requis
      for (let i = 0; i < chapitresData.length; i++) {
        const chapitre = chapitresData[i];
        if (!chapitre.titre.trim()) {
          throw new Error(`Le titre du chapitre ${i + 1} est requis`);
        }
        if (!chapitre.contenu.replace(/<[^>]*>/g, "").trim()) {
          throw new Error(`Le contenu du chapitre ${i + 1} est requis`);
        }
        if (!chapitre.matiereId) {
          throw new Error(`La matière du chapitre ${i + 1} est requise`);
        }
      }

      // Préparation des matières
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
    setChapitres([
      {
        id: null,
        titre: "",
        description: "",
        contenu: "",
        matiereId: "",
        ordre: 1,
      },
    ]);
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            {/* Informations générales */}
            <div className="bg-slate-50 rounded-xl p-4">
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
                    <p className="mt-2 text-sm text-red-600">
                      {errors.titre.message}
                    </p>
                  )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Chapitres */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Chapitres du cours *
                </h3>
                <button
                  type="button"
                  onClick={addChapter}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Ajouter un chapitre
                </button>
              </div>

              <div className="space-y-4">
                {chapitres.map((chapitre, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-slate-900">
                        Chapitre {index + 1}
                      </h4>
                      <div className="flex items-center gap-2">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveChapter(index, "up")}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Déplacer vers le haut"
                          >
                            <ChevronUp size={16} />
                          </button>
                        )}
                        {index < chapitres.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveChapter(index, "down")}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Déplacer vers le bas"
                          >
                            <ChevronDown size={16} />
                          </button>
                        )}
                        {chapitres.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChapter(index)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Supprimer le chapitre"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Titre du chapitre *
                        </label>
                        <input
                          type="text"
                          value={chapitre.titre}
                          onChange={(e) =>
                            updateChapter(index, "titre", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={`Titre du chapitre ${index + 1}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Matière du chapitre *
                        </label>
                        <select
                          value={chapitre.matiereId}
                          onChange={(e) =>
                            updateChapter(index, "matiereId", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Sélectionnez une matière</option>
                          {subjects.map((matiere) => (
                            <option key={matiere.id} value={matiere.id}>
                              {matiere.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Description du chapitre
                        </label>
                        <textarea
                          value={chapitre.description}
                          onChange={(e) =>
                            updateChapter(index, "description", e.target.value)
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={`Description du chapitre ${index + 1}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Contenu du chapitre *
                        </label>
                        <RichTextEditor
                          value={chapitre.contenu}
                          onChange={(content) =>
                            updateChapter(index, "contenu", content)
                          }
                          placeholder="Contenu détaillé du chapitre..."
                          chapterIndex={index}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Utilisez les outils de formatage pour structurer votre
                          contenu. Le texte sera affiché avec le formatage
                          appliqué.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
