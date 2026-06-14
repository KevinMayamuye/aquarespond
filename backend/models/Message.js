import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "video", "document"],
      default: "text",
    },

    content: {
      type: String,
      default: "",
    },

    attachment: {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      fileName: String,
      mimeType: String,
      size: Number,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
      senderUsername: String,
      content: String,
      messageType: {
        type: String,
        default: "text",
      },
    },

    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
      },
    ],

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.pre("validate", function validateContent() {
  const hasContent = this.content?.trim();
  const hasAttachment = this.attachment?.fileId;

  if (!hasContent && !hasAttachment) {
    this.invalidate(
      "content",
      "Message must have text content or a file attachment"
    );
  }
});

messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ "attachment.fileId": 1 });

export default mongoose.model("Message", messageSchema);