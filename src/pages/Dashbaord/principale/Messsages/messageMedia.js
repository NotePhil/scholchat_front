import { useCallback, useEffect, useRef, useState } from "react";
import { messageService } from "../../../../services/MessageService";

export const MAX_ATTACHMENTS = 10;

export const ACCEPTED_ATTACHMENTS =
  "image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.odt,.ods,.odp,.zip";

export const mediaTypeOf = (contentType = "") => {
  const ct = String(contentType).toLowerCase();
  if (ct.startsWith("image/")) return "IMAGE";
  if (ct.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
};

/** mediaType from a MessageDto media item (falls back to its contentType). */
export const mediaKind = (media) =>
  (media?.mediaType || mediaTypeOf(media?.contentType)).toUpperCase();

export const formatFileSize = (bytes) => {
  const n = Number(bytes);
  if (!n || Number.isNaN(n)) return "";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} Go`;
};

/** List preview for a message without text: "Photo" / "Vidéo" / "Document". */
export const attachmentPreview = (medias) => {
  if (!Array.isArray(medias) || medias.length === 0) return null;
  const kind = mediaKind(medias[0]);
  const label =
    kind === "IMAGE" ? "Photo" : kind === "VIDEO" ? "Vidéo" : "Document";
  return {
    kind,
    label: medias.length > 1 ? `${label} (+${medias.length - 1})` : label,
  };
};

const uniqueFileName = (name) => {
  const safe = String(name || "fichier").replace(/[\\/]/g, "_");
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}_${rand}_${safe}`;
};

/** Contract upload flow: presigned-url (unique name) -> PUT (proxy fallback). */
export const uploadMessageAttachment = async (file, onProgress) => {
  const ownerId = localStorage.getItem("userId");
  const contentType = file.type || "application/octet-stream";
  const mediaType = mediaTypeOf(contentType);
  const presign = await messageService.requestMediaUpload({
    fileName: uniqueFileName(file.name),
    contentType,
    mediaType,
    ownerId,
  });
  if (!presign?.url) throw new Error("URL de téléversement manquante.");
  await messageService.uploadToPresignedUrl(
    presign.url,
    file,
    contentType,
    onProgress,
  );
  return {
    fileName: file.name,
    // filePath is the storage key; the server also accepts the upload URL.
    filePath: presign.filePath || String(presign.url).split("?")[0],
    contentType,
    fileSize: file.size,
  };
};

let keySeq = 0;

/**
 * Attachments being composed: files upload as soon as they are picked so the
 * send button can be disabled while uploading.
 */
export const useMessageAttachments = () => {
  const [items, setItems] = useState([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const patch = (key, changes) =>
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...changes } : it)),
    );

  const startUpload = useCallback((item) => {
    patch(item.key, { status: "uploading", progress: 0, error: null });
    uploadMessageAttachment(item.file, (progress) =>
      patch(item.key, { progress }),
    )
      .then((uploaded) =>
        patch(item.key, { status: "done", progress: 100, uploaded }),
      )
      .catch((err) =>
        patch(item.key, {
          status: "error",
          error: err?.message || "Échec du téléversement",
        }),
      );
  }, []);

  const addFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      const room = MAX_ATTACHMENTS - itemsRef.current.length;
      const accepted = files.slice(0, Math.max(0, room));
      const created = accepted.map((file) => ({
        key: `att-${Date.now()}-${keySeq++}`,
        file,
        kind: mediaTypeOf(file.type),
        previewUrl: file.type?.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        status: "pending",
        progress: 0,
        uploaded: null,
        error: null,
      }));
      setItems((prev) => [...prev, ...created]);
      created.forEach(startUpload);
      return files.length - accepted.length; // number rejected (over the limit)
    },
    [startUpload],
  );

  const removeItem = useCallback((key) => {
    setItems((prev) => {
      const it = prev.find((x) => x.key === key);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((x) => x.key !== key);
    });
  }, []);

  const retryItem = useCallback(
    (key) => {
      const it = itemsRef.current.find((x) => x.key === key);
      if (it) startUpload(it);
    },
    [startUpload],
  );

  const clear = useCallback(() => {
    itemsRef.current.forEach(
      (it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl),
    );
    setItems([]);
  }, []);

  useEffect(
    () => () =>
      itemsRef.current.forEach(
        (it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl),
      ),
    [],
  );

  const uploading = items.some(
    (it) => it.status === "uploading" || it.status === "pending",
  );
  const hasErrors = items.some((it) => it.status === "error");
  const medias = items
    .filter((it) => it.status === "done" && it.uploaded)
    .map((it) => it.uploaded);

  return {
    items,
    addFiles,
    removeItem,
    retryItem,
    clear,
    uploading,
    hasErrors,
    medias,
  };
};
