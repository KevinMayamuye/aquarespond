import { useEffect, useState } from "react";

import "../styles/image-preview.css";

const PreviewableImage = ({
  src,
  alt = "Image",
  className = "",
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  const handleThumbnailKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        title="Click to preview"
        className={`previewable-image ${className}`.trim()}
        onClick={() => setOpen(true)}
        onKeyDown={handleThumbnailKeyDown}
        role="button"
        tabIndex={0}
      />

      {open && (
        <div
          className="image-preview-overlay"
          onClick={() => setOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            className="image-preview-close"
            onClick={() => setOpen(false)}
            aria-label="Close preview"
          >
            ×
          </button>

          <img
            src={src}
            alt={alt}
            className="image-preview-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default PreviewableImage;
