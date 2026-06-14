import { useEffect, useState } from "react";

import PreviewableImage from "./PreviewableImage";

import { fetchFileBlob } from "../services/fileService";

const MessageAttachment = ({ message }) => {
  const isLocalPreview = Boolean(
    message.localPreviewUrl
  );
  const fileId = message.attachment?.fileId;

  const [fetchedUrl, setFetchedUrl] =
    useState(null);
  const [loading, setLoading] = useState(
    !isLocalPreview && Boolean(fileId)
  );
  const [error, setError] = useState(false);

  const objectUrl =
    message.localPreviewUrl || fetchedUrl;

  const messageType =
    message.messageType || "document";
  const fileName =
    message.attachment?.fileName || "File";
  const caption = message.content?.trim();

  useEffect(() => {
    if (isLocalPreview || !fileId) {
      return;
    }

    let cancelled = false;
    let createdUrl = null;

    const loadFile = async () => {
      try {
        const blob = await fetchFileBlob(fileId);

        if (cancelled) {
          return;
        }

        createdUrl = URL.createObjectURL(blob);
        setFetchedUrl(createdUrl);
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFile();

    return () => {
      cancelled = true;

      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fileId, isLocalPreview]);

  if (loading) {
    return (
      <div className="message-attachment-loading">
        Loading attachment...
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className="message-attachment-error">
        {fileName}
      </div>
    );
  }

  return (
    <div className="message-attachment">
      {messageType === "image" && (
        <PreviewableImage
          src={objectUrl}
          alt={fileName}
          className="message-image"
        />
      )}

      {messageType === "video" && (
        <video
          src={objectUrl}
          controls
          className="message-video"
        />
      )}

      {messageType === "document" && (
        <a
          href={objectUrl}
          download={fileName}
          className="message-document"
        >
          📎 {fileName}
        </a>
      )}

      {caption && (
        <div className="message-caption">
          {caption}
        </div>
      )}
    </div>
  );
};

export default MessageAttachment;
