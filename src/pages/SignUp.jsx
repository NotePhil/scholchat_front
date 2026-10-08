import React, { useState, useCallback, useEffect, useRef } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCamera,
  faChalkboardUser,
  faCheck,
  faCircleInfo,
  faEnvelope,
  faIdCard,
  faKey,
  faLocationDot,
  faMagnifyingGlass,
  faPaperPlane,
  faPlus,
  faUser,
  faUserGraduate,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import CountrySelectSearchable from "../components/common/CountrySelectSearchable";
import { Alert, AuthShell, BrandLogo, Button, Stepper, TextField } from "../components/frontoffice/ui";
import { ClassPreviewCard, ClassPreviewStatus } from "../components/common/ClassPreviewCard";
import { useClassPreview } from "../hooks/useClassPreview";
import ChildCodeCard from "../components/frontoffice/ChildCodeCard";
import { INVALID_EMAIL_MESSAGE, isValidEmail, mapSignupFieldError } from "../utils/signupErrors";
import community from "../assets/illustrations/community.png";
import onboarding1 from "../assets/illustrations/onboarding-1.png";
import onboarding4 from "../assets/illustrations/onboarding-4.png";
import loginHero from "../assets/illustrations/login-hero.png";
import { isAcceptedPhoneNumber } from "../utils/phone";

const API = process.env.REACT_APP_API_BASE_URL;

/*
 * Inscription (design sheets 24/26):
 *  0. "Je suis…" — Professeur / Élève / Parent (?role=… in the URL)
 *  Professeur (unchanged process): 1 infos perso → 2 détails enseignant (matricule, CNI recto/verso,
 *    selfie, uploaded with the X-Upload-Token returned by POST /utilisateurs) → 3 vérification → envoi ;
 *    the account is validated by the administration, activation link by e-mail (verify-email page).
 *  Élève (class-code process): 1 infos perso → 2 classe / code → 3 confirmation →
 *    POST /utilisateurs {…, codeClasse} → "Compte créé / en attente d'approbation" page; an acknowledgement
 *    e-mail is sent at once, the class's teacher approves, then login + temporary password by e-mail.
 *  Parent: 1 infos perso → 2 « Vos enfants » (how many, then one card per child: prénom, nom, class code
 *    checked with « Vérifier le code ») → 3 récapitulatif → POST /utilisateurs {type:"parent", …,
 *    enfants:[{prenom, nom, codeClasse}]}. The parent account is created at once (login + temporary
 *    password by e-mail); each child's class request waits for the teacher (« Mes enfants »).
 *  Update mode (?email=…&token=…): a professor completes / fixes his documents.
 */
const ROLES = {
  professeur: {
    label: "Professeur",
    title: "Inscription – Professeur",
    icon: faChalkboardUser,
    color: "#8C52FF",
    text: "Enseigner, partager et suivre vos élèves.",
    steps: ["Infos perso", "Détails enseignant", "Vérification"],
    illustration: onboarding1,
  },
  eleve: {
    label: "Élève",
    title: "Inscription – Élève",
    icon: faUserGraduate,
    color: "#3B82F6",
    text: "Apprendre, progresser et réussir.",
    steps: ["Infos perso", "Classe / Code", "Confirmation"],
    illustration: loginHero,
  },
  parent: {
    label: "Parent",
    title: "Inscription – Parent",
    icon: faUsers,
    color: "#10B981",
    text: "Suivez vos enfants, communiquez avec les enseignants.",
    steps: ["Infos perso", "Vos enfants", "Récapitulatif"],
    illustration: onboarding4,
  },
};
const ROLE_KEYS = Object.keys(ROLES);
const DOCS = [
  { name: "cniRecto", label: "CNI recto", icon: faIdCard },
  { name: "cniVerso", label: "CNI verso", icon: faIdCard },
  { name: "selfie", label: "Photo de profil (selfie)", icon: faCamera },
];
const FILE_FIELDS = DOCS.map((d) => d.name);
const MAX_CHILDREN = 10;
const CHILD_CODE_ERRORS = ["CODE_CLASSE_INVALIDE", "CLASSE_NON_ACTIVE", "CODE_CLASSE_REQUIS", "CLASSE_RESERVEE_MINEURS"];

let childKeySeq = 0;
const newChild = (data = {}) => ({
  key: `c${Date.now()}-${++childKeySeq}`,
  prenom: data.prenom || "",
  nom: data.nom || "",
  codeClasse: data.codeClasse || "",
  preview: null,
  errors: {},
  resetKey: 0,
});

const EMPTY_FORM = {
  type: "",
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  adresse: "",
  etat: "INACTIVE",
  codeClasse: "",
  cniRecto: "",
  cniVerso: "",
  selfie: "",
  matriculeProfesseur: "",
  hasUploaded: false,
  enfants: [],
};

// Files can't be serialized: anything that is not a non-empty string (an already uploaded URL) is reset.
const sanitizeStored = (data) => {
  const clean = { ...EMPTY_FORM, ...data };
  FILE_FIELDS.forEach((f) => {
    if (typeof clean[f] !== "string") clean[f] = "";
  });
  // Children: names and codes only (each code is verified again).
  clean.enfants = Array.isArray(clean.enfants) ? clean.enfants.slice(0, MAX_CHILDREN).map((c) => newChild(c || {})) : [];
  return clean;
};

