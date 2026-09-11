const asyncHandler = require("express-async-handler");
const Medicine = require("../models/Medicine");
const DoseLog = require("../models/DoseLog");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const AccessGrant = require("../models/AccessGrant");

// Generates one DoseLog per (day x time) for the medicine's duration
const generateDoseLogs = async (medicine) => {
  const logs = [];
  const start = new Date(medicine.startDate);

  for (let day = 0; day < medicine.durationDays; day++) {
    for (const time of medicine.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = new Date(start);
      scheduledAt.setDate(start.getDate() + day);
      scheduledAt.setHours(hours, minutes, 0, 0);

      logs.push({
        medicine: medicine._id,
        patient: medicine.patient,
        scheduledAt,
      });
    }
  }

  await DoseLog.insertMany(logs);
};

// @desc  Add a medicine schedule for a patient (patient self-adds, or doctor with active grant)
// @route POST /api/medicines/for/:patientId
// @access Private (patient - own id only, or doctor with grant)
const addMedicine = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  if (req.user.role === "patient") {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient || String(patient._id) !== patientId) {
      res.status(403);
      throw new Error("You can only add medicines to your own schedule");
    }
  } else if (req.user.role === "doctor") {
    const doctor = await Doctor.findOne({ user: req.user._id });
    const grant = await AccessGrant.findOne({
      patient: patientId,
      grantedToDoctor: doctor._id,
      status: "Active",
    });
    if (!grant) {
      res.status(403);
      throw new Error("No active access grant for this patient");
    }
    req.body.prescribedBy = doctor._id;
  }

  const { name, dosage, times, durationDays, startDate, notes, medicalRecord, prescribedBy } = req.body;

  if (!name || !dosage || !times || !times.length) {
    res.status(400);
    throw new Error("name, dosage and times[] are required");
  }

  const medicine = await Medicine.create({
    patient: patientId,
    prescribedBy,
    medicalRecord,
    name,
    dosage,
    times,
    durationDays: durationDays || 7,
    startDate: startDate || Date.now(),
    notes,
  });

  await generateDoseLogs(medicine);

  res.status(201).json({ success: true, medicine });
});

// @desc  Patient's active medicine list
// @route GET /api/medicines/mine
// @access Private (patient)
const getMyMedicines = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const medicines = await Medicine.find({ patient: patient._id }).sort("-createdAt");
  res.json({ success: true, count: medicines.length, medicines });
});

// @desc  Today's doses for the logged-in patient - Upcoming/Taken/Missed
// @route GET /api/medicines/mine/doses/today
// @access Private (patient)
const getTodaysDoses = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });

  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

  const doses = await DoseLog.find({
    patient: patient._id,
    scheduledAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate("medicine", "name dosage")
    .sort("scheduledAt");

  res.json({ success: true, count: doses.length, doses });
});

// @desc  Mark a dose as Taken (from the app, self-report) or Missed
// @route PUT /api/medicines/doses/:doseId/mark
// @access Private (patient)
const markDose = asyncHandler(async (req, res) => {
  const { status } = req.body; // "Taken" | "Missed"
  if (!["Taken", "Missed"].includes(status)) {
    res.status(400);
    throw new Error("status must be Taken or Missed");
  }

  const patient = await Patient.findOne({ user: req.user._id });
  const dose = await DoseLog.findOne({ _id: req.params.doseId, patient: patient._id });

  if (!dose) {
    res.status(404);
    throw new Error("Dose not found");
  }

  dose.status = status;
  dose.source = "App";
  if (status === "Taken") dose.takenAt = new Date();

  await dose.save();
  res.json({ success: true, dose });
});

module.exports = { addMedicine, getMyMedicines, getTodaysDoses, markDose };
