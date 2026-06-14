import multer from "multer";

import { isAllowedMimeType } from "../utils/fileType.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedMimeType(file.mimetype)) {
      cb(new Error("File type not allowed"));
      return;
    }

    cb(null, true);
  },
});

export const uploadSingleFile = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  if (!contentType.includes("multipart/form-data")) {
    next();
    return;
  }

  upload.single("file")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File exceeds maximum allowed size",
      });
    }

    return res.status(400).json({
      message: err.message || "Invalid file upload",
    });
  });
};

export default upload;