const asyncHandler = require("express-async-handler");
const Device = require("../models/Device");
const DoseLog = require("../models/DoseLog");
const Patient = require("../models/Patient");
const FamilyContact = require("../models/FamilyContact");

// @desc  Patient registers their physical dispenser to their account
// @route POST /api/devices/register
// @access Private (patient)
const registerDevice = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  const { deviceId, name } = req.body;
  if (!deviceId) {
    res.status(400);
    throw new Error("deviceId is required (the hardware's serial/chip id)");
  }

  const existing = await Device.findOne({ deviceId });
  if (existing) {
    res.status(400);
    throw new Error("This device is already registered");
  }

  const deviceSecret = Device.generateSecret();

  const device = await Device.create({
    patient: patient._id,
    deviceId,
    name: name || "OpennCare Smart Dispenser",
    deviceSecret,
    status: "Online",
    lastSyncAt: new Date(),
  });

  res.status(201).json({
    success: true,
    device: { id: device._id, deviceId: device.deviceId, name: device.name, status: device.status },
    // Shown ONCE - flash this onto the physical device / its local config. Not retrievable again.
    deviceSecret,
  });
});

// @desc  Patient views their linked device(s) status
// @route GET /api/devices/mine
// @access Private (patient)
const getMyDevices = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const devices = await Device.find({ patient: patient._id });
  res.json({ success: true, count: devices.length, devices });
});

// @desc  Device pulls its dosing schedule (so it can cache it locally and work offline)
// @route GET /api/devices/:deviceId/schedule
// @access Device (x-device-secret header)
const getDeviceSchedule = asyncHandler(async (req, res) => {
  const device = req.device;

  const upcoming = await DoseLog.find({
    patient: device.patient,
    status: "Upcoming",
    scheduledAt: { $gte: new Date() },
  })
    .populate("medicine", "name dosage")
    .sort("scheduledAt")
    .limit(50);

  device.lastSyncAt = new Date();
  device.status = "Online";
  device.cachedScheduleVersion += 1;
  await device.save();

  res.json({ success: true, scheduleVersion: device.cachedScheduleVersion, upcoming });
});

// @desc  Device syncs back dispense events it logged while offline (batched, offline-ready)
// @route POST /api/devices/:deviceId/sync
// @access Device (x-device-secret header)
// body: { events: [{ doseId, status: "Taken"|"Missed", dispensedAt }] }
const syncDeviceEvents = asyncHandler(async (req, res) => {
  const device = req.device;
  const { events } = req.body;

  if (!Array.isArray(events)) {
    res.status(400);
    throw new Error("events[] array is required");
  }

  const results = [];
  for (const evt of events) {
    const dose = await DoseLog.findOne({ _id: evt.doseId, patient: device.patient });
    if (!dose) continue;

    dose.status = evt.status === "Taken" ? "Taken" : "Missed";
    dose.source = "Device";
    if (dose.status === "Taken") dose.takenAt = evt.dispensedAt || new Date();
    await dose.save();
    results.push(dose);

    // Connected Care: notify family contacts who opted in for this event type.
    // (Actual SMS/push delivery needs a provider like Twilio/FCM - out of hackathon scope,
    // but the permissioned data is queried and ready to hand to one.)
    if (dose.status === "Missed") {
      await FamilyContact.find({
        patient: device.patient,
        status: "Active",
        notifyOn: "DoseMissed",
      });
    }
  }

  device.status = "Online";
  device.lastSyncAt = new Date();
  await device.save();

  res.json({ success: true, synced: results.length });
});

module.exports = { registerDevice, getMyDevices, getDeviceSchedule, syncDeviceEvents };
