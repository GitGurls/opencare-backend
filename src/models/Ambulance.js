const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, required: true, unique: true },
    driverName: String,
    driverPhone: String,
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    type: { type: String, enum: ["Basic", "ICU", "Cardiac"], default: "Basic" },
    status: {
      type: String,
      enum: ["Available", "OnTrip", "Offline"],
      default: "Available",
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
  },
  { timestamps: true }
);

ambulanceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Ambulance", ambulanceSchema);
