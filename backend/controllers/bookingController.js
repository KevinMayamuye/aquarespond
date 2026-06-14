import Booking from "../models/Booking.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Rating from "../models/Rating.js";

import { getIO } from "../socket/socketManager.js";
import { notifyAdmins } from "../utils/notifyAdmins.js";
import { serverError } from "../utils/serverError.js";
import {
  hasPlumberSlotConflict,
} from "../utils/bookingAccess.js";
import { findOrCreateDirectChat } from "../utils/findOrCreateDirectChat.js";

const userFields =
  "username email profilePicture phone serviceArea";

const populateBooking = (query) =>
  query
    .populate("customer", userFields)
    .populate("plumber", userFields)
    .populate({
      path: "chat",
      populate: {
        path: "participants",
        select: userFields,
      },
    });

const emitToUser = (userId, event, payload) => {
  getIO()
    .to(userId.toString())
    .emit(event, payload);
};

const notifyBookingUpdate = async (booking) => {
  const populated = await populateBooking(
    Booking.findById(booking._id)
  );

  emitToUser(
    booking.customer,
    "bookingUpdated",
    populated
  );
  emitToUser(
    booking.plumber,
    "bookingUpdated",
    populated
  );

  await notifyAdmins(
    "bookingActivity",
    populated
  );

  return populated;
};

const formatConflictError = () => ({
  status: 409,
  message:
    "This time slot is no longer available for this plumber",
});

const CLOSED_STATUSES = [
  "completed",
  "cancelled",
  "declined",
];

