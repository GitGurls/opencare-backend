const mongoose = require("mongoose");

const doseLogSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["Upcoming", "Taken", "Missed"],
      default: "Upcoming",
    },
    takenAt: Date,
    // How the dose was marked taken - app button (self-report) or the physical dispenser device
    source: { type: String, enum: ["App", "Device"], default: "App" },
  },
  { timestamps: true }
);

doseLogSchema.index({ patient: 1, scheduledAt: 1 });

module.exports = mongoose.model("DoseLog", doseLogSchema);
