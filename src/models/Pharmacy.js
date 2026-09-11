const mongoose = require("mongoose");

const pharmacySchema = new mongoose.Schema(
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
    is24x7: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

pharmacySchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Pharmacy", pharmacySchema);
