import React, { useEffect, useState } from "react";
import { Input, InputNumber, Select, Button, Typography, message } from "antd";
import {
  QUESTION_TYPES,
  TYPES_WITH_CHOICES,
  TYPES_OPEN,
  getDefaultChoix,
  emptyQuestion,
  validateQuestion,
  buildQuestionPayload,
  QUESTION_MEDIA_ACCEPT,
  QUESTION_MEDIA_LIMITS,
  validateQuestionMediaFile,
} from "./constants";
import { minioS3Service } from "../../../../../../services/minioS3";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faFilePdf,
  faFloppyDisk,
  faPaperclip,
  faPlus,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

// ── Answer inputs section ─────────────────────────────────────────────────────
const AnswerBuilder = ({ question, onChange }) => {
  const type = question.typeQuestion;
  const choix = question.choixReponses || [];
  const setChoix = (updated) =>
    onChange({
      ...question,
      choixReponses: updated.map((c, i) => ({
        ...c,
        ordreAffichage: i + 1,
      })),
    });
  const updateChoix = (index, field, value) => {
    const updated = [...choix];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange({
      ...question,
      choixReponses: updated,
    });
  };
  const moveChoix = (index, dir) => {
    const updated = [...choix];
    const target = index + dir;
    if (target < 0 || target >= updated.length) return;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setChoix(updated);
  };
  const addChoix = () => {
    const allCorrect = type === "ASSOCIATION" || type === "CLASSEMENT";
    setChoix([
      ...choix,
      {
        texte: "",
        estCorrect: allCorrect,
        ordreAffichage: choix.length + 1,
      },
    ]);
  };
  const removeChoix = (index) => setChoix(choix.filter((_, i) => i !== index));
  if (type === "VRAI_FAUX") {
    return (
      <div>
        <Text className="text-xs text-gray-500 block mb-2">
          Cliquez sur la bonne réponse
        </Text>
        <div className="flex gap-3">
          {choix.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                onChange({
                  ...question,
                  choixReponses: choix.map((x, j) => ({
                    ...x,
                    estCorrect: j === i,
                  })),
                })
              }
              className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all
                ${c.estCorrect ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}
            >
              {c.texte}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (TYPES_WITH_CHOICES.includes(type)) {
    const placeholder =
      {
        QCM: (i) => `Option ${i + 1}`,
        ASSOCIATION: () => "Ex: France → Paris",
        CLASSEMENT: (i) => `Élément ${i + 1}`,
        TROU: () => "Mot à compléter",
      }[type] || ((i) => `Choix ${i + 1}`);
    return (
      <div>
        <Text className="text-xs text-gray-500 block mb-2">
          {type === "QCM"
            ? "Cochez la/les bonne(s) réponse(s)"
            : type === "ASSOCIATION"
              ? "Saisissez les paires à associer"
              : type === "TROU"
                ? "Mots/expressions à compléter"
                : "Éléments dans l'ordre correct"}
        </Text>
        <div className="space-y-2">
          {choix.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveChoix(i, -1)}
                  disabled={i === 0}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <FontAwesomeIcon
                    icon={faArrowUp}
                    style={{
                      fontSize: 10,
                    }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => moveChoix(i, 1)}
                  disabled={i === choix.length - 1}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <FontAwesomeIcon
                    icon={faArrowDown}
                    style={{
                      fontSize: 10,
                    }}
                  />
                </button>
              </div>
              {type === "QCM" && (
                <input
                  type="checkbox"
                  checked={c.estCorrect}
                  onChange={(e) =>
                    updateChoix(i, "estCorrect", e.target.checked)
                  }
                  className="w-4 h-4 accent-indigo-600 cursor-pointer flex-shrink-0"
                />
              )}
              {(type === "CLASSEMENT" || type === "TROU") && (
                <span className="text-xs font-bold text-gray-400 w-5 text-center flex-shrink-0">
                  {i + 1}
                </span>
              )}
              <Input
                value={c.texte}
                onChange={(e) => updateChoix(i, "texte", e.target.value)}
                placeholder={placeholder(i)}
                style={{
                  flex: 1,
                  borderRadius: 8,
                }}
              />
              {choix.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoix(i)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <FontAwesomeIcon
                    icon={faTrash}
                    style={{
                      fontSize: 13,
                    }}
                  />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addChoix}
          className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 hover:border-indigo-500 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} /> Ajouter un choix
        </button>
      </div>
    );
  }
  if (TYPES_OPEN.includes(type)) {
    return (
      <div>
        <Text className="text-xs text-gray-500 block mb-2">
          Réponse modèle (pour la correction)
        </Text>
        {type === "REPONSE_COURTE" ? (
          <Input
            value={question.reponse}
            onChange={(e) =>
              onChange({
                ...question,
                reponse: e.target.value,
              })
            }
            placeholder="Ex: H₂O"
            style={{
              borderRadius: 8,
            }}
          />
        ) : (
          <TextArea
            rows={3}
            value={question.reponse}
            onChange={(e) =>
              onChange({
                ...question,
                reponse: e.target.value,
              })
            }
            placeholder="Décrivez la réponse attendue..."
            style={{
              borderRadius: 8,
              resize: "none",
            }}
          />
        )}
      </div>
    );
  }
  return null;
};

// ── Media attachments (image / PDF) ───────────────────────────────────────────
// Uploads straight to S3 via the presigned-URL flow (same path as event media),
// then stores the resulting {fileName, filePath, contentType, fileSize, mediaType,
// bucketName} object directly — the backend embeds a presigned download URL in
// every question response, so no extra round trip is needed to display it.
// Same dropzone + thumbnail-grid pattern as the event creation form, so pickers
// look and behave consistently across the app; supports adding several files.
const formatSize = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
};

