const asyncHandler = require("express-async-handler");
const MedicalRecord = require("../models/MedicalRecord");
const AccessGrant = require("../models/AccessGrant");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

// ---------- Medical Passport (records) ----------

// @desc  Patient adds a record to their own medical passport (self-uploaded report etc.)
// @route POST /api/records
// @access Private (patient)
const addOwnRecord = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  const record = await MedicalRecord.create({
    patient: patient._id,
    type: req.body.type,
    title: req.body.title,
    description: req.body.description,
    fileUrl: req.body.fileUrl,
    recordDate: req.body.recordDate,
  });

  res.status(201).json({ success: true, record });
});

// @desc  Doctor adds a prescription/diagnosis for a patient (requires active access grant)
// @route POST /api/records/for/:patientId
// @access Private (doctor)
const addRecordForPatient = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor profile not found");
  }

  const hasAccess = await AccessGrant.findOne({
    patient: req.params.patientId,
    grantedToDoctor: doctor._id,
    status: "Active",
  });

  if (!hasAccess) {
    res.status(403);
    throw new Error("No active access grant for this patient");
  }

  const record = await MedicalRecord.create({
    patient: req.params.patientId,
    type: req.body.type || "Prescription",
    title: req.body.title,
    description: req.body.description,
    medicines: req.body.medicines,
    createdByDoctor: doctor._id,
    hospital: doctor.hospital,
  });

  res.status(201).json({ success: true, record });
});

// @desc  Patient views their own full medical passport
// @route GET /api/records/mine
// @access Private (patient)
const getMyRecords = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  const records = await MedicalRecord.find({ patient: patient._id })
    .populate("createdByDoctor", "specialization")
    .sort("-recordDate");

  res.json({ success: true, count: records.length, records });
});

// @desc  Doctor views a patient's records - only what the grant scope allows
// @route GET /api/records/patient/:patientId
// @access Private (doctor)
const getRecordsForDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor profile not found");
  }

  const grant = await AccessGrant.findOne({
    patient: req.params.patientId,
    grantedToDoctor: doctor._id,
    status: "Active",
  });

  if (!grant) {
    res.status(403);
    throw new Error("No active access grant for this patient");
  }

  let records;
  if (grant.scope === "all") {
    records = await MedicalRecord.find({ patient: req.params.patientId }).sort("-recordDate");
  } else {
    records = await MedicalRecord.find({ _id: { $in: grant.recordIds } }).sort("-recordDate");
  }

  res.json({ success: true, scope: grant.scope, count: records.length, records });
});

// ---------- Patient Controlled Access (grants) ----------

// @desc  Patient grants a doctor access (all records, or specific ones - "shared album" style)
// @route POST /api/records/grants
// @access Private (patient)
const createGrant = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  const { doctorId, hospitalId, scope, recordIds, expiresAt } = req.body;

  if (!doctorId && !hospitalId) {
    res.status(400);
    throw new Error("Provide doctorId or hospitalId to grant access to");
  }

  const grant = await AccessGrant.create({
    patient: patient._id,
    grantedToDoctor: doctorId,
    grantedToHospital: hospitalId,
    scope: scope || "records",
    recordIds: scope === "all" ? [] : recordIds || [],
    expiresAt,
  });

  res.status(201).json({ success: true, grant });
});

// @desc  Patient revokes a previously granted access
// @route PUT /api/records/grants/:id/revoke
// @access Private (patient)
const revokeGrant = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const grant = await AccessGrant.findOne({ _id: req.params.id, patient: patient._id });

  if (!grant) {
    res.status(404);
    throw new Error("Access grant not found");
  }

  grant.status = "Revoked";
  await grant.save();

  res.json({ success: true, grant });
});

// @desc  Patient lists all access grants they've given out
// @route GET /api/records/grants/mine
// @access Private (patient)
const getMyGrants = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const grants = await AccessGrant.find({ patient: patient._id })
    .populate({ path: "grantedToDoctor", populate: { path: "user", select: "name" } })
    .populate("grantedToHospital", "name")
    .sort("-createdAt");

  res.json({ success: true, count: grants.length, grants });
});

module.exports = {
  addOwnRecord,
  addRecordForPatient,
  getMyRecords,
  getRecordsForDoctor,
  createGrant,
  revokeGrant,
  getMyGrants,
};
