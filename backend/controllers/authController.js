import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { notifyAdmins } from "../utils/notifyAdmins.js";
import { serverError } from "../utils/serverError.js";

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatUserResponse = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture ?? null,
  phone: user.phone ?? null,
  serviceArea: user.serviceArea ?? null,
  isAvailable: user.isAvailable ?? true,
  token: generateToken(user._id),
});

const validateRegistration = ({
  username,
  email,
  password,
}) => {
  if (
    !username?.trim() ||
    !email?.trim() ||
    !password
  ) {
    return "All fields are required";
  }

  if (username.trim().length < 2) {
    return "Username must be at least 2 characters";
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return "Invalid email address";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
};

const registerWithRole = async (
  req,
  res,
  role
) => {
  try {
    const {
      username,
      email,
      password,
      phone,
      serviceArea,
    } = req.body;

    const validationError = validateRegistration({
      username,
      email,
      password,
    });

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();
    const normalizedUsername =
      username.trim();

    const userExists = await User.findOne({
      email: normalizedEmail,
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const usernameTaken = await User.findOne({
      username: {
        $regex: `^${escapeRegex(normalizedUsername)}$`,
        $options: "i",
      },
    });

    if (usernameTaken) {
      return res.status(409).json({
        message: "Username is already taken",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      ...(role === "plumber" && {
        phone: phone?.trim() || null,
        serviceArea: serviceArea?.trim() || null,
        isAvailable: true,
      }),
    });

    const response = formatUserResponse(user);

    await notifyAdmins("userRegistered", {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    res.status(201).json(response);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(
        error.keyPattern ?? {}
      )[0];

      return res.status(409).json({
        message:
          field === "username"
            ? "Username is already taken"
            : "User already exists",
      });
    }

    return serverError(res, error);
  }
};

export const registerUser = async (req, res) =>
  registerWithRole(req, res, "customer");

export const registerPlumber = async (req, res) =>
  registerWithRole(req, res, "plumber");

export const loginUser = async (req, res) => {
  try {
    const { email, password, expectedRole } =
      req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (
      expectedRole &&
      user.role !== expectedRole
    ) {
      const roleMessages = {
        plumber:
          "This account is not a plumber account",
        admin:
          "This account is not an admin account",
        customer:
          "Please use the customer app to sign in",
      };

      return res.status(403).json({
        message:
          roleMessages[expectedRole] ||
          "Wrong app for this account",
      });
    }

    res.json(formatUserResponse(user));
  } catch (error) {
    return serverError(res, error);
  }
};