// `onAppend(media)` adds one uploaded media to the CURRENT question (functional
// update, so an upload finishing later never overwrites edits made meanwhile);
// `onRemove(index)` removes one; `onPendingChange(count)` reports how many files
// are still being sent so the parent can block saving until they are done.
const QuestionMediaAttachments = ({ medias, onAppend, onRemove, onPendingChange }) => {
  // Files being sent: [{key, name, size, loaded}] — progress shown per file.
  const [uploads, setUploads] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = React.useRef(null);
  const list = medias || [];
  const uploading = uploads.length > 0;
  useEffect(() => {
    onPendingChange?.(uploads.length);
  }, [uploads.length, onPendingChange]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file(s)
    if (files.length === 0) return;
    const errs = [];
    const valid = files.filter((f) => {
      const err = validateQuestionMediaFile(f);
      if (err) errs.push(err);
      return !err;
    });
    setErrors(errs);
    if (valid.length === 0) return;
    const items = valid.map((file, i) => ({ key: `${Date.now()}_${i}`, file, name: file.name, size: file.size, loaded: 0 }));
    setUploads((prev) => [...prev, ...items]);
    for (const item of items) {
      const { file } = item;
      const isImage = file.type.startsWith("image/");
      try {
        const result = await minioS3Service.uploadFile(
          file,
          isImage ? "IMAGE" : "DOCUMENT",
          "question_attachments",
          null,
          null,
          (bytes) =>
            setUploads((prev) => prev.map((u) => (u.key === item.key ? { ...u, loaded: bytes } : u))),
        );
        onAppend({ ...result, previewUrl: isImage ? URL.createObjectURL(file) : null });
      } catch (err) {
        setErrors((prev) => [...prev, `« ${file.name} » : ${err.message || "échec de l'envoi"}`]);
        message.error(`${file.name}: ${err.message || "échec de l'envoi"}`);
      } finally {
        setUploads((prev) => prev.filter((u) => u.key !== item.key));
      }
    }
  };
  const removeMedia = (index) => onRemove(index);
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">
        Pièces jointes (images ou PDF)
      </label>

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
        className="rounded-xl border-2 border-dashed p-4 text-center transition-all border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer"
      >
        <div className="flex flex-col items-center gap-1.5">
          <FontAwesomeIcon
            icon={uploading ? faSpinner : faPaperclip}
            spin={uploading}
            style={{
              fontSize: 20,
            }}
            className="text-indigo-500"
          />
          <span className="text-xs font-medium text-gray-600">
            {uploading
              ? "Envoi en cours… (vous pouvez en ajouter d'autres)"
              : "Cliquez pour joindre une image ou un PDF"}
          </span>
          <span className="text-[10px] text-gray-400">
            Plusieurs fichiers possibles · images ≤ {QUESTION_MEDIA_LIMITS.image.label}, PDF ≤ {QUESTION_MEDIA_LIMITS.pdf.label}
          </span>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={QUESTION_MEDIA_ACCEPT}
        onChange={handleFiles}
        style={{
          display: "none",
        }}
      />

      {errors.length > 0 && (
        <ul className="mt-2 space-y-1" role="alert">
          {errors.map((m, i) => (
            <li key={i} className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
              {m}
            </li>
          ))}
        </ul>
      )}

      {uploads.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {uploads.map((u) => {
            const pct = u.size ? Math.min(100, Math.round((u.loaded / u.size) * 100)) : 0;
            return (
              <div key={u.key} className="text-xs">
                <div className="flex justify-between gap-2 text-gray-600">
                  <span className="truncate">{u.name}</span>
                  <span className="flex-shrink-0">{pct}%</span>
                </div>
                <div
                  className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-0.5"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-label={`Envoi de ${u.name}`}
                >
                  <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
          {list.map((m, i) => {
            const isImage =
              m.mediaType === "IMAGE" ||
              (m.contentType || "").startsWith("image/");
            const src = m.previewUrl || m.presignedUrl;
            const size = formatSize(m.fileSize);
            return (
              <div key={i} className="relative group aspect-square" title={`${m.fileName || ""}${size ? ` · ${size}` : ""}`}>
                {isImage && src ? (
                  <img
                    src={src}
                    alt={m.fileName || ""}
                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                    <FontAwesomeIcon
                      icon={faFilePdf}
                      className="text-red-500"
                      style={{
                        fontSize: 18,
                      }}
                    />
                    <span className="text-[9px] text-gray-500 text-center leading-tight line-clamp-2 break-all">
                      {m.fileName}
                    </span>
                    {size && <span className="text-[9px] text-gray-400">{size}</span>}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  aria-label={`Retirer ${m.fileName || "ce fichier"}`}
                  title="Retirer ce fichier"
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform"
                >
                  <FontAwesomeIcon
                    icon={faTrash}
                    style={{
                      fontSize: 9,
                    }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Full question builder panel ───────────────────────────────────────────────
const QuestionBuilder = ({
  questions,
  currentQuestion,
  editingIndex,
  onChange,
  onAdd,
  onEdit,
  onRemove,
  onCancelEdit,
  onUploadingChange,
}) => {
  // Number of attachments of the current question still being uploaded.
  // While > 0 the question can't be added/updated (nor switched), otherwise
  // the attachment would be lost or land on another question.
  const [pendingUploads, setPendingUploads] = useState(0);
  const handlePendingChange = React.useCallback(
    (n) => {
      setPendingUploads(n);
      onUploadingChange?.(n > 0);
    },
    [onUploadingChange],
  );
  const uploadsPending = pendingUploads > 0;
  const PENDING_LABEL = "Envoi des fichiers en cours…";
  const guardPending = (fn) => (...args) => {
    if (uploadsPending) {
      message.warning(PENDING_LABEL);
      return;
    }
    fn?.(...args);
  };
  const typeInfo = QUESTION_TYPES.find(
    (t) => t.value === currentQuestion.typeQuestion,
  );
  const handleTypeChange = (value) =>
    onChange({
      ...currentQuestion,
      typeQuestion: value,
      choixReponses: getDefaultChoix(value),
      reponse: "",
    });
  return (
    <div>
      {/* Questions list */}
      {questions.length > 0 && (
        <div
          className="mb-4 rounded-xl border overflow-hidden"
          style={{
            borderColor: "#ede9fe",
            background: "#faf9ff",
          }}
        >
          <div
            className="px-3 py-2 border-b text-xs font-semibold text-purple-700 uppercase tracking-wide"
            style={{
              borderColor: "#ede9fe",
              background: "#f5f3ff",
            }}
          >
            {questions.length} question{questions.length > 1 ? "s" : ""} ajoutée
            {questions.length > 1 ? "s" : ""}
          </div>
          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {questions.map((q, i) => {
              const t = QUESTION_TYPES.find((x) => x.value === q.typeQuestion);
              const isEditing = editingIndex === i;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all
                    ${isEditing ? "bg-indigo-50" : "hover:bg-gray-50"}
                    ${i < questions.length - 1 ? "border-b border-gray-100" : ""}`}
                  onClick={guardPending(() => onEdit(i))}
                >
                  <div
                    className="flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                    style={{
                      width: 24,
                      height: 24,
                      background: isEditing ? "#6d28d9" : "#e5e7eb",
                      color: isEditing ? "#fff" : "#6b7280",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {q.intitule || (
                        <span className="text-gray-400 italic">
                          Sans intitulé
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      {t?.icon} {t?.label} · {q.points} pt
                      {q.points > 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      guardPending(onRemove)(i);
                    }}
                    className="p-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <FontAwesomeIcon
                      icon={faTrash}
                      style={{
                        fontSize: 12,
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Builder */}
      <div
        className="rounded-xl border border-dashed p-4"
        style={{
          borderColor: "#c4b5fd",
          background: "#faf9ff",
        }}
      >
        <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">
          {editingIndex !== null
            ? `Modifier la question ${editingIndex + 1}`
            : "Nouvelle question"}
        </div>

        {/* Type + Points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Type de question
            </label>
            <Select
              value={currentQuestion.typeQuestion}
              onChange={handleTypeChange}
              style={{
                width: "100%",
              }}
            >
              {QUESTION_TYPES.map((t) => (
                <Option key={t.value} value={t.value}>
                  <span className="flex items-center gap-2">
                    {t.icon} {t.label}
                    <span className="text-gray-400 text-xs">— {t.desc}</span>
                  </span>
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Points
            </label>
            <InputNumber
              min={0.5}
              max={100}
              step={0.5}
              value={currentQuestion.points}
              onChange={(v) =>
                onChange({
                  ...currentQuestion,
                  points: v,
                })
              }
              style={{
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* Intitulé */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Intitulé de la question
          </label>
          <TextArea
            rows={2}
            value={currentQuestion.intitule}
            onChange={(e) =>
              onChange({
                ...currentQuestion,
                intitule: e.target.value,
              })
            }
            placeholder="Posez votre question ici…"
            style={{
              borderRadius: 8,
              resize: "none",
            }}
          />
        </div>

        {/* Answer builder */}
        <div className="mb-4">
          <AnswerBuilder question={currentQuestion} onChange={onChange} />
        </div>

        {/* Media attachment */}
        <div className="mb-4">
          <QuestionMediaAttachments
            // New instance per question: upload errors of a question already
            // added don't linger on the next one.
            key={editingIndex !== null ? `edit-${editingIndex}` : `new-${questions.length}`}
            medias={currentQuestion.medias}
            onAppend={(media) =>
              onChange((q) => ({
                ...q,
                medias: [...(q.medias || []), media],
              }))
            }
            onRemove={(index) =>
              onChange((q) => ({
                ...q,
                medias: (q.medias || []).filter((_, i) => i !== index),
              }))
            }
            onPendingChange={handlePendingChange}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {editingIndex !== null && (
            <Button
              onClick={guardPending(onCancelEdit)}
              disabled={uploadsPending}
              style={{
                borderRadius: 8,
              }}
            >
              Annuler
            </Button>
          )}
          <Button
            type="primary"
            data-testid="question-add-btn"
            disabled={uploadsPending}
            icon={
              uploadsPending ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : editingIndex !== null ? (
                <FontAwesomeIcon icon={faFloppyDisk} />
              ) : (
                <FontAwesomeIcon icon={faPlus} />
              )
            }
            onClick={guardPending(onAdd)}
            style={{
              borderRadius: 8,
              background: "#6d28d9",
              borderColor: "#6d28d9",
              ...(uploadsPending && { opacity: 0.6, color: "#fff" }),
            }}
          >
            {uploadsPending
              ? PENDING_LABEL
              : editingIndex !== null
                ? "Mettre à jour"
                : "Ajouter la question"}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default QuestionBuilder;
export { AnswerBuilder };
