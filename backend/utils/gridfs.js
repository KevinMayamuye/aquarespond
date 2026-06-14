import mongoose from "mongoose";

const BUCKET_NAME = "chatAttachments";

const getBucket = () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("Database not connected");
  }

  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: BUCKET_NAME,
  });
};

export const uploadFile = (
  buffer,
  { fileName, mimeType, chatId, senderId }
) =>
  new Promise((resolve, reject) => {
    if (!buffer?.length) {
      reject(new Error("Empty file buffer"));
      return;
    }

    const bucket = getBucket();

    const uploadStream = bucket.openUploadStream(
      fileName,
      {
        contentType: mimeType,
        metadata: {
          chatId: chatId.toString(),
          senderId: senderId.toString(),
          originalName: fileName,
        },
      }
    );

    uploadStream.on("error", reject);

    uploadStream.on("finish", () => {
      resolve(uploadStream.id);
    });

    uploadStream.end(buffer);
  });

export const downloadFile = async (fileId) => {
  const bucket = getBucket();
  const objectId = new mongoose.Types.ObjectId(fileId);

  const files = await bucket
    .find({ _id: objectId })
    .toArray();

  if (files.length === 0) {
    return null;
  }

  const file = files[0];
  const stream = bucket.openDownloadStream(objectId);

  return { stream, file };
};

export const deleteFile = async (fileId) => {
  const bucket = getBucket();

  await bucket.delete(
    new mongoose.Types.ObjectId(fileId)
  );
};