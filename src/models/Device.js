const mongoose = require("mongoose");
const crypto = require("crypto");

const deviceSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    deviceId: { type: String, required: true, unique: true }, // hardware serial / ESP32 chip id
    name: { type: String, default: "OpennCare Smart Dispenser" },
    // Used by the device itself to authenticate sync calls (not a user JWT - devices don't log in as users)
    deviceSecret: { type: String, required: true, select: false },
    status: { type: String, enum: ["Online", "Offline"], default: "Offline" },
    lastSyncAt: Date,
    // Local schedule cache the device holds so it can dispense correctly even without internet.
    // Refreshed on every /sync call.
    cachedScheduleVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

deviceSchema.statics.generateSecret = () => crypto.randomBytes(24).toString("hex");

module.exports = mongoose.model("Device", deviceSchema);
