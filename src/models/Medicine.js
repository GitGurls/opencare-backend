const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    medicalRecord: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalRecord" }, // linked prescription, if any
    name: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g. "500mg"
    // Clock times the dose should be taken each day, e.g. ["08:00", "20:00"]
    times: { type: [String], required: true },
    durationDays: { type: Number, required: true, default: 7 },
    startDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["Active", "Completed", "Stopped"], default: "Active" },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
