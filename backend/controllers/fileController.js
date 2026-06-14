import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import mongoose from "mongoose";

import { downloadFile } from "../utils/gridfs.js";
import { serverError } from "../utils/serverError.js";

const isChatParticipant = (chat, userId) =>
  chat.participants.some(
    (id) => id.toString() === userId.toString()
  );

export const getFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        message: "Invalid file ID",
      });
    }

    const objectId = new mongoose.Types.ObjectId(
      fileId
    );

    const message = await Message.findOne({
      "attachment.fileId": objectId,
    });

    if (!message) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const chat = await Chat.findById(message.chat);

    if (!chat || !isChatParticipant(chat, req.user._id)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const result = await downloadFile(fileId);

    if (!result) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const { stream, file } = result;
    const mimeType =
      file.contentType ||
      message.attachment?.mimeType ||
      "application/octet-stream";
    const fileName =
      message.attachment?.fileName ||
      file.filename ||
      "download";

    const isInline =
      mimeType.startsWith("image/") ||
      mimeType.startsWith("video/");

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `${isInline ? "inline" : "attachment"}; filename="${encodeURIComponent(fileName)}"`
    );

    if (file.length) {
      res.setHeader("Content-Length", file.length);
    }

    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(500).json({
          message: "Error streaming file",
        });
      }
    });

    stream.pipe(res);
  } catch (error) {
    return serverError(res, error);
  }
};