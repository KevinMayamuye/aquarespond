import { getReplyPreviewText } from "../utils/messagePreview";

const MessageReplyPreview = ({
  replyTo,
  variant = "bubble",
  onCancel,
}) => {
  if (!replyTo) {
    return null;
  }

  const preview = getReplyPreviewText(replyTo);

  if (variant === "composer") {
    return (
      <div className="composer-reply-bar">
        <div className="composer-reply-content">
          <span className="composer-reply-label">
            Replying to {replyTo.senderUsername}
          </span>
          <span className="composer-reply-text">
            {preview}
          </span>
        </div>

        {onCancel && (
          <button
            type="button"
            className="composer-reply-cancel"
            onClick={onCancel}
            aria-label="Cancel reply"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="message-reply-preview">
      <span className="message-reply-name">
        {replyTo.senderUsername}
      </span>
      <span className="message-reply-text">
        {preview}
      </span>
    </div>
  );
};

export default MessageReplyPreview;
