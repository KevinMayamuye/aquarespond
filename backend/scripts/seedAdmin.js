import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";

dotenv.config();

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME?.trim() || "admin";
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim()?.toLowerCase() ||
  "admin@aquarespond.local";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin123456";

const seedAdmin = async () => {
  if (!process.env.MONGO_URI?.trim()) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({
    email: ADMIN_EMAIL,
  });

  if (existing) {
    if (existing.role !== "admin") {
      console.error(
        `User ${ADMIN_EMAIL} exists but is not an admin`
      );
      process.exit(1);
    }

    console.log(
      `Admin already exists: ${ADMIN_EMAIL}`
    );
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(
    ADMIN_PASSWORD,
    salt
  );

  await User.create({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: hashedPassword,
    role: "admin",
  });

  console.log(`Admin created: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();
};

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
