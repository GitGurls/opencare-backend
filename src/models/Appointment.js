const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    date: { type: Date, required: true },
    slot: String, // e.g. "10:30 AM"
    reason: String,
    status: {
      type: String,
      enum: ["Requested", "Confirmed", "InQueue", "Completed", "Cancelled"],
      default: "Requested",
    },
    queuePosition: Number,
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
