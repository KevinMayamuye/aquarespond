import { useEffect, useRef, useState } from "react";

import {
  deleteMessage,
  toggleReaction,
} from "../services/messageService";
import {
  REACTION_EMOJIS,
  canEditMessage,
} from "../utils/messagePreview";

const MessageActions = ({
  message,
  currentUserId,
  isSent,
  onReply,
  onEdit,
  onDelete,
  onReactionUpdate,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] =
    useState(false);
  const menuRef = useRef(null);

  const isOwnMessage =
    (message.sender?._id ?? message.sender)
      ?.toString() ===
    currentUserId?.toString();

  const canEdit =
    isOwnMessage &&
    message.messageType === "text" &&
    canEditMessage(message);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };

    if (showMenu || showReactions) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [showMenu, showReactions]);

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Delete this message?"
      )
    ) {
      return;
    }

    try {
      const result = await deleteMessage(
        message._id
      );

      onDelete(result);
      setShowMenu(false);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not delete message"
      );
    }
  };

  const handleReaction = async (emoji) => {
    try {
      const updated = await toggleReaction(
        message._id,
        emoji
      );

      onReactionUpdate(updated);
      setShowReactions(false);
      setShowMenu(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className={`message-actions-wrap ${
        isSent ? "sent" : "received"
      }`}
      ref={menuRef}
    >
      <button
        type="button"
        className="message-actions-btn"
        onClick={() => {
          setShowMenu((prev) => !prev);
          setShowReactions(false);
        }}
        aria-label="Message actions"
      >
        ⋮
      </button>

      {showMenu && (
        <div className="message-actions-menu">
          <button
            type="button"
            onClick={() => {
              onReply(message);
              setShowMenu(false);
            }}
          >
            Reply
          </button>

          <button
            type="button"
            onClick={() => {
              setShowReactions(true);
              setShowMenu(false);
            }}
          >
            React
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit(message);
                setShowMenu(false);
              }}
            >
              Edit
            </button>
          )}

          {isOwnMessage && (
            <button
              type="button"
              className="danger"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>
      )}

      {showReactions && (
        <div className="message-reaction-picker">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() =>
                handleReaction(emoji)
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageActions;
