import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { getFile } from "../controllers/fileController.js";

const router = express.Router();

router.get(
  "/:fileId",
  authMiddleware,
  getFile
);

export default router;