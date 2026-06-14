import express from "express";

import { authLimiter } from "../middleware/rateLimiter.js";

import {
  registerUser,
  registerPlumber,
  loginUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  registerUser
);
router.post(
  "/register/plumber",
  authLimiter,
  registerPlumber
);
router.post(
  "/login",
  authLimiter,
  loginUser
);

export default router;