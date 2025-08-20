import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MultiSelectDropdown from "../../shared/MultiSelectDropdown";
import accederService from "../../../../../services/accederService";

const schedulingSchema = yup.object().shape({
  coursId: yup.string().required("Le cours est obligatoire"),
  classeId: yup.string().nullable(),
  dateCoursPrevue: yup
    .date()
    .typeError("La date prévue doit être une date valide")
    .required("La date prévue est obligatoire")
    .min(new Date(), "La date ne peut pas être dans le passé"),
  dateDebutEffectif: yup
    .date()
    .nullable()
    .typeError("La date de début doit être une date valide")
    .when("dateCoursPrevue", (dateCoursPrevue, schema) => {
      return dateCoursPrevue
        ? schema.min(
            dateCoursPrevue,
            "La date de début ne peut pas être avant la date prévue"
          )
        : schema;
    }),
  dateFinEffectif: yup
    .date()
    .nullable()
    .typeError("La date de fin doit être une date valide")
    .when("dateDebutEffectif", (dateDebutEffectif, schema) => {
      return dateDebutEffectif
        ? schema.min(
            dateDebutEffectif,
            "La date de fin ne peut pas être avant la date de début"
          )
        : schema;
    }),
  lieu: yup.string().required("Le lieu est obligatoire"),
  description: yup.string().nullable(),
  capaciteMax: yup
    .number()
    .nullable()
    .positive("La capacité doit être positive")
    .integer("La capacité doit être un nombre entier"),
  participantsIds: yup.array().of(yup.string()).nullable(),
  etatCoursProgramme: yup.string().required("L'état est obligatoire"),
});

