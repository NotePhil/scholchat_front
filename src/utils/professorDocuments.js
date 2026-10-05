// Professor identity documents (CNI recto / verso + selfie): upload + profile update.
// Same flow as SignUp.jsx / AddRoleModal: presigned upload (documentType cni-recto /
// cni-verso / selfie, falling back to the backend proxy when storage CORS blocks the
// direct PUT), then PATCH /utilisateurs/{id} with the stored key(s).

const API = process.env.REACT_APP_API_BASE_URL;

export const PROFESSOR_DOCS = [
  { field: "cniUrlRecto", docType: "cni-recto", label: "CNI - Recto" },
  { field: "cniUrlVerso", docType: "cni-verso", label: "CNI - Verso" },
  { field: "selfieUrl", docType: "selfie", label: "Photo de profil" },
];

export const authHeaders = () => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const readError = async (resp, fallback) => {
  const data = await resp.json().catch(() => ({}));
  return new Error(data.message || fallback);
};

/** Uploads one document image; resolves the stored URL (without the presigned query). */
export const uploadProfessorDocument = async (file, userId, docType) => {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const fileName = `${docType}_${Date.now()}.${ext}`;
  const presignedResp = await fetch(`${API}/media/presigned-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      fileName,
      contentType: file.type,
      mediaType: "IMAGE",
      ownerId: userId,
      documentType: docType,
    }),
  });
  if (!presignedResp.ok)
    throw await readError(presignedResp, "Échec du téléversement du document.");
  const { url } = await presignedResp.json();
  try {
    const put = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!put.ok) throw new Error(`PUT ${put.status}`);
  } catch (directError) {
    // Storage CORS → backend proxy upload (same fallback as SignUp.jsx)
    const form = new FormData();
    form.append("file", file, fileName);
    form.append("presignedUrl", url);
    form.append("contentType", file.type);
    const proxy = await fetch(`${API}/media/proxy-upload`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (!proxy.ok)
      throw await readError(proxy, "Échec du téléversement du document.");
  }
  return url.split("?")[0];
};

/**
 * PATCH /utilisateurs/{id} with professor document fields. Replacing a document of a
 * validated professor puts the profile back under review (statutVerification
 * EN_ATTENTE_VALIDATION) server-side. Resolves the updated user.
 */
export const patchProfessorDocuments = async (userId, fields) => {
  const resp = await fetch(`${API}/utilisateurs/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ type: "professeur", ...fields }),
  });
  if (!resp.ok)
    throw await readError(resp, "Erreur lors du traitement des documents");
  return resp.json().catch(() => ({}));
};

// Used by ProfessorVerificationStatus.jsx (document submission while the profile is
// missing documents or was rejected).
export const PROFESSOR_DOCUMENTS = PROFESSOR_DOCS;

/**
 * Uploads the selected files ({ [field]: File }) and saves them in a single PATCH.
 * Options: `docs` limits the upload to these document entries (default: all with a
 * file); any other key (e.g. matriculeProfesseur) is saved with the documents.
 */
export const submitProfessorDocuments = async (userId, files, options = {}) => {
  const { docs = PROFESSOR_DOCS, ...extraFields } = options;
  const fields = { ...extraFields };
  for (const doc of docs) {
    const file = files[doc.field];
    if (file) fields[doc.field] = await uploadProfessorDocument(file, userId, doc.docType);
  }
  return patchProfessorDocuments(userId, fields);
};
