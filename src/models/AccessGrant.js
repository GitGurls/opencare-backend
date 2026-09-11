const mongoose = require("mongoose");

// Patient decides exactly what a doctor (or hospital) can see.
// scope "all" = full medical passport, "records" = list of specific MedicalRecord ids.
const accessGrantSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    grantedToDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    grantedToHospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    scope: {
      type: String,
      enum: ["all", "records"],
      default: "records",
    },
    recordIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MedicalRecord" }],
    status: {
      type: String,
      enum: ["Active", "Revoked", "Expired"],
      default: "Active",
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessGrant", accessGrantSchema);
