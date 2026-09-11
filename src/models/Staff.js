const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true }, // e.g. "Nurse", "Receptionist", "Lab Technician"
    department: String,
    phone: String,
    email: String,
    shift: { type: String, enum: ["Morning", "Evening", "Night", "Full-time"], default: "Full-time" },
    status: { type: String, enum: ["Active", "OnLeave", "Inactive"], default: "Active" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