const CoursProgrammerForm = ({
  isOpen,
  onClose,
  onSubmit,
  modalMode,
  selectedScheduledCourse,
  courses,
  classes,
  loading,
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [classParticipants, setClassParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schedulingSchema),
    defaultValues: {
      participantsIds: [],
      etatCoursProgramme: "PLANIFIE",
      classeId: null,
      capaciteMax: null,
      description: null,
      dateDebutEffectif: null,
      dateFinEffectif: null,
    },
  });

  const watchedParticipants = watch("participantsIds");
  const watchedClassId = watch("classeId");
  const watchedEtat = watch("etatCoursProgramme");

  useEffect(() => {
    setSelectedParticipants(watchedParticipants || []);
  }, [watchedParticipants]);

  useEffect(() => {
    const fetchClassParticipants = async (classeId) => {
      if (!classeId) {
        setClassParticipants([]);
        return;
      }

      try {
        setLoadingParticipants(true);
        const participants = await accederService.obtenirUtilisateursAvecAcces(
          classeId
        );
        const formattedParticipants = participants.map((user) => ({
          id: user.id,
          name: user.nomComplet || user.email || `User ${user.id}`,
        }));
        setClassParticipants(formattedParticipants);
      } catch (error) {
        console.error("Error fetching class participants:", error);
      } finally {
        setLoadingParticipants(false);
      }
    };

    if (watchedClassId) {
      fetchClassParticipants(watchedClassId);
    } else {
      setClassParticipants([]);
    }
  }, [watchedClassId]);

  useEffect(() => {
    if (isOpen) {
      if (modalMode === "edit" && selectedScheduledCourse) {
        const formatDateForInput = (dateString) => {
          if (!dateString) return null;
          const date = new Date(dateString);
          return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        };

        const initialValues = {
          coursId: selectedScheduledCourse.coursId,
          classeId: selectedScheduledCourse.classeId || null,
          dateCoursPrevue: formatDateForInput(
            selectedScheduledCourse.dateCoursPrevue
          ),
          dateDebutEffectif: formatDateForInput(
            selectedScheduledCourse.dateDebutEffectif
          ),
          dateFinEffectif: formatDateForInput(
            selectedScheduledCourse.dateFinEffectif
          ),
          lieu: selectedScheduledCourse.lieu,
          description: selectedScheduledCourse.description || null,
          capaciteMax: selectedScheduledCourse.capaciteMax || null,
          participantsIds: selectedScheduledCourse.participantsIds || [],
          etatCoursProgramme:
            selectedScheduledCourse.etatCoursProgramme || "PLANIFIE",
        };

        reset(initialValues);
        setSelectedParticipants(initialValues.participantsIds || []);
      } else {
        resetForm();
      }
    }
  }, [isOpen, modalMode, selectedScheduledCourse, reset]);

  const resetForm = () => {
    reset({
      coursId: "",
      classeId: null,
      dateCoursPrevue: "",
      dateDebutEffectif: null,
      dateFinEffectif: null,
      lieu: "",
      description: null,
      capaciteMax: null,
      participantsIds: [],
      etatCoursProgramme: "PLANIFIE",
    });
    setSelectedParticipants([]);
    setClassParticipants([]);
  };

  const handleSelectAllParticipants = () => {
    if (selectedParticipants.length === classParticipants.length) {
      handleParticipantChange([]);
    } else {
      handleParticipantChange(classParticipants.map((user) => user.id));
    }
  };

  const handleParticipantChange = (newSelectedIds) => {
    setSelectedParticipants(newSelectedIds);
    setValue("participantsIds", newSelectedIds, { shouldValidate: true });
  };

  const handleFormSubmit = async (data) => {
    const formatDate = (dateString) => {
      if (!dateString) return null;
      return new Date(dateString).toISOString();
    };

    const scheduleData = {
      coursId: data.coursId,
      classeId: data.classeId || null,
      dateCoursPrevue: formatDate(data.dateCoursPrevue),
      dateDebutEffectif: formatDate(data.dateDebutEffectif),
      dateFinEffectif: formatDate(data.dateFinEffectif),
      etatCoursProgramme: data.etatCoursProgramme,
      lieu: data.lieu,
      description: data.description || null,
      capaciteMax: data.capaciteMax ? parseInt(data.capaciteMax) : null,
      participantsIds: selectedParticipants.filter((id) => id),
    };

    await onSubmit(scheduleData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {modalMode === "create"
                ? "Programmer un Cours"
                : "Modifier la Programmation"}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="coursId"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Cours *
                </label>
                <select
                  id="coursId"
                  {...register("coursId")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.coursId ? "border-red-300" : "border-slate-200"
                  }`}
                  disabled={modalMode === "edit"}
                >
                  <option value="">Sélectionnez un cours</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.titre}
                    </option>
                  ))}
                </select>
                {errors.coursId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.coursId.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="etatCoursProgramme"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  État *
                </label>
                <select
                  id="etatCoursProgramme"
                  {...register("etatCoursProgramme")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.etatCoursProgramme
                      ? "border-red-300"
                      : "border-slate-200"
                  }`}
                >
                  <option value="PLANIFIE">Planifié</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
                </select>
                {errors.etatCoursProgramme && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.etatCoursProgramme.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="classeId"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Classe
                </label>
                <select
                  id="classeId"
                  {...register("classeId")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.classeId ? "border-red-300" : "border-slate-200"
                  }`}
                >
                  <option value="">Sélectionnez une classe (optionnel)</option>
                  {classes.map((classe) => (
                    <option key={classe.id} value={classe.id}>
                      {classe.nom}
                    </option>
                  ))}
                </select>
                {errors.classeId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.classeId.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="capaciteMax"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Capacité maximale
                </label>
                <input
                  id="capaciteMax"
                  type="number"
                  min="1"
                  {...register("capaciteMax")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.capaciteMax ? "border-red-300" : "border-slate-200"
                  }`}
                  placeholder="30 (optionnel)"
                />
                {errors.capaciteMax && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.capaciteMax.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="dateCoursPrevue"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Date prévue *
                </label>
                <input
                  id="dateCoursPrevue"
                  type="datetime-local"
                  {...register("dateCoursPrevue")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.dateCoursPrevue
                      ? "border-red-300"
                      : "border-slate-200"
                  }`}
                />
                {errors.dateCoursPrevue && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dateCoursPrevue.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dateDebutEffectif"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Date début effectif
                </label>
                <input
                  id="dateDebutEffectif"
                  type="datetime-local"
                  {...register("dateDebutEffectif")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.dateDebutEffectif
                      ? "border-red-300"
                      : "border-slate-200"
                  }`}
                  disabled={watchedEtat === "PLANIFIE"}
                />
                {errors.dateDebutEffectif && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dateDebutEffectif.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dateFinEffectif"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Date fin effectif
                </label>
                <input
                  id="dateFinEffectif"
                  type="datetime-local"
                  {...register("dateFinEffectif")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.dateFinEffectif
                      ? "border-red-300"
                      : "border-slate-200"
                  }`}
                  disabled={watchedEtat !== "TERMINE"}
                />
                {errors.dateFinEffectif && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dateFinEffectif.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="lieu"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Lieu *
                </label>
                <input
                  id="lieu"
                  type="text"
                  {...register("lieu")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.lieu ? "border-red-300" : "border-slate-200"
                  }`}
                  placeholder="Salle 203, Bâtiment A"
                />
                {errors.lieu && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lieu.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Description / Notes
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Notes spéciales pour cette session..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Participants (optionnel)
              </label>
              <MultiSelectDropdown
                options={classParticipants}
                selected={selectedParticipants}
                onChange={handleParticipantChange}
                placeholder="Sélectionnez un ou plusieurs participants..."
                error={errors.participantsIds}
                onSelectAll={handleSelectAllParticipants}
                disabled={!watchedClassId || loadingParticipants}
                loading={loadingParticipants}
              />
              {errors.participantsIds && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.participantsIds.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    {modalMode === "create"
                      ? "Programmation..."
                      : "Sauvegarde..."}
                  </span>
                ) : modalMode === "create" ? (
                  "Programmer"
                ) : (
                  "Sauvegarder"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoursProgrammerForm;
