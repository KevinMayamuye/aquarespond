import mongoose from "mongoose";

const waterWasteReportSchema =
  new mongoose.Schema(
    {
      reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      severity: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },

      photo: {
        type: String,
        default: null,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "under_review",
          "resolved",
          "dismissed",
        ],
        default: "pending",
      },

      adminNotes: {
        type: String,
        default: "",
        trim: true,
      },

      assignedPlumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      assignedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

waterWasteReportSchema.index({
  reporter: 1,
  createdAt: -1,
});
waterWasteReportSchema.index({ status: 1, createdAt: -1 });
waterWasteReportSchema.index({
  assignedPlumber: 1,
  status: 1,
});

export default mongoose.model(
  "WaterWasteReport",
  waterWasteReportSchema
);
