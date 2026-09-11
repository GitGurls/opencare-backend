const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    age: Number,
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    location: {
      city: String,
      address: String,
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        // [longitude, latitude]
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    lastVisit: Date,
    medicalPassportComplete: { type: Boolean, default: false },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
  },
  { timestamps: true }
);

patientSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Patient", patientSchema);
