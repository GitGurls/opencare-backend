const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    qualification: String, // e.g. "MBBS, MD (General Medicine)"
    specialization: { type: String, required: true },
    experienceYears: { type: Number, default: 0 },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    availability: {
      type: String,
      enum: ["Available", "Busy", "Off Duty"],
      default: "Available",
    },
    lastActive: { type: Date, default: Date.now },
    stats: {
      totalPatients: { type: Number, default: 0 },
      todaysAppointments: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
