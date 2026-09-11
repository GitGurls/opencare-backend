const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    fromAppointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    scheduledDate: { type: Date, required: true },
    notes: String,
    status: { type: String, enum: ["Pending", "Done", "Missed"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FollowUp", followUpSchema);
