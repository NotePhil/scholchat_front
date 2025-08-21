import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Users2,
  BookOpen,
  Activity,
  Hash,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MultiSelectDropdown from "./MultiSelectDropdown";
import AccederService from "../../../../../../services/accederService";

const schedulingSchema = yup.object().shape({
  coursId: yup.string().required("Le cours est obligatoire"),
  classeId: yup.string().nullable(),
  dateCoursPrevue: yup
    .string()
    .required("La date prévue est obligatoire")
    .test(
      "future-date",
      "La date ne peut pas être dans le passé",
      function (value) {
        if (!value) return false;
        const selectedDate = new Date(value);
        const now = new Date();
        return selectedDate > now;
      }
    ),
  dateDebutEffectif: yup
    .string()
    .nullable()
    .when(["dateCoursPrevue", "etatCoursProgramme"], {
      is: (dateCoursPrevue, etatCoursProgramme) =>
        dateCoursPrevue &&
        (etatCoursProgramme === "EN_COURS" || etatCoursProgramme === "TERMINE"),
      then: (schema) =>
        schema.test(
          "after-planned",
          "La date de début ne peut pas être avant la date prévue",
          function (value) {
            const { dateCoursPrevue } = this.parent;
            if (!value || !dateCoursPrevue) return true;
            return new Date(value) >= new Date(dateCoursPrevue);
          }
        ),
      otherwise: (schema) => schema,
    }),
  dateFinEffectif: yup
    .string()
    .nullable()
    .when(["dateDebutEffectif", "etatCoursProgramme"], {
      is: (dateDebutEffectif, etatCoursProgramme) =>
        dateDebutEffectif && etatCoursProgramme === "TERMINE",
      then: (schema) =>
        schema.test(
          "after-start",
          "La date de fin ne peut pas être avant la date de début",
          function (value) {
            const { dateDebutEffectif } = this.parent;
            if (!value || !dateDebutEffectif) return true;
            return new Date(value) >= new Date(dateDebutEffectif);
          }
        ),
      otherwise: (schema) => schema,
    }),
  lieu: yup.string().required("Le lieu est obligatoire"),
  description: yup.string().nullable(),
  capaciteMax: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .positive("La capacité doit être positive")
    .integer("La capacité doit être un nombre entier"),
  participantsIds: yup.array().of(yup.string()).nullable(),
  etatCoursProgramme: yup.string().required("L'état est obligatoire"),
});

