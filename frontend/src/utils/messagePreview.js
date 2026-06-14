export const getReplyPreviewText = (replyTo) => {
  if (!replyTo) {
    return "";
  }

  const type = replyTo.messageType || "text";

  if (type === "image") {
    return "Photo";
  }

  if (type === "video") {
    return "Video";
  }

  if (type === "document") {
    return replyTo.content || "Document";
  }

  return replyTo.content || "";
};

export const getMessagePreviewText = (message) => {
  if (!message) {
    return "";
  }

  const type = message.messageType || "text";
  let preview;

  if (type === "image") {
    preview = "Photo";
  } else if (type === "video") {
    preview = "Video";
  } else if (type === "document") {
    const name =
      message.attachment?.fileName || "Document";

    preview = `📎 ${name}`;
  } else {
    preview = (message.content || "").replace(
      /\n+/g,
      " "
    );
  }

  if (message.replyTo) {
    preview = `Re: ${preview}`;
  }

  if (message.editedAt) {
    preview = `${preview} (edited)`;
  }

  return preview;
};

export const getMessageTypeFromFile = (file) => {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return "document";
};

export const EDIT_WINDOW_MS = 15 * 60 * 1000;

export const canEditMessage = (message) => {
  if (!message?.createdAt) {
    return false;
  }

  if (
    message.messageType &&
    message.messageType !== "text"
  ) {
    return false;
  }

  const ageMs =
    Date.now() -
    new Date(message.createdAt).getTime();

  return ageMs <= EDIT_WINDOW_MS;
};

export const REACTION_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🙏",
];
