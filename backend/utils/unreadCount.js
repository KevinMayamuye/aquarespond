import mongoose from "mongoose";
import Message from "../models/Message.js";

export const getUnreadCountsForChats = async (
  chatIds,
  userId
) => {
  if (!chatIds.length) {
    return {};
  }

  const userObjectId =
    new mongoose.Types.ObjectId(userId);

  const counts = await Message.aggregate([
    {
      $match: {
        chat: {
          $in: chatIds.map(
            (id) =>
              new mongoose.Types.ObjectId(id)
          ),
        },
        sender: { $ne: userObjectId },
        readBy: { $nin: [userObjectId] },
      },
    },
    {
      $group: {
        _id: "$chat",
        count: { $sum: 1 },
      },
    },
  ]);

  return counts.reduce((map, item) => {
    map[item._id.toString()] = item.count;
    return map;
  }, {});
};