const CoursProgrammerForm = ({
  isOpen,
  onClose,
  onSubmit,
  modalMode = "create",
  selectedScheduledCourse,
  courses = [],
  classes = [],
  loading = false,
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [classParticipants, setClassParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schedulingSchema),
    defaultValues: {
      participantsIds: [],
      etatCoursProgramme: "PLANIFIE",
      classeId: "",
      capaciteMax: "",
      description: "",
      dateDebutEffectif: "",
      dateFinEffectif: "",
    },
  });

  const watchedParticipants = watch("participantsIds");
  const watchedClassId = watch("classeId");
  const watchedEtat = watch("etatCoursProgramme");
  const watchedDatePrevue = watch("dateCoursPrevue");
  const watchedDateDebut = watch("dateDebutEffectif");

  // Update selected participants when form value changes
  useEffect(() => {
    setSelectedParticipants(watchedParticipants || []);
  }, [watchedParticipants]);

  // Fetch class participants when class changes
  useEffect(() => {
    const fetchClassParticipants = async (classeId) => {
      if (!classeId) {
        setClassParticipants([]);
        setSelectedParticipants([]);
        setValue("participantsIds", []);
        return;
      }

      try {
        setLoadingParticipants(true);
        const participants = await AccederService.obtenirUtilisateursAvecAcces(
          classeId
        );

        // Filter only approved students and format them professionally
        const approvedStudents = participants
          .filter((user) => user.etat === "APPROUVEE")
          .map((user) => {
            // Get the full name in a professional format
            const firstName = user.prenom || "";
            const lastName = user.nom || user.utilisateurNom || "";
            const fullName = `${firstName} ${lastName}`.trim();

            // Fallback to email or ID if no name is available
            const displayName =
              fullName ||
              user.nomComplet ||
              user.email ||
              `User ${user.utilisateurId || user.id}`;

            return {
              id: user.utilisateurId || user.id,
              name: displayName,
              email: user.email || user.utilisateurEmail || "",
              type: user.type || user.role || "MEMBER",
              // Keep original data for reference
              originalData: user,
            };
          })
          // Sort participants alphabetically by name for better UX
          .sort((a, b) => a.name.localeCompare(b.name));

        console.log("Processed participants:", approvedStudents);
        setClassParticipants(approvedStudents);
      } catch (error) {
        console.error("Error fetching class participants:", error);
        setClassParticipants([]);
        setSubmitError(
          "Erreur lors du chargement des participants de la classe"
        );
      } finally {
        setLoadingParticipants(false);
      }
    };

    if (watchedClassId) {
      fetchClassParticipants(watchedClassId);
    } else {
      setClassParticipants([]);
      setSelectedParticipants([]);
      setValue("participantsIds", []);
    }
  }, [watchedClassId, setValue]);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmitError("");

      if (modalMode === "edit" && selectedScheduledCourse) {
        const formatDateForInput = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          // Format for datetime-local input
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        const initialValues = {
          coursId: selectedScheduledCourse.coursId || "",
          classeId: selectedScheduledCourse.classeId || "",
          dateCoursPrevue: formatDateForInput(
            selectedScheduledCourse.dateCoursPrevue
          ),
          dateDebutEffectif: formatDateForInput(
            selectedScheduledCourse.dateDebutEffectif
          ),
          dateFinEffectif: formatDateForInput(
            selectedScheduledCourse.dateFinEffectif
          ),
          lieu: selectedScheduledCourse.lieu || "",
          description: selectedScheduledCourse.description || "",
          capaciteMax: selectedScheduledCourse.capaciteMax?.toString() || "",
          participantsIds: selectedScheduledCourse.participantsIds || [],
          etatCoursProgramme:
            selectedScheduledCourse.etatCoursProgramme || "PLANIFIE",
        };

        reset(initialValues);
        setSelectedParticipants(initialValues.participantsIds);
      } else {
        resetForm();
      }
    }
  }, [isOpen, modalMode, selectedScheduledCourse, reset]);

  const resetForm = () => {
    reset({
      coursId: "",
      classeId: "",
      dateCoursPrevue: "",
      dateDebutEffectif: "",
      dateFinEffectif: "",
      lieu: "",
      description: "",
      capaciteMax: "",
      participantsIds: [],
      etatCoursProgramme: "PLANIFIE",
    });
    setSelectedParticipants([]);
    setClassParticipants([]);
    setSubmitError("");
  };

  const handleSelectAllParticipants = () => {
    if (selectedParticipants.length === classParticipants.length) {
      handleParticipantChange([]);
    } else {
      handleParticipantChange(classParticipants.map((user) => user.id));
    }
  };

  const handleParticipantChange = (newSelectedIds) => {
    console.log("Participant selection changed:", newSelectedIds);
    setSelectedParticipants(newSelectedIds);
    setValue("participantsIds", newSelectedIds, { shouldValidate: true });
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get minimum date for date debut effectif (must be >= date prevue)
  const getMinDateDebutEffectif = () => {
    if (watchedDatePrevue) {
      return watchedDatePrevue;
    }
    return getCurrentDateTime();
  };

  // Get minimum date for date fin effectif (must be >= date debut effectif)
  const getMinDateFinEffectif = () => {
    if (watchedDateDebut) {
      return watchedDateDebut;
    }
    return getCurrentDateTime();
  };

  const handleFormSubmit = async (data) => {
    try {
      setSubmitError("");

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
        lieu: data.lieu.trim(),
        description: data.description?.trim() || null,
        capaciteMax: data.capaciteMax ? parseInt(data.capaciteMax) : null,
        participantsIds: selectedParticipants.filter((id) => id),
      };

      console.log("Submitting schedule data:", scheduleData);
      await onSubmit(scheduleData);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        error.message || "Une erreur est survenue lors de l'enregistrement"
      );
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Determine if date fields should be disabled based on state
  const shouldDisableDateDebutEffectif = watchedEtat === "PLANIFIE";
  const shouldDisableDateFinEffectif = watchedEtat !== "TERMINE";

  // Status options with icons
  const getStatusDisplay = (status) => {
    const statusMap = {
      PLANIFIE: { icon: Calendar, text: "Planifié", color: "text-blue-600" },
      EN_COURS: { icon: Activity, text: "En cours", color: "text-green-600" },
      TERMINE: { icon: BookOpen, text: "Terminé", color: "text-gray-600" },
      ANNULE: { icon: X, text: "Annulé", color: "text-red-600" },
    };
    return statusMap[status] || statusMap.PLANIFIE;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <Calendar className="mr-3 text-indigo-600" size={28} />
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

          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="course-form"
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            {/* Course and State Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="coursId"
                  className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"
                >
                  <BookOpen size={16} className="mr-2 text-indigo-600" />
                  Cours *
                </label>
                <select
                  id="coursId"
                  {...register("coursId")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                    errors.coursId
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
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
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.coursId.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="etatCoursProgramme"
                  className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"
                >
                  <Activity size={16} className="mr-2 text-indigo-600" />
                  État *
                </label>
                <select
                  id="etatCoursProgramme"
                  {...register("etatCoursProgramme")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                    errors.etatCoursProgramme
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                  onChange={(e) => {
                    setValue("etatCoursProgramme", e.target.value);
                    // Clear dependent date fields when changing state
                    if (e.target.value === "PLANIFIE") {
                      setValue("dateDebutEffectif", "");
                      setValue("dateFinEffectif", "");
                    } else if (e.target.value === "EN_COURS") {
                      setValue("dateFinEffectif", "");
                    }
                    clearErrors(["dateDebutEffectif", "dateFinEffectif"]);
                  }}
                >
                  <option value="PLANIFIE">Planifié</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
                </select>
                {errors.etatCoursProgramme && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.etatCoursProgramme.message}
                  </p>
                )}
              </div>
            </div>

            {/* Class and Capacity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="classeId"
                  className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"
                >
                  <Users2 size={16} className="mr-2 text-indigo-600" />
                  Classe
                </label>
                <select
                  id="classeId"
                  {...register("classeId")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                    errors.classeId
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
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
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.classeId.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="capaciteMax"
                  className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"
                >
                  <Hash size={16} className="mr-2 text-indigo-600" />
                  Capacité maximale
                </label>
                <input
                  id="capaciteMax"
                  type="number"
                  min="1"
                  {...register("capaciteMax")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                    errors.capaciteMax
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                  placeholder="30 (optionnel)"
                />
                {errors.capaciteMax && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.capaciteMax.message}
                  </p>
                )}
              </div>
            </div>

            {/* Date Controls with Better Alignment */}
            <div className="bg-slate-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                <Clock className="mr-2 text-indigo-600" size={20} />
                Planning des dates
              </h3>

              <div className="space-y-6">
                {/* Planned Date - Always on top, full width on mobile */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="dateCoursPrevue"
                      className="block text-sm font-semibold text-slate-700 mb-3 flex items-center"
                    >
                      <Calendar size={16} className="mr-2 text-blue-600" />
                      Date prévue *
                    </label>
                    <input
                      id="dateCoursPrevue"
                      type="datetime-local"
                      min={getCurrentDateTime()}
                      {...register("dateCoursPrevue")}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-base ${
                        errors.dateCoursPrevue
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200"
                      }`}
                      style={{ minHeight: "48px" }}
                    />
                    {errors.dateCoursPrevue && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                        {errors.dateCoursPrevue.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Effective Dates - Side by side on larger screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="dateDebutEffectif"
                      className="block text-sm font-semibold text-slate-700 mb-3"
                    >
                      <div className="flex items-center mb-1">
                        <Activity size={16} className="mr-2 text-green-600" />
                        Date début effectif
                      </div>
                      {shouldDisableDateDebutEffectif && (
                        <span className="text-xs text-amber-600 font-medium flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          État doit être "En cours" ou "Terminé"
                        </span>
                      )}
                    </label>
                    <input
                      id="dateDebutEffectif"
                      type="datetime-local"
                      min={getMinDateDebutEffectif()}
                      {...register("dateDebutEffectif")}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base ${
                        errors.dateDebutEffectif
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200"
                      } ${
                        shouldDisableDateDebutEffectif
                          ? "bg-slate-100 text-slate-500"
                          : "bg-white"
                      }`}
                      style={{ minHeight: "48px" }}
                      disabled={shouldDisableDateDebutEffectif}
                    />
                    {errors.dateDebutEffectif && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                        {errors.dateDebutEffectif.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="dateFinEffectif"
                      className="block text-sm font-semibold text-slate-700 mb-3"
                    >
                      <div className="flex items-center mb-1">
                        <BookOpen size={16} className="mr-2 text-gray-600" />
                        Date fin effectif
                      </div>
                      {shouldDisableDateFinEffectif && (
                        <span className="text-xs text-amber-600 font-medium flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          État doit être "Terminé"
                        </span>
                      )}
                    </label>
                    <input
                      id="dateFinEffectif"
                      type="datetime-local"
                      min={getMinDateFinEffectif()}
                      {...register("dateFinEffectif")}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base ${
                        errors.dateFinEffectif
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200"
                      } ${
                        shouldDisableDateFinEffectif
                          ? "bg-slate-100 text-slate-500"
                          : "bg-white"
                      }`}
                      style={{ minHeight: "48px" }}
                      disabled={shouldDisableDateFinEffectif}
                    />
                    {errors.dateFinEffectif && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                        {errors.dateFinEffectif.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="lieu"
                className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"
              >
                <MapPin size={16} className="mr-2 text-indigo-600" />
                Lieu *
              </label>
              <input
                id="lieu"
                type="text"
                {...register("lieu")}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                  errors.lieu ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
                placeholder="Salle 203, Bâtiment A"
              />
              {errors.lieu && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.lieu.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"
              >
                <FileText size={16} className="mr-2 text-indigo-600" />
                Description / Notes
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white resize-none"
                placeholder="Notes spéciales pour cette session..."
              />
            </div>

            {/* Participants - Enhanced Section */}
            <div className="bg-slate-50 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-slate-700">
                  <div className="flex items-center">
                    <Users2 size={16} className="mr-2 text-indigo-600" />
                    Participants (optionnel)
                  </div>
                  {!watchedClassId && (
                    <span className="block text-xs text-amber-600 font-medium mt-1 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      Sélectionnez d'abord une classe
                    </span>
                  )}
                </label>

                {/* Participant count display */}
                {classParticipants.length > 0 && (
                  <div className="text-sm text-slate-600 bg-white px-3 py-1 rounded-full border">
                    {selectedParticipants.length} / {classParticipants.length}{" "}
                    sélectionnés
                  </div>
                )}
              </div>

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

              {/* Show loading state for participants */}
              {loadingParticipants && (
                <div className="mt-2 text-sm text-indigo-600 flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600"
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
                  Chargement des participants...
                </div>
              )}

              {/* Show selected participants preview */}
              {selectedParticipants.length > 0 &&
                classParticipants.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-slate-700 mb-2">
                      Participants sélectionnés :
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedParticipants
                        .map((id) => classParticipants.find((p) => p.id === id))
                        .filter(Boolean)
                        .slice(0, 10) // Show max 10 participants to avoid overflow
                        .map((participant) => (
                          <span
                            key={participant.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                          >
                            {participant.name}
                            {participant.email && (
                              <span className="ml-1 text-indigo-600">
                                ({participant.email.split("@")[0]})
                              </span>
                            )}
                          </span>
                        ))}
                      {selectedParticipants.length > 10 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          +{selectedParticipants.length - 10} autres
                        </span>
                      )}
                    </div>
                  </div>
                )}

              {errors.participantsIds && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.participantsIds.message}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors rounded-lg hover:bg-slate-200 flex items-center justify-center"
            >
              <X size={16} className="mr-2" />
              Annuler
            </button>
            <button
              type="submit"
              form="course-form"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
            >
              {loading ? (
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
                  {modalMode === "create"
                    ? "Programmation..."
                    : "Sauvegarde..."}
                </>
              ) : modalMode === "create" ? (
                <>
                  <Plus size={16} className="mr-2" />
                  Programmer
                </>
              ) : (
                <>
                  <BookOpen size={16} className="mr-2" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursProgrammerForm;
