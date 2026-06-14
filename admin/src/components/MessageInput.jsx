import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import EmojiPicker from "emoji-picker-react";

import { useAuth } from "../hooks/useAuth";
import {
  editMessage,
  sendMessage,
  sendMessageWithFile,
} from "../services/messageService";
import {
  canEditMessage,
  getMessageTypeFromFile,
} from "../utils/messagePreview";

import { socket } from "../socket/socket";

import MessageReplyPreview from "./MessageReplyPreview";

const TYPING_IDLE_MS = 2000;

const ACCEPTED_FILES =
  "image/jpeg,image/png,image/gif,image/webp," +
  "video/mp4,video/webm,video/quicktime," +
  "application/pdf,text/plain," +
  "application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-excel," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.ms-powerpoint," +
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const MessageInput = ({
  selectedChat,
  setMessages,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onMessageUpdated,
  disabled = false,
  disabledReason = "",
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState(
    () => editingMessage?.content ?? ""
  );
  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);
  const [uploading, setUploading] = useState(false);

  const textareaRef = useRef(null);
  const pickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingIdleTimerRef = useRef(null);
  const isTypingActiveRef = useRef(false);
  const chatIdRef = useRef(selectedChat?._id);
  const editingMessageRef = useRef(editingMessage);

  useLayoutEffect(() => {
    chatIdRef.current = selectedChat?._id;
    editingMessageRef.current = editingMessage;
  });

  const clearTypingIdleTimer = () => {
    if (typingIdleTimerRef.current) {
      clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = null;
    }
  };

  const emitTyping = (isTyping) => {
    const chatId = chatIdRef.current;

    if (!chatId) {
      return;
    }

    if (isTyping && editingMessageRef.current) {
      return;
    }

    if (!socket.connected) {
      return;
    }

    socket.emit("typing", { chatId, isTyping });
  };

  const stopTyping = useCallback(() => {
    clearTypingIdleTimer();

    if (isTypingActiveRef.current) {
      isTypingActiveRef.current = false;
      emitTyping(false);
    }
  }, []);

  const handleTypingActivity = (value) => {
    if (editingMessageRef.current) {
      return;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      stopTyping();
      return;
    }

    if (!isTypingActiveRef.current) {
      isTypingActiveRef.current = true;
      emitTyping(true);
    }

    clearTypingIdleTimer();

    typingIdleTimerRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_IDLE_MS);
  };

  useEffect(() => {
    if (editingMessage) {
      stopTyping();
      textareaRef.current?.focus();
    }
  }, [editingMessage, stopTyping]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
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
  }, [showEmojiPicker]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [selectedChat?._id, stopTyping]);

  const insertEmoji = (emojiData) => {
    const textarea = textareaRef.current;
    const emoji = emojiData.emoji;

    if (!textarea) {
      setContent((prev) => {
        const next = prev + emoji;
        handleTypingActivity(next);
        return next;
      });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    setContent((prev) => {
      const next =
        prev.slice(0, start) +
        emoji +
        prev.slice(end);

      handleTypingActivity(next);
      return next;
    });

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    });

    setShowEmojiPicker(false);
  };

  const sendTextMessage = async (trimmedContent) => {
    if (disabled) return;
    const replyToMessageId =
      replyingTo?._id ?? null;

    const tempId = `temp-${crypto.randomUUID()}`;

    const optimisticMessage = {
      _id: tempId,
      messageType: "text",
      content: trimmedContent,
      sender: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture ?? null,
      },
      chat: selectedChat._id,
      readBy: [user._id],
      deliveredTo: [],
      pending: true,
      ...(replyingTo && {
        replyTo: {
          messageId: replyingTo._id,
          senderUsername:
            replyingTo.sender?.username ||
            "Unknown",
          content: replyingTo.content || "",
          messageType:
            replyingTo.messageType || "text",
        },
      }),
    };

    stopTyping();
    setContent("");
    onCancelReply?.();

    setMessages((prev) => [
      ...prev,
      optimisticMessage,
    ]);

    try {
      const message = await sendMessage(
        selectedChat._id,
        trimmedContent,
        replyToMessageId
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? message : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== tempId)
      );

      setContent(trimmedContent);

      alert(
        error.response?.data?.message ||
        "Could not send message"
      );

      console.error(error);
    }
  };

  const saveEdit = async (trimmedContent) => {
    if (!canEditMessage(editingMessage)) {
      alert(
        "Messages can only be edited within 15 minutes of sending"
      );
      onCancelEdit?.();
      return;
    }

    try {
      const updated = await editMessage(
        editingMessage._id,
        trimmedContent
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updated._id ? updated : msg
        )
      );

      onMessageUpdated?.(updated);
      setContent("");
      onCancelEdit?.();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not edit message"
      );

      console.error(error);
    }
  };

  const sendFileMessage = async (file) => {
    if (disabled) return;
    const caption = content.trim();
    const replyToMessageId =
      replyingTo?._id ?? null;
    const tempId = `temp-${crypto.randomUUID()}`;
    const localPreviewUrl =
      URL.createObjectURL(file);
    const messageType =
      getMessageTypeFromFile(file);

    const optimisticMessage = {
      _id: tempId,
      messageType,
      content: caption,
      attachment: {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      },
      localPreviewUrl,
      sender: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture ?? null,
      },
      chat: selectedChat._id,
      readBy: [user._id],
      deliveredTo: [],
      pending: true,
      ...(replyingTo && {
        replyTo: {
          messageId: replyingTo._id,
          senderUsername:
            replyingTo.sender?.username ||
            "Unknown",
          content: replyingTo.content || "",
          messageType:
            replyingTo.messageType || "text",
        },
      }),
    };

    stopTyping();
    setContent("");
    onCancelReply?.();
    setUploading(true);

    setMessages((prev) => [
      ...prev,
      optimisticMessage,
    ]);

    try {
      const message = await sendMessageWithFile(
        selectedChat._id,
        file,
        caption,
        replyToMessageId
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? message : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== tempId)
      );

      setContent(caption);

      alert(
        error.response?.data?.message ||
        "Could not send file"
      );

      console.error(error);
    } finally {
      URL.revokeObjectURL(localPreviewUrl);
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent || uploading) return;

    if (editingMessage) {
      await saveEdit(trimmedContent);
      return;
    }

    await sendTextMessage(trimmedContent);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploading || editingMessage) {
      return;
    }

    await sendFileMessage(file);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isEditing = Boolean(editingMessage);

  const handleContentChange = (e) => {
    if (disabled) return;

    const value = e.target.value;
    setContent(value);
    handleTypingActivity(value);
  };

  if (disabled) {
    return (
      <div className="message-form message-form-disabled">
        <p className="message-form-disabled-text">
          {disabledReason ||
            "Messaging is not available for this chat."}
        </p>
      </div>
    );
  }

  return (
    <form
      className="message-form"
      onSubmit={handleSubmit}
    >
      {replyingTo && !isEditing && (
        <MessageReplyPreview
          replyTo={{
            senderUsername:
              replyingTo.sender?.username ||
              "Unknown",
            content: replyingTo.content,
            messageType:
              replyingTo.messageType || "text",
          }}
          variant="composer"
          onCancel={onCancelReply}
        />
      )}

      {isEditing && (
        <div className="composer-reply-bar composer-edit-bar">
          <div className="composer-reply-content">
            <span className="composer-reply-label">
              Editing message
            </span>
          </div>

          <button
            type="button"
            className="composer-reply-cancel"
            onClick={onCancelEdit}
            aria-label="Cancel edit"
          >
            ×
          </button>
        </div>
      )}

      <div className="message-form-row">
        <div
          className="message-input-wrap"
          ref={pickerRef}
        >
          <button
            type="button"
            className="attach-btn"
            disabled={uploading || isEditing}
            onClick={() =>
              fileInputRef.current?.click()
            }
            aria-label="Attach file"
          >
            📎
          </button>

          <input
            ref={fileInputRef}
            id="message-attachment"
            name="attachment"
            type="file"
            className="message-file-input"
            accept={ACCEPTED_FILES}
            onChange={handleFileChange}
          />

          <label
            htmlFor="message-attachment"
            className="visually-hidden"
          >
            Attach file
          </label>

          <button
            type="button"
            className="emoji-btn"
            disabled={uploading}
            onClick={() =>
              setShowEmojiPicker((prev) => !prev)
            }
            aria-label="Add emoji"
          >
            😊
          </button>

          {showEmojiPicker && (
            <div className="emoji-picker-popover">
              <EmojiPicker
                onEmojiClick={insertEmoji}
                width="100%"
                height={360}
              />
            </div>
          )}

          <label
            htmlFor="message-content"
            className="visually-hidden"
          >
            Message
          </label>

          <textarea
            ref={textareaRef}
            id="message-content"
            name="message"
            placeholder={
              isEditing
                ? "Edit your message..."
                : "Type a message..."
            }
            value={content}
            disabled={uploading}
            onChange={handleContentChange}
            onBlur={stopTyping}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
        >
          {uploading
            ? "..."
            : isEditing
              ? "Save"
              : "Send"}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
