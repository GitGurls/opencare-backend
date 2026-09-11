const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, default: "Multi-speciality Hospital" },
    accreditation: String, // e.g. "NABH Accredited"
    location: {
      city: String,
      address: String,
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      },
    },
    departments: [{ type: String }],
    staffMembers: { type: Number, default: 0 },

    beds: {
      total: { type: Number, default: 0 },
      occupied: { type: Number, default: 0 },
      icuTotal: { type: Number, default: 0 },
      icuOccupied: { type: Number, default: 0 },
    },

    emergency: {
      hasEmergencyDept: { type: Boolean, default: true },
      capacityAvailable: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },

    pharmacyAvailable: { type: Boolean, default: false },
    labsAvailable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

hospitalSchema.index({ "location.coordinates": "2dsphere" });

// Computed occupancy rate, e.g. 78
hospitalSchema.virtual("occupancyRate").get(function () {
  if (!this.beds.total) return 0;
  return Math.round((this.beds.occupied / this.beds.total) * 100);
});

hospitalSchema.set("toJSON", { virtuals: true });
hospitalSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Hospital", hospitalSchema);
