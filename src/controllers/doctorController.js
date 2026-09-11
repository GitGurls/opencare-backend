const asyncHandler = require("express-async-handler");
const Doctor = require("../models/Doctor");
const AccessGrant = require("../models/AccessGrant");
const Appointment = require("../models/Appointment");

// @desc  Get logged-in doctor's own profile
// @route GET /api/doctors/me
// @access Private (doctor)
const getMyProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id })
    .populate("user", "name email phone status")
    .populate("hospital", "name location");

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor profile not found");
  }

  res.json({ success: true, doctor });
});

// @desc  Update logged-in doctor's own profile
// @route PUT /api/doctors/me
// @access Private (doctor)
const updateMyProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor profile not found");
  }

  const fields = ["qualification", "specialization", "experienceYears", "hospital", "availability"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) doctor[field] = req.body[field];
  });
  doctor.lastActive = new Date();

  await doctor.save();
  res.json({ success: true, doctor });
});

// @desc  List patients who have granted this doctor access
// @route GET /api/doctors/my-patients
// @access Private (doctor)
const getMyPatients = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });

  const grants = await AccessGrant.find({ grantedToDoctor: doctor._id, status: "Active" }).populate({
    path: "patient",
    populate: { path: "user", select: "name email phone" },
  });

  const patients = grants.map((g) => g.patient);
  res.json({ success: true, count: patients.length, patients });
});

// @desc  List today's appointments for the doctor
// @route GET /api/doctors/my-appointments
// @access Private (doctor)
const getMyAppointments = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });

  const appointments = await Appointment.find({ doctor: doctor._id })
    .populate({ path: "patient", populate: { path: "user", select: "name" } })
    .sort("date");

  res.json({ success: true, count: appointments.length, appointments });
});

module.exports = { getMyProfile, updateMyProfile, getMyPatients, getMyAppointments };