export const createBooking = async (req, res) => {
  try {
    const {
      plumberId,
      scheduledAt,
      serviceType,
      address,
      notes,
      durationMinutes,
    } = req.body;

    if (
      !plumberId ||
      !scheduledAt ||
      !serviceType?.trim() ||
      !address?.trim()
    ) {
      return res.status(400).json({
        message:
          "Plumber, time, service type, and address are required",
      });
    }

    const slot = new Date(scheduledAt);

    if (Number.isNaN(slot.getTime())) {
      return res.status(400).json({
        message: "Invalid scheduled time",
      });
    }

    if (slot.getTime() <= Date.now()) {
      return res.status(400).json({
        message: "Booking must be in the future",
      });
    }

    const plumber = await User.findOne({
      _id: plumberId,
      role: "plumber",
      isAvailable: true,
    });

    if (!plumber) {
      return res.status(404).json({
        message: "Plumber not found or unavailable",
      });
    }

    if (
      plumberId.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        message: "Cannot book yourself",
      });
    }

    if (
      await hasPlumberSlotConflict(
        plumberId,
        slot
      )
    ) {
      const conflict = formatConflictError();
      return res.status(conflict.status).json({
        message: conflict.message,
      });
    }

    const booking = await Booking.create({
      customer: req.user._id,
      plumber: plumberId,
      scheduledAt: slot,
      serviceType: serviceType.trim(),
      address: address.trim(),
      notes: notes?.trim() ?? "",
      durationMinutes:
        Number(durationMinutes) || 60,
    });

    const populated = await populateBooking(
      Booking.findById(booking._id)
    );

    emitToUser(
      plumberId,
      "bookingRequested",
      populated
    );
    emitToUser(
      req.user._id,
      "bookingUpdated",
      populated
    );

    await notifyAdmins(
      "bookingActivity",
      populated
    );

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      const conflict = formatConflictError();
      return res.status(conflict.status).json({
        message: conflict.message,
      });
    }

    return serverError(res, error);
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await populateBooking(
      Booking.find({
        customer: req.user._id,
      }).sort({ scheduledAt: -1 })
    );

    res.status(200).json(bookings);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getIncomingBookings = async (
  req,
  res
) => {
  try {
    const bookings = await populateBooking(
      Booking.find({
        plumber: req.user._id,
        status: "pending",
      }).sort({ scheduledAt: 1 })
    );

    res.status(200).json(bookings);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getActiveBookings = async (
  req,
  res
) => {
  try {
    const bookings = await populateBooking(
      Booking.find({
        plumber: req.user._id,
        status: "accepted",
      }).sort({ scheduledAt: 1 })
    );

    res.status(200).json(bookings);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getBookingHistory = async (
  req,
  res
) => {
  try {
    const { role } = req.user;

    let roleFilter;

    if (role === "customer") {
      roleFilter = { customer: req.user._id };
    } else if (role === "plumber") {
      roleFilter = { plumber: req.user._id };
    } else {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const bookings = await populateBooking(
      Booking.find({
        ...roleFilter,
        status: { $in: CLOSED_STATUSES },
      }).sort({ updatedAt: -1 })
    );

    if (role === "customer") {
      const bookingIds = bookings.map(
        (booking) => booking._id
      );

      const ratings = bookingIds.length
        ? await Rating.find({
            booking: { $in: bookingIds },
            customer: req.user._id,
          }).select(
            "booking score comment status"
          )
        : [];

      const ratingByBooking = new Map(
        ratings.map((rating) => [
          rating.booking.toString(),
          {
            score: rating.score,
            comment: rating.comment,
            status: rating.status,
          },
        ])
      );

      const enriched = bookings.map((booking) => {
        const plain = booking.toObject();
        plain.customerRating =
          ratingByBooking.get(
            booking._id.toString()
          ) ?? null;

        return plain;
      });

      return res.status(200).json(enriched);
    }

    res.status(200).json(bookings);
  } catch (error) {
    return serverError(res, error);
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (
      booking.plumber.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Booking is not pending",
      });
    }

    if (
      await hasPlumberSlotConflict(
        booking.plumber,
        booking.scheduledAt,
        booking._id
      )
    ) {
      const conflict = formatConflictError();
      return res.status(conflict.status).json({
        message: conflict.message,
      });
    }

    const { chat: populatedChat } =
      await findOrCreateDirectChat(
        booking.customer,
        booking.plumber,
        {
          bookingId: booking._id,
          notifyUserId: booking.customer,
        }
      );

    const updated = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        status: "pending",
      },
      {
        status: "accepted",
        chat: populatedChat._id,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
        message: "Booking is no longer pending",
      });
    }

    const welcomeText = `Booking confirmed for ${new Date(
      booking.scheduledAt
    ).toLocaleString()} — ${booking.serviceType} at ${booking.address}`;

    const welcomeMessage = await Message.create({
      chat: populatedChat._id,
      sender: booking.plumber,
      messageType: "text",
      content: welcomeText,
      readBy: [booking.plumber],
      deliveredTo: [booking.plumber],
    });

    await Chat.findByIdAndUpdate(
      populatedChat._id,
      { lastMessage: welcomeMessage._id }
    );

    const populated =
      await notifyBookingUpdate(updated);

    res.status(200).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      const conflict = formatConflictError();
      return res.status(conflict.status).json({
        message: conflict.message,
      });
    }

    return serverError(res, error);
  }
};

export const declineBooking = async (req, res) => {
  try {
    const updated = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        plumber: req.user._id,
        status: "pending",
      },
      { status: "declined" },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
        message: "Booking not found or not pending",
      });
    }

    const populated =
      await notifyBookingUpdate(updated);

    res.status(200).json(populated);
  } catch (error) {
    return serverError(res, error);
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const isCustomer =
      booking.customer.toString() ===
      req.user._id.toString();
    const isPlumber =
      booking.plumber.toString() ===
      req.user._id.toString();

    if (!isCustomer && !isPlumber) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    if (
      !["pending", "accepted"].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        message: "Booking cannot be cancelled",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    const populated =
      await notifyBookingUpdate(booking);

    res.status(200).json(populated);
  } catch (error) {
    return serverError(res, error);
  }
};

export const completeBooking = async (req, res) => {
  try {
    const updated = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        plumber: req.user._id,
        status: "accepted",
      },
      { status: "completed" },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
        message: "Booking not found or not active",
      });
    }

    const populated =
      await notifyBookingUpdate(updated);

    res.status(200).json(populated);
  } catch (error) {
    return serverError(res, error);
  }
};
