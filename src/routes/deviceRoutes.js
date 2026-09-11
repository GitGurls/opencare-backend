const express = require("express");
const {
  registerDevice,
  getMyDevices,
  getDeviceSchedule,
  syncDeviceEvents,
} = require("../controllers/deviceController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { deviceAuth } = require("../middleware/deviceAuth");

const router = express.Router();

// Patient-facing (user JWT)
router.post("/register", protect, authorize("patient"), registerDevice);
router.get("/mine", protect, authorize("patient"), getMyDevices);

// Device-facing (x-device-secret header, no user JWT - the hardware calls these directly)
router.get("/:deviceId/schedule", deviceAuth, getDeviceSchedule);
router.post("/:deviceId/sync", deviceAuth, syncDeviceEvents);

module.exports = router;
