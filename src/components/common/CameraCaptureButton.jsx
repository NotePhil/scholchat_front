import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faVideo } from "@fortawesome/free-solid-svg-icons";

/** Phones / tablets (touch, coarse pointer): where `capture` opens the camera directly. */
export const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    (navigator && navigator.maxTouchPoints > 0) ||
    !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
  );
};

/**
 * Camera photos are often several MB: re-encode large ones (max 2560 px, JPEG 0.85) so they fit
 * the 5 MB image limit. Returns the original file when it is small, not an image, or on failure.
 */
export const downscaleImageFile = (file, maxBytes = 4 * 1024 * 1024, maxDim = 2560) =>
  new Promise((resolve) => {
    if (!file || !file.type?.startsWith("image/") || file.size <= maxBytes) {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) return resolve(file);
            const name = (file.name || `photo_${Date.now()}`).replace(/\.\w+$/, "") + ".jpg";
            resolve(new File([blob], name, { type: "image/jpeg", lastModified: Date.now() }));
          },
          "image/jpeg",
          0.85,
        );
      } catch (e) {
        URL.revokeObjectURL(url);
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

/**
 * "Prendre une photo" / "Filmer une vidéo" on mobile browsers: a hidden
 * <input type="file" capture="environment"> that opens the camera. Renders nothing on desktop
 * unless `always` is set. `onFiles(files)` receives an array of File (large photos downscaled).
 */
const CameraCaptureButton = ({
  kind = "photo",
  onFiles,
  disabled = false,
  className = "",
  label,
  title,
  always = false,
  iconClassName = "w-4 h-4",
}) => {
  const inputRef = useRef(null);
  if (!always && !isTouchDevice()) return null;
  const isVideo = kind === "video";
  const text = label !== undefined ? label : isVideo ? "Filmer une vidéo" : "Prendre une photo";
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={isVideo ? "video/*" : "image/*"}
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const picked = Array.from(e.target.files || []);
          e.target.value = "";
          if (!picked.length) return;
          const files = await Promise.all(picked.map((f) => (isVideo ? f : downscaleImageFile(f))));
          onFiles(files);
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        className={className}
        title={title || text}
        aria-label={title || text || (isVideo ? "Filmer une vidéo" : "Prendre une photo")}
      >
        <FontAwesomeIcon icon={isVideo ? faVideo : faCamera} className={iconClassName} />
        {text ? <span>{text}</span> : null}
      </button>
    </>
  );
};

export default CameraCaptureButton;
