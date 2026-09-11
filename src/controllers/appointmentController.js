const asyncHandler = require("express-async-handler");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

// @desc  Patient books an appointment
// @route POST /api/appointments
// @access Private (patient)
const bookAppointment = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    res.status(404);
    throw new Error("Patient profile not found");
  }

  const { doctorId, hospitalId, date, slot, reason } = req.body;
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  // simple queue position: count existing appointments for that doctor on that date
  const sameDay = {
    $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
    $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
  };
  const existingCount = await Appointment.countDocuments({
    doctor: doctorId,
    date: sameDay,
    status: { $in: ["Requested", "Confirmed", "InQueue"] },
  });

  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctorId,
    hospital: hospitalId || doctor.hospital,
    date,
    slot,
    reason,
    queuePosition: existingCount + 1,
  });

  doctor.stats.todaysAppointments += 1;
  await doctor.save();

  res.status(201).json({ success: true, appointment });
});

// @desc  Patient views their own appointments
// @route GET /api/appointments/mine
// @access Private (patient)
const getMyAppointments = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });

  const appointments = await Appointment.find({ patient: patient._id })
    .populate({ path: "doctor", populate: { path: "user", select: "name" } })
    .populate("hospital", "name")
    .sort("-date");

  res.json({ success: true, count: appointments.length, appointments });
});

// @desc  Doctor/hospital updates appointment status (Confirmed/InQueue/Completed/Cancelled)
// @route PUT /api/appointments/:id/status
// @access Private (doctor, hospital_admin)
const updateStatus = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  const allowed = ["Requested", "Confirmed", "InQueue", "Completed", "Cancelled"];
  if (!allowed.includes(req.body.status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(", ")}`);
  }

  appointment.status = req.body.status;
  await appointment.save();

  res.json({ success: true, appointment });
});

// @desc  Cancel own appointment (patient)
// @route PUT /api/appointments/:id/cancel
// @access Private (patient)
const cancelAppointment = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: patient._id });

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  appointment.status = "Cancelled";
  await appointment.save();

  res.json({ success: true, appointment });
});

module.exports = { bookAppointment, getMyAppointments, updateStatus, cancelAppointment };
