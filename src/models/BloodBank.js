const mongoose = require("mongoose");

const bloodBankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    location: {
      address: String,
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    contactPhone: String,
    stock: {
      "A+": { type: Number, default: 0 },
      "A-": { type: Number, default: 0 },
      "B+": { type: Number, default: 0 },
      "B-": { type: Number, default: 0 },
      "AB+": { type: Number, default: 0 },
      "AB-": { type: Number, default: 0 },
      "O+": { type: Number, default: 0 },
      "O-": { type: Number, default: 0 },
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

bloodBankSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("BloodBank", bloodBankSchema);
