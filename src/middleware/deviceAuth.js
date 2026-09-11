const asyncHandler = require("express-async-handler");
const Device = require("../models/Device");

// Devices (the physical ESP32 dispenser) don't log in as a user - they authenticate with
// a per-device secret issued at registration time, sent as a header.
const deviceAuth = asyncHandler(async (req, res, next) => {
  const deviceSecret = req.headers["x-device-secret"];
  const { deviceId } = req.params;

  if (!deviceSecret) {
    res.status(401);
    throw new Error("Missing x-device-secret header");
  }

  const device = await Device.findOne({ deviceId }).select("+deviceSecret");
  if (!device || device.deviceSecret !== deviceSecret) {
    res.status(401);
    throw new Error("Invalid device credentials");
  }

  req.device = device;
  next();
});

module.exports = { deviceAuth };
