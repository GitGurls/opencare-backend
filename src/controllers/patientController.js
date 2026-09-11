const asyncHandler = require("express-async-handler");
const Patient = require("../models/Patient");

// @desc  Get logged-in patient's own profile
// @route GET /api/patients/me
// @access Private (patient)
const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id }).populate(
    "user",
    "name email phone status"
  );

  if (!patient) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  res.json({ success: true, patient });
});

// @desc  Update logged-in patient's own profile
// @route PUT /api/patients/me
// @access Private (patient)
const updateMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });

  if (!patient) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  const fields = ["age", "gender", "bloodGroup", "location", "emergencyContact"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) patient[field] = req.body[field];
  });

  await patient.save();
  res.json({ success: true, patient });
});

// @desc  Get a patient's public-facing card (used by doctors/hospitals with an active grant)
// @route GET /api/patients/:id
// @access Private (doctor, hospital_admin)
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate(
    "user",
    "name email phone status"
  );

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  res.json({ success: true, patient });
});

module.exports = { getMyProfile, updateMyProfile, getPatientById };
