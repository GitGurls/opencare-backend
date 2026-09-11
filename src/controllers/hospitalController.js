const asyncHandler = require("express-async-handler");
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

// @desc  Get logged-in hospital admin's hospital profile
// @route GET /api/hospitals/me
// @access Private (hospital_admin)
const getMyHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error("Hospital profile not found");
  }
  res.json({ success: true, hospital });
});

// @desc  Update hospital profile (departments, staff count, accreditation etc.)
// @route PUT /api/hospitals/me
// @access Private (hospital_admin)
const updateMyHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error("Hospital profile not found");
  }

  const fields = [
    "name",
    "type",
    "accreditation",
    "location",
    "departments",
    "staffMembers",
    "pharmacyAvailable",
    "labsAvailable",
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) hospital[field] = req.body[field];
  });

  await hospital.save();
  res.json({ success: true, hospital });
});

// @desc  Update bed / ICU capacity (used by Bed Management quick action)
// @route PUT /api/hospitals/me/beds
// @access Private (hospital_admin)
const updateBeds = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error("Hospital profile not found");
  }

  const { total, occupied, icuTotal, icuOccupied } = req.body;
  if (total !== undefined) hospital.beds.total = total;
  if (occupied !== undefined) hospital.beds.occupied = occupied;
  if (icuTotal !== undefined) hospital.beds.icuTotal = icuTotal;
  if (icuOccupied !== undefined) hospital.beds.icuOccupied = icuOccupied;

  hospital.emergency.capacityAvailable = Math.max(hospital.beds.total - hospital.beds.occupied, 0);
  hospital.emergency.lastUpdated = new Date();

  await hospital.save();
  res.json({ success: true, hospital });
});

// @desc  Hospital analytics summary (used by "Hospital Analytics" quick action)
// @route GET /api/hospitals/me/analytics
// @access Private (hospital_admin)
const getAnalytics = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error("Hospital profile not found");
  }

  const [doctorCount, appointmentsToday] = await Promise.all([
    Doctor.countDocuments({ hospital: hospital._id }),
    Appointment.countDocuments({
      hospital: hospital._id,
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
  ]);

  res.json({
    success: true,
    analytics: {
      totalBeds: hospital.beds.total,
      occupiedBeds: hospital.beds.occupied,
      occupancyRate: hospital.occupancyRate,
      departments: hospital.departments.length,
      staffMembers: hospital.staffMembers,
      doctorCount,
      appointmentsToday,
      icuAvailable: hospital.beds.icuTotal - hospital.beds.icuOccupied,
      emergencyCapacity: hospital.emergency.capacityAvailable,
    },
  });
});

// @desc  List all doctors under this hospital
// @route GET /api/hospitals/me/doctors
// @access Private (hospital_admin)
const getMyDoctors = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  const doctors = await Doctor.find({ hospital: hospital._id }).populate("user", "name email phone status");
  res.json({ success: true, count: doctors.length, doctors });
});

// @desc  Public: get any hospital's profile card (for patient-facing views)
// @route GET /api/hospitals/:id
// @access Private
const getHospitalById = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) {
    res.status(404);
    throw new Error("Hospital not found");
  }
  res.json({ success: true, hospital });
});

module.exports = {
  getMyHospital,
  updateMyHospital,
  updateBeds,
  getAnalytics,
  getMyDoctors,
  getHospitalById,
};
