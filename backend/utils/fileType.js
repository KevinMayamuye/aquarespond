const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export const IMAGE_MAX_SIZE = 10 * 1024 * 1024;
export const VIDEO_MAX_SIZE = 25 * 1024 * 1024;
export const DOCUMENT_MAX_SIZE = 25 * 1024 * 1024;

export const getMessageTypeFromMime = (mimeType) => {
  if (IMAGE_TYPES.has(mimeType)) {
    return "image";
  }

  if (VIDEO_TYPES.has(mimeType)) {
    return "video";
  }

  if (DOCUMENT_TYPES.has(mimeType)) {
    return "document";
  }

  return null;
};

export const getMaxSizeForMime = (mimeType) => {
  const messageType = getMessageTypeFromMime(mimeType);

  if (messageType === "image") {
    return IMAGE_MAX_SIZE;
  }

  if (messageType === "video") {
    return VIDEO_MAX_SIZE;
  }

  if (messageType === "document") {
    return DOCUMENT_MAX_SIZE;
  }

  return null;
};

export const isAllowedMimeType = (mimeType) =>
  getMessageTypeFromMime(mimeType) !== null;