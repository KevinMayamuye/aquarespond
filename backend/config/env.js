import dotenv from "dotenv";

dotenv.config();

export const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173,http://localhost:5174,http://localhost:5175";

export const PORT =
  process.env.PORT || 5000;