const clearSignupStorage = () => {
  localStorage.removeItem("signupFormData");
  localStorage.removeItem("imagePreviews");
  localStorage.removeItem("createdUserId");
  localStorage.removeItem("signupUploadToken");
};

const SignUp = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("CM");
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [token, setToken] = useState("");
  const [createdUserId, setCreatedUserId] = useState(null);
  const [pickedRole, setPickedRole] = useState("");
  const [imagePreviews, setImagePreviews] = useState({ cniRecto: null, cniVerso: null, selfie: null });
  const [formData, setFormData] = useState(EMPTY_FORM);
  // Existing e-mail refused / reported by the sign-up: "exists" | "pending" | "inactive" | "other" (actions
  // shown under the e-mail field).
  const [emailIssue, setEmailIssue] = useState(null);
  const alertTimer = useRef(null);

  const roleParam = new URLSearchParams(location.search).get("role");
  const role = isUpdateMode ? "professeur" : ROLE_KEYS.includes(roleParam) ? roleParam : null;
  const roleConf = role ? ROLES[role] : null;
  const isProfessor = role === "professeur";
  const isParentRole = role === "parent";
  // Élève: class code lookup (GET /public/classes/apercu), run only by the "Vérifier le code" button.
  // Parent: one lookup per child card (ChildCodeCard).
  const classPreview = useClassPreview(formData.codeClasse, "eleve", {
    enabled: role === "eleve",
  });
  const [childCountChoice, setChildCountChoice] = useState(1);
  const enfants = formData.enfants || [];

  const showAlert = (message, type = "error", duration = 6000) => {
    if (alertTimer.current) clearTimeout(alertTimer.current);
    setAlertMessage(message);
    setAlertType(type);
    alertTimer.current = setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, duration);
  };
  useEffect(() => () => alertTimer.current && clearTimeout(alertTimer.current), []);

  // Backend refusal shown as-is. ROLE_INCOMPATIBLE (409): the e-mail belongs to an account whose
  // profiles can't be combined with the requested one (a student account is exclusive) — longer display.
  const showBackendError = (err, fallback) => {
    const data = err.response?.data;
    const msg = (data && typeof data === "object" && data.message) || (!err.response ? "Impossible de contacter le serveur. Vérifiez votre connexion." : fallback);
    showAlert(msg, "error", data?.code === "ROLE_INCOMPATIBLE" ? 12000 : 7000);
    return msg;
  };

  // Refusal about the e-mail (existing account, pending class sign-up, invalid format…) or the phone:
  // back to the personal information step with the error on the field. Returns false otherwise.
  const showFieldError = (err) => {
    const fieldError = mapSignupFieldError(err);
    if (!fieldError) return false;
    setErrors({ [fieldError.field]: fieldError.message });
    setEmailIssue(fieldError.field === "email" ? fieldError.issue || null : null);
    setCurrentStep(1);
    showAlert(fieldError.message, "error", 12000);
    return true;
  };

  /* ---------- Load / persist the draft ---------- */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    const tokenParam = params.get("token");
    setErrors({});
    setCurrentStep(1);

    if (emailParam && tokenParam) {
      setIsUpdateMode(true);
      setToken(tokenParam);
      setFormData((prev) => ({ ...prev, email: emailParam, type: "professeur" }));
      return;
    }
    setIsUpdateMode(false);
    const r = params.get("role");
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("signupFormData") || "null");
    } catch {
      stored = null;
    }
    const storedUserId = localStorage.getItem("createdUserId");
    if (storedUserId) setCreatedUserId(storedUserId);
    setFormData((prev) => {
      const base = stored ? sanitizeStored({ ...prev, ...stored }) : prev;
      return ROLE_KEYS.includes(r) ? { ...base, type: r } : base;
    });
    if (ROLE_KEYS.includes(r)) {
      localStorage.setItem("userType", r);
      setPickedRole(r);
    }
  }, [location.search]);

  useEffect(() => {
    if (isUpdateMode) return;
    const { cniRecto, cniVerso, selfie, enfants: kids, ...serializable } = formData;
    serializable.enfants = (kids || []).map(({ prenom, nom, codeClasse }) => ({ prenom, nom, codeClasse }));
    localStorage.setItem("signupFormData", JSON.stringify(serializable));
  }, [formData, isUpdateMode]);

  /* ---------- Field handlers ---------- */
  const clearError = (name) => {
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
    if (name === "email") setEmailIssue(null);
  };

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({ ...prev, telephone: value || "" }));
    if (value) {
      if (value.startsWith("+237")) setSelectedCountry("CM");
      else if (value.startsWith("+33")) setSelectedCountry("FR");
    }
    clearError("telephone");
  };

  const compressImage = async (file, quality = 0.7) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = reject;
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 800;
          let { width, height } = img;
          if (width > height && width > max) {
            height *= max / width;
            width = max;
          } else if (height >= width && height > max) {
            width *= max / height;
            height = max;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
      };
    });

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showAlert("Veuillez télécharger un fichier image (JPEG, PNG)");
      e.target.value = "";
      return;
    }
    try {
      const preview = await compressImage(file);
      setImagePreviews((prev) => ({ ...prev, [fieldName]: preview }));
      setFormData((prev) => ({ ...prev, [fieldName]: file }));
      clearError(fieldName);
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      showAlert("Erreur lors du traitement de l'image. Veuillez réessayer.");
      e.target.value = "";
    }
  };

  const handleRemoveImage = (fieldName) => {
    setImagePreviews((prev) => ({ ...prev, [fieldName]: null }));
    setFormData((prev) => ({ ...prev, [fieldName]: "" }));
  };

  /* ---------- Validation ---------- */
  const applyErrors = (newErrors) => {
    setErrors(newErrors);
    const first = Object.values(newErrors)[0];
    if (first) showAlert(first);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep1 = useCallback(() => {
    const e = {};
    if (!formData.prenom.trim()) e.prenom = "Le prénom est requis";
    if (!formData.nom.trim()) e.nom = "Le nom est requis";
    if (!formData.email.trim()) e.email = "L'email est requis";
    else if (!isValidEmail(formData.email)) e.email = INVALID_EMAIL_MESSAGE;
    if (!formData.telephone) e.telephone = "Le numéro de téléphone est requis";
    // A country picked but no (or an incomplete) number: formData.telephone is just "+237"…
    else if (!isAcceptedPhoneNumber(formData.telephone)) e.telephone = "Le numéro de téléphone est incomplet ou invalide";
    if (!formData.adresse.trim()) e.adresse = "L'adresse est requise";
    return applyErrors(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const validateDocuments = useCallback(() => {
    const e = {};
    if (!isUpdateMode) {
      if (!formData.cniRecto) e.cniRecto = "La photo recto de la CNI est requise";
      if (!formData.cniVerso) e.cniVerso = "La photo verso de la CNI est requise";
      if (!formData.selfie) e.selfie = "Une photo de profil est requise";
    }
    return applyErrors(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, isUpdateMode]);

  // The code must match an existing, joinable class (preview found) before going further.
  const validateClassCode = async () => {
    if (!formData.codeClasse.trim()) return applyErrors({ codeClasse: "Le code de la classe est requis" });
    const preview = await classPreview.verify();
    if (!preview) {
      setErrors({ codeClasse: true });
      return false;
    }
    setErrors({});
    return true;
  };

  /* ---------- Professor: documents upload (X-Upload-Token flow) ---------- */
  // Short-lived signed token returned by POST /utilisateurs for a professor sign-up: the backend only
  // accepts the anonymous document upload (presigned-url, proxy-upload, PATCH) with it.
  const uploadTokenHeaders = (uploadToken) => (uploadToken ? { "X-Upload-Token": uploadToken } : {});

  const uploadFileToS3 = async (file, userId, documentType, uploadToken) => {
    try {
      const timestamp = Date.now();
      const fileExtension = (file.name || "image.jpg").split(".").pop().toLowerCase();
      const fileName = `${documentType}_${timestamp}.${fileExtension}`;

      const presignedResponse = await axios.post(
        `${API}/media/presigned-url`,
        { fileName, contentType: file.type, mediaType: "IMAGE", ownerId: userId, documentType },
        { headers: uploadTokenHeaders(uploadToken) },
      );
      const { url } = presignedResponse.data;

      let fileToUpload;
      if (typeof file === "string" && file.startsWith("data:")) {
        const res = await fetch(file);
        fileToUpload = await res.blob();
      } else {
        fileToUpload = file;
      }

      // Try uploading straight to MinIO/S3 with the presigned URL first; if that's blocked (e.g. no
      // CORS policy on the storage endpoint for this origin), fall back to the backend proxy.
      try {
        const uploadResponse = await fetch(url, { method: "PUT", body: fileToUpload, headers: { "Content-Type": file.type } });
        if (!uploadResponse.ok) throw new Error(`Upload failed with status ${uploadResponse.status}`);
      } catch (directError) {
        console.warn("Direct upload failed (likely CORS), falling back to backend proxy:", directError);
        const formDataUpload = new FormData();
        formDataUpload.append("file", fileToUpload, fileName);
        formDataUpload.append("presignedUrl", url);
        formDataUpload.append("contentType", file.type);
        await axios.post(`${API}/media/proxy-upload`, formDataUpload, {
          headers: { "Content-Type": "multipart/form-data", ...uploadTokenHeaders(uploadToken) },
        });
      }
      return url.split("?")[0];
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error(`Upload error: ${error.message}`);
    }
  };

  const completeRegistration = () => {
    localStorage.setItem("userEmail", formData.email);
    clearSignupStorage();
    navigate(`/schoolchat/verify-email?email=${encodeURIComponent(formData.email)}`);
  };

  const handleDocumentSubmission = async () => {
    try {
      if (!validateDocuments()) {
        setCurrentStep(2);
        return;
      }
      setIsSubmitting(true);
      let userId = isUpdateMode ? formData.id : createdUserId;

      // (Re)post the profile even if an id from an earlier attempt is stored: the call is
      // idempotent for an unfinished professor request (the backend resumes it and returns the
      // same id), and its inscriptionStatut tells a brand-new account apart from an existing
      // account that is requesting the professor role (ROLE_PENDING_VALIDATION). Resuming an
      // unfinished sign-up requires the upload token of the first attempt (X-Upload-Token).
      let inscriptionStatut = null;
      let uploadToken = null;
      if (!isUpdateMode) {
        const previousToken = createdUserId ? localStorage.getItem("signupUploadToken") : null;
        const response = await axios.post(`${API}/utilisateurs`, {
          type: "professeur",
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          email: formData.email.trim(),
          telephone: formData.telephone,
          adresse: formData.adresse.trim(),
          etat: "INACTIVE",
        }, { headers: uploadTokenHeaders(previousToken) });
        userId = response.data.id;
        inscriptionStatut = response.data?.inscriptionStatut || response.data?.statutInscription || null;
        uploadToken = response.data?.uploadToken || null;
        setCreatedUserId(userId);
        localStorage.setItem("createdUserId", userId);
        if (uploadToken) localStorage.setItem("signupUploadToken", uploadToken);
      }

      const updatePayload = { id: userId, type: "professeur", hasUploaded: false };
      if (formData.matriculeProfesseur?.trim()) updatePayload.matriculeProfesseur = formData.matriculeProfesseur.trim();

      if (formData.cniRecto instanceof File || typeof formData.cniRecto === "string") {
        updatePayload.cniUrlRecto = await uploadFileToS3(formData.cniRecto, userId, "cni-recto", uploadToken);
      }
      if (formData.cniVerso instanceof File || typeof formData.cniVerso === "string") {
        updatePayload.cniUrlVerso = await uploadFileToS3(formData.cniVerso, userId, "cni-verso", uploadToken);
      }
      if (formData.selfie instanceof File || typeof formData.selfie === "string") {
        updatePayload.selfieUrl = await uploadFileToS3(formData.selfie, userId, "selfie", uploadToken);
      }
      if (updatePayload.cniUrlRecto && updatePayload.cniUrlVerso && updatePayload.selfieUrl) {
        updatePayload.hasUploaded = true;
      }

      if (isUpdateMode) {
        await axios.post(`${API}/auth/users/update`, updatePayload, { params: { email: formData.email, token } });
        showAlert("Vos informations ont été mises à jour avec succès!", "success");
        setTimeout(() => navigate("/schoolchat/login"), 2000);
      } else {
        await axios.patch(`${API}/utilisateurs/${userId}`, updatePayload, { headers: uploadTokenHeaders(uploadToken) });
        if (inscriptionStatut === "ROLE_PENDING_VALIDATION") {
          // Existing account (parent, élève…) asking for the professor role: no new activation,
          // the profile becomes available after admin validation.
          clearSignupStorage();
          showAlert("Demande de profil professeur reçue. Elle sera active après validation par l'administration.", "success");
          setTimeout(() => navigate("/schoolchat/login"), 2500);
          return;
        }
        completeRegistration();
      }
    } catch (err) {
      console.error("Erreur lors du traitement des documents:", err);
      if (!showFieldError(err)) showBackendError(err, "Erreur lors du traitement des documents");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Parent / Élève: sign-up with a class code ---------- */
  const submitWithClassCode = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!(await validateClassCode())) {
      setCurrentStep(2);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        type: role,
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone,
        adresse: formData.adresse.trim(),
        etat: "INACTIVE",
        codeClasse: formData.codeClasse.trim(),
      };

      const response = await axios.post(`${API}/utilisateurs`, payload);
      const data = response.data || {};
      const statut = data.statutInscription || data.inscriptionStatut || null;
      const classeNom = data.classeNom || data.classe?.nom || null;
      clearSignupStorage();

      // E-mail already registered: the backend added the role to that account.
      if (statut === "ROLE_ADDED") {
        showAlert(
          classeNom
            ? `Rôle ajouté à votre compte et demande envoyée pour la classe ${classeNom}. Connectez-vous avec votre mot de passe habituel.`
            : "Rôle ajouté avec succès ! Vous pouvez vous connecter.",
          "success",
        );
        setTimeout(() => navigate("/schoolchat/login", { state: { email: payload.email } }), 2500);
        return;
      }
      if (statut === "ROLE_PENDING_VALIDATION") {
        // Existing account (not active yet): the student profile request was added to it.
        navigate("/schoolchat/login", {
          state: {
            email: payload.email,
            message: `Un compte existe déjà avec cette adresse e-mail : votre demande${
              classeNom ? ` pour la classe ${classeNom}` : ""
            } y a été ajoutée et attend l'approbation du professeur de la classe.`,
          },
        });
        return;
      }
      if (!statut) {
        // Backend without the class-code process: historical activation e-mail.
        completeRegistration();
        return;
      }
      navigate("/schoolchat/compte-cree", {
        replace: true,
        state: { email: payload.email, classeNom, role, statut },
      });
    } catch (err) {
      console.error("Erreur lors de l'inscription:", err);
      const data = err.response?.data || {};
      const code = String(data.code || "").toUpperCase();
      if (showFieldError(err)) return;
      const msg = showBackendError(err, "Erreur lors de la création du compte");
      if (code.includes("CLASSE") || code.includes("CODE")) {
        // CODE_CLASSE_REQUIS, CODE_CLASSE_INVALIDE, CLASSE_NON_ACTIVE, CLASSE_RESERVEE_MINEURS
        classPreview.reset();
        setErrors({ codeClasse: msg });
        setCurrentStep(2);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Parent: children (« Vos enfants ») ---------- */
  const updateChildren = useCallback(
    (updater) => setFormData((prev) => ({ ...prev, enfants: updater(prev.enfants || []) })),
    [],
  );
  const setChildCount = (count) => {
    const n = Math.max(1, Math.min(MAX_CHILDREN, Number(count) || 1));
    updateChildren((list) =>
      n > list.length ? [...list, ...Array.from({ length: n - list.length }, () => newChild())] : list.slice(0, n),
    );
  };
  const addChild = () => updateChildren((list) => (list.length >= MAX_CHILDREN ? list : [...list, newChild()]));
  const removeChild = (key) => updateChildren((list) => (list.length <= 1 ? list : list.filter((c) => c.key !== key)));
  const changeChild = (key, field, value) =>
    updateChildren((list) =>
      list.map((c) => (c.key === key ? { ...c, [field]: value, errors: { ...c.errors, [field]: undefined, general: undefined } } : c)),
    );
  const setChildPreview = useCallback(
    (key, preview) =>
      updateChildren((list) =>
        list.map((c) =>
          c.key !== key || c.preview === preview
            ? c
            : { ...c, preview, errors: preview ? { ...c.errors, codeClasse: undefined, general: undefined } : c.errors },
        ),
      ),
    [updateChildren],
  );
  const allChildrenVerified = enfants.length > 0 && enfants.every((c) => !!c.preview);

  // Names required, every code verified, no child twice in the same class.
  const validateChildren = () => {
    if (enfants.length === 0) {
      showAlert("Indiquez combien d'enfants vous souhaitez inscrire.");
      return false;
    }
    const seen = new Set();
    let firstError = "";
    const checked = enfants.map((c) => {
      const e = {};
      if (!c.prenom.trim()) e.prenom = "Le prénom est requis";
      if (!c.nom.trim()) e.nom = "Le nom est requis";
      if (!c.preview) e.codeClasse = c.codeClasse.trim() ? "Cliquez sur « Vérifier le code »" : "Le code de la classe est requis";
      const id = `${c.prenom.trim().toLowerCase()}|${c.nom.trim().toLowerCase()}|${c.preview?.id || c.codeClasse.trim()}`;
      if (!e.prenom && !e.nom && seen.has(id)) e.general = "Cet enfant figure déjà dans la liste pour cette classe.";
      seen.add(id);
      if (!firstError) firstError = Object.values(e)[0] || "";
      return Object.keys(e).length ? { ...c, errors: { ...c.errors, ...e } } : c;
    });
    if (!firstError) return true;
    updateChildren(() => checked);
    showAlert(firstError);
    return false;
  };

  const submitParent = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateChildren()) {
      setCurrentStep(2);
      return;
    }
    setIsSubmitting(true);
    const email = formData.email.trim();
    try {
      const payload = {
        type: "parent",
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email,
        telephone: formData.telephone,
        adresse: formData.adresse.trim(),
        enfants: enfants.map((c) => ({ prenom: c.prenom.trim(), nom: c.nom.trim(), codeClasse: c.codeClasse.trim() })),
      };
      const response = await axios.post(`${API}/utilisateurs`, payload);
      const data = response.data || {};
      const statut = data.statutInscription || data.inscriptionStatut || null;
      clearSignupStorage();

      if (statut === "ROLE_ADDED" || statut === "ROLE_PENDING_VALIDATION") {
        // E-mail already registered: the parent profile (and the children's requests) went to that account.
        navigate("/schoolchat/login", {
          state: {
            email,
            message:
              "Un compte existe déjà avec cette adresse e-mail : le profil parent y a été ajouté. Connectez-vous avec votre mot de passe habituel ; vos enfants apparaissent dans « Mes enfants ».",
          },
        });
        return;
      }
      const returned = Array.isArray(data.enfants) && data.enfants.length > 0 ? data.enfants : null;
      const recap = returned
        ? returned.map((e) => ({ prenom: e.prenom, nom: e.nom, classeNom: e.classeNom || null }))
        : enfants.map((c) => ({ prenom: c.prenom.trim(), nom: c.nom.trim(), classeNom: c.preview?.nom || null }));
      navigate("/schoolchat/compte-cree", {
        replace: true,
        state: { email, role: "parent", statut, enfants: recap },
      });
    } catch (err) {
      console.error("Erreur lors de l'inscription parent:", err);
      if (showFieldError(err)) return;
      const data = err.response?.data || {};
      const code = String(data.code || "").toUpperCase();
      const rawIndex = data.enfantIndex;
      const idx =
        typeof rawIndex === "number" ? rawIndex : /^\d+$/.test(String(rawIndex ?? "")) ? Number(rawIndex) : null;
      const msg = showBackendError(err, "Erreur lors de la création du compte");
      if (idx !== null && idx >= 0 && idx < enfants.length) {
        const aboutCode = CHILD_CODE_ERRORS.includes(code) || /CODE|CLASSE/.test(code);
        updateChildren((list) =>
          list.map((c, i) => {
            if (i !== idx) return c;
            return aboutCode
              ? { ...c, preview: null, resetKey: c.resetKey + 1, errors: { codeClasse: msg } }
              : { ...c, errors: { general: msg } };
          }),
        );
        setCurrentStep(2);
      } else if (code.includes("ENFANT")) {
        setCurrentStep(2);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Navigation ---------- */
  const handleNextStep = async () => {
    if (isSubmitting) return;
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2 && isProfessor) {
      if (validateDocuments()) setCurrentStep(3);
    } else if (currentStep === 2 && isParentRole) {
      if (validateChildren()) {
        setErrors({});
        setCurrentStep(3);
      }
    } else if (currentStep === 2) {
      // Single button: "Vérifier le code" runs the lookup (card or error under the field); once the class
      // is found it becomes "Suivant".
      if (!classPreview.isValid) {
        await validateClassCode();
        return;
      }
      setErrors({});
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (isProfessor) await handleDocumentSubmission();
      else if (isParentRole) await submitParent();
      else await submitWithClassCode();
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else if (!isUpdateMode) navigate("/schoolchat/signup");
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  /* ---------- Role choice ("Je suis…") ---------- */
  if (!role) {
    return (
      <AuthShell theme={theme} illustration={community} illustrationAlt="La communauté ScholChat">
        <div className="text-center">
          <BrandLogo className="mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Je suis…</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Choisissez votre profil pour commencer à utiliser ScholChat.</p>
        </div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4" role="radiogroup" aria-label="Profil">
          {ROLE_KEYS.map((key) => {
            const r = ROLES[key];
            const selected = pickedRole === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPickedRole(key)}
                onDoubleClick={() => navigate(`/schoolchat/signup?role=${key}`)}
                className={`relative rounded-2xl border-2 p-5 text-center transition-all ${
                  selected
                    ? "border-[#8C52FF] bg-violet-50 dark:bg-violet-500/10 shadow-lg shadow-violet-500/10"
                    : "border-slate-100 dark:border-slate-700 hover:border-[#8C52FF]/50 bg-white dark:bg-slate-800"
                }`}
              >
                {selected && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#8C52FF] text-white text-[10px] flex items-center justify-center">
                    <FontAwesomeIcon icon={faCheck} />
                  </span>
                )}
                <span
                  className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl mb-3"
                  style={{ background: r.color }}
                >
                  <FontAwesomeIcon icon={r.icon} />
                </span>
                <span className="block font-semibold text-slate-900 dark:text-white">{r.label}</span>
                <span className="block mt-1 text-xs text-slate-500 dark:text-slate-400">{r.text}</span>
              </button>
            );
          })}
        </div>
        <Button
          className="w-full mt-8"
          disabled={!pickedRole}
          onClick={() => navigate(`/schoolchat/signup?role=${pickedRole}`)}
          icon={faArrowRight}
        >
          Créer un compte
        </Button>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Déjà un compte ?{" "}
          <Link to="/schoolchat/login" className="font-semibold text-[#4F46E5] dark:text-indigo-300 hover:underline">
            Se connecter
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-400">
          Votre offre a expiré ?{" "}
          <Link to="/schoolchat/renouveler-offre" className="font-semibold text-[#F59E0B] hover:underline">
            Renouveler mon compte
          </Link>
        </p>
      </AuthShell>
    );
  }

  /* ---------- Summary helpers ---------- */
  const SummaryRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-4 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 dark:text-white break-all sm:text-right">{value || "—"}</dd>
    </div>
  );

  const isLastStep = currentStep === 3;
  const verifyingCode = role === "eleve" && currentStep === 2 && !classPreview.isValid;
  const nextLabel = isLastStep
    ? isUpdateMode
      ? "Mettre à jour"
      : isProfessor
        ? "Envoyer ma demande"
        : isParentRole
          ? "Confirmer"
          : "Créer mon compte"
    : verifyingCode
      ? "Vérifier le code"
      : "Suivant";

  return (
    <AuthShell theme={theme} illustration={roleConf.illustration} illustrationAlt="" wide>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0"
            style={{ background: roleConf.color }}
          >
            <FontAwesomeIcon icon={roleConf.icon} />
          </span>
          {isUpdateMode ? "Mise à jour de votre dossier" : roleConf.title}
        </h1>
        {!isUpdateMode && (
          <Link to="/schoolchat/signup" className="text-xs sm:text-sm font-medium text-[#4F46E5] dark:text-indigo-300 hover:underline whitespace-nowrap">
            Changer de profil
          </Link>
        )}
      </div>

      <Stepper steps={roleConf.steps} current={currentStep} />

      <AnimatePresence>
        {alertMessage && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-6">
            <Alert type={alertType === "success" ? "success" : "error"}>{alertMessage}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleNextStep();
        }}
        noValidate
      >
        <AnimatePresence mode="wait">
          {/* Step 1 — personal information */}
          {currentStep === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25 }}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Informations personnelles</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Commencez par vos informations de base.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <TextField label="Prénom" required name="prenom" icon={faUser} value={formData.prenom} onChange={handleInputChange} placeholder="Ex. Awa" error={errors.prenom} autoComplete="given-name" />
                <TextField label="Nom" required name="nom" icon={faUser} value={formData.nom} onChange={handleInputChange} placeholder="Ex. Ndongo" error={errors.nom} autoComplete="family-name" />
                <div>
                  <TextField
                    label="Adresse e-mail"
                    required
                    type="email"
                    name="email"
                    icon={faEnvelope}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="exemple@email.com"
                    error={errors.email}
                    autoComplete="email"
                    disabled={isUpdateMode}
                    hint={!isProfessor ? "Elle sera votre identifiant de connexion." : undefined}
                  />
                  {emailIssue && emailIssue !== "pending" && errors.email && (
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
                      {(emailIssue === "exists" || emailIssue === "other") && (
                        <>
                          <Link
                            to="/schoolchat/login"
                            state={{ email: formData.email.trim() }}
                            className="text-[#4F46E5] dark:text-indigo-300 hover:underline"
                          >
                            Se connecter
                          </Link>
                          <Link
                            to={`/schoolchat/forgot-password?email=${encodeURIComponent(formData.email.trim())}`}
                            className="text-[#4F46E5] dark:text-indigo-300 hover:underline"
                          >
                            Mot de passe oublié ?
                          </Link>
                        </>
                      )}
                      {emailIssue === "inactive" && (
                        <Link
                          to={`/schoolchat/verifier-compte?email=${encodeURIComponent(formData.email.trim())}`}
                          className="text-[#4F46E5] dark:text-indigo-300 hover:underline"
                        >
                          Vérifier mon compte ?
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Téléphone <span className="text-[#EF4444]">*</span>
                  </label>
                  <PhoneInput
                    international
                    defaultCountry={selectedCountry}
                    countrySelectComponent={CountrySelectSearchable}
                    value={formData.telephone}
                    onChange={handlePhoneChange}
                    className={`sc-phone ${errors.telephone ? "sc-phone-error" : ""}`}
                  />
                  {typeof errors.telephone === "string" && <p className="mt-1 text-xs text-[#EF4444]">{errors.telephone}</p>}
                </div>
                <TextField
                  className="sm:col-span-2"
                  label="Adresse"
                  required
                  name="adresse"
                  icon={faLocationDot}
                  value={formData.adresse}
                  onChange={handleInputChange}
                  placeholder="Ville, quartier…"
                  error={errors.adresse}
                  autoComplete="street-address"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2 — professor: teacher details / documents */}
          {currentStep === 2 && isProfessor && (
            <motion.div key="step2-prof" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25 }}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Détails enseignant</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Ces pièces permettent à l'administration de vérifier votre profil de professeur.
              </p>
              <TextField
                label="Matricule professeur (optionnel)"
                name="matriculeProfesseur"
                icon={faIdCard}
                value={formData.matriculeProfesseur}
                onChange={handleInputChange}
                placeholder="Votre matricule"
                className="mb-5"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {DOCS.map((doc) => (
                  <div key={doc.name}>
                    <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {doc.label} {!isUpdateMode && <span className="text-[#EF4444]">*</span>}
                    </p>
                    {imagePreviews[doc.name] ? (
                      <div className="relative">
                        <img src={imagePreviews[doc.name]} alt={doc.label} className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-600" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(doc.name)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow"
                          aria-label={`Retirer ${doc.label}`}
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[#8C52FF] hover:bg-violet-50 dark:hover:bg-violet-500/10 ${
                          errors[doc.name] ? "border-[#EF4444]" : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        <FontAwesomeIcon icon={doc.icon} className="text-2xl text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">Cliquez pour ajouter une photo</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, doc.name)} className="hidden" />
                      </label>
                    )}
                    {typeof errors[doc.name] === "string" && <p className="mt-1 text-xs text-[#EF4444]">{errors[doc.name]}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2 — parent: children */}
          {currentStep === 2 && isParentRole && (
            <motion.div key="step2-children" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25 }}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Vos enfants</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Pour chaque enfant, renseignez son prénom, son nom et le code de sa classe, puis vérifiez le code.
              </p>
              {enfants.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-5">
                  <label htmlFor="childCount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Combien d'enfants ? <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      id="childCount"
                      value={childCountChoice}
                      onChange={(e) => setChildCountChoice(Number(e.target.value))}
                      className="sc-input block w-full sm:w-40 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-[#4F46E5]"
                    >
                      {Array.from({ length: MAX_CHILDREN }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n > 1 ? "enfants" : "enfant"}
                        </option>
                      ))}
                    </select>
                    <Button type="button" icon={faArrowRight} onClick={() => setChildCount(childCountChoice)}>
                      Continuer
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Vous pourrez en ajouter ou en retirer ensuite (10 au maximum).
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <label htmlFor="childCountEdit" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      Combien d'enfants ?
                      <select
                        id="childCountEdit"
                        value={enfants.length}
                        onChange={(e) => setChildCount(e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                      >
                        {Array.from({ length: MAX_CHILDREN }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {enfants.filter((c) => c.preview).length} / {enfants.length} code(s) vérifié(s)
                    </span>
                  </div>
                  <div className="space-y-4">
                    {enfants.map((c, i) => (
                      <ChildCodeCard
                        key={c.key}
                        index={i}
                        idPrefix="signup-enfant"
                        title={`Enfant ${i + 1}${c.prenom.trim() ? ` — ${c.prenom.trim()}` : ""}`}
                        value={c}
                        errors={c.errors}
                        resetKey={c.resetKey}
                        verifiedPreview={c.preview}
                        onChange={(field, value) => changeChild(c.key, field, value)}
                        onPreviewChange={(preview) => setChildPreview(c.key, preview)}
                        onRemove={enfants.length > 1 ? () => removeChild(c.key) : undefined}
                        disabled={isSubmitting}
                      />
                    ))}
                  </div>
                  {enfants.length < MAX_CHILDREN && (
                    <Button type="button" variant="ghost" className="mt-4 w-full border-2 border-dashed border-indigo-200 dark:border-indigo-500/30" onClick={addChild}>
                      <FontAwesomeIcon icon={faPlus} /> Ajouter un enfant
                    </Button>
                  )}
                  {!allChildrenVerified && (
                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                      <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 text-[#4F46E5]" />
                      Vérifiez le code de la classe de chaque enfant pour continuer.
                    </p>
                  )}
                </>
              )}
              <Alert type="info" className="mt-6">
                Votre compte parent sera créé immédiatement. Chaque demande d'inscription sera ensuite validée par le
                professeur de la classe de l'enfant.
              </Alert>
            </motion.div>
          )}

          {/* Step 2 — élève: class code */}
          {currentStep === 2 && role === "eleve" && (
            <motion.div key="step2-code" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25 }}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Classe / Code d'inscription</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Renseignez le code de votre classe.</p>
              <TextField
                label="Code de la classe"
                required
                name="codeClasse"
                icon={faKey}
                value={formData.codeClasse}
                onChange={handleInputChange}
                placeholder="Ex. 123456"
                error={
                  typeof errors.codeClasse === "string"
                    ? errors.codeClasse
                    : classPreview.status === "error"
                      ? classPreview.error || true
                      : errors.codeClasse
                }
                hint={classPreview.status === "idle" ? "Code fourni par votre professeur ou votre établissement" : undefined}
                autoComplete="off"
                autoCapitalize="characters"
                inputClassName={`tracking-wider font-semibold ${classPreview.isValid ? "!border-[#10B981]" : ""}`}
              />
              {classPreview.status === "loading" && <ClassPreviewStatus status="loading" />}
              {classPreview.isValid && <ClassPreviewCard preview={classPreview.preview} className="mt-4" />}
              <Alert type="info" className="mt-6">
                Votre demande sera envoyée au professeur de la classe : vous recevrez tout de suite un e-mail d'accusé de
                réception, puis, après son approbation, votre identifiant et un mot de passe temporaire.
                <span className="block mt-1">
                  Vous êtes mineur ? Demandez à votre parent de créer son compte : il vous inscrira comme enfant.
                </span>
              </Alert>
            </motion.div>
          )}

          {/* Step 3 — verification / confirmation */}
          {currentStep === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25 }}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isProfessor ? "Vérifiez votre demande" : "Confirmez votre inscription"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Vérifiez vos informations avant de continuer.</p>
              <dl className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 px-4">
                <SummaryRow label="Profil" value={roleConf.label} />
                <SummaryRow label="Nom" value={`${formData.prenom} ${formData.nom}`.trim()} />
                <SummaryRow label="E-mail" value={formData.email} />
                <SummaryRow label="Téléphone" value={formData.telephone} />
                <SummaryRow label="Adresse" value={formData.adresse} />
                {role === "eleve" && <SummaryRow label="Code de la classe" value={formData.codeClasse.trim()} />}
                {isProfessor && formData.matriculeProfesseur && <SummaryRow label="Matricule" value={formData.matriculeProfesseur} />}
              </dl>
              {role === "eleve" && classPreview.isValid && (
                <ClassPreviewCard preview={classPreview.preview} title="Vous rejoignez" className="mt-4" />
              )}
              {isParentRole && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    {enfants.length > 1 ? `Vos ${enfants.length} enfants` : "Votre enfant"}
                  </h3>
                  <ul className="space-y-3">
                    {enfants.map((c, i) => (
                      <li key={c.key}>
                        <ClassPreviewCard
                          compact
                          preview={c.preview}
                          title={`Enfant ${i + 1} — ${`${c.prenom.trim()} ${c.nom.trim()}`.trim()} rejoint`}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {isProfessor && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {DOCS.map((doc) => (
                    <div key={doc.name} className="text-center">
                      {imagePreviews[doc.name] ? (
                        <img src={imagePreviews[doc.name]} alt={doc.label} className="w-full h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
                      ) : (
                        <div className="w-full h-20 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                          <FontAwesomeIcon icon={doc.icon} />
                        </div>
                      )}
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{doc.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-5 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 text-[#4F46E5]" />
                {isProfessor
                  ? "Votre profil sera vérifié par l'administration. Un lien d'activation vous sera envoyé par e-mail."
                  : isParentRole
                    ? "Votre compte sera créé dès la confirmation : vous recevrez par e-mail votre identifiant et un mot de passe temporaire. Le professeur de chaque classe validera la demande de votre enfant."
                    : "Vous recevrez un e-mail d'accusé de réception. Le professeur de la classe doit approuver votre demande avant votre première connexion."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
          {(currentStep > 1 || !isUpdateMode) && (
            <Button type="button" variant="subtle" onClick={handlePrevStep} disabled={isSubmitting}>
              <FontAwesomeIcon icon={faArrowLeft} /> {currentStep > 1 ? "Précédent" : "Retour"}
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={
              currentStep === 2 &&
              ((role === "eleve" && !formData.codeClasse.trim()) || (isParentRole && !allChildrenVerified))
            }
            loading={isSubmitting || (verifyingCode && classPreview.status === "loading")}
            loadingLabel={verifyingCode ? "Vérification…" : "Traitement…"}
            icon={isLastStep ? faPaperPlane : verifyingCode ? faMagnifyingGlass : faArrowRight}
          >
            {nextLabel}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Déjà un compte ?{" "}
        <Link to="/schoolchat/login" className="font-semibold text-[#4F46E5] dark:text-indigo-300 hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
};

export default SignUp;
