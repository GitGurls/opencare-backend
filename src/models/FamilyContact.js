const mongoose = require("mongoose");

// "Connected Care" from the PPT - patient allows a family member (or their doctor) to
// receive medication updates (dose taken/missed alerts), with explicit permission.
const familyContactSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    name: { type: String, required: true },
    relation: String, // e.g. "Mother", "Spouse"
    phone: String,
    email: String,
    // What this contact is allowed to be notified about
    notifyOn: {
      type: [String],
      enum: ["DoseTaken", "DoseMissed", "DeviceOffline"],
      default: ["DoseMissed"],
    },
    status: { type: String, enum: ["Active", "Revoked"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FamilyContact", familyContactSchema);
