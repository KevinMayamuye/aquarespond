import jwt from "jsonwebtoken";
import User from "../models/User.js";

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select("_id");

    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.data.userId = user._id.toString();

    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
};

export default socketAuth;