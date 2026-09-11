const asyncHandler = require("express-async-handler");
const Staff = require("../models/Staff");
const Expense = require("../models/Expense");
const Bill = require("../models/Bill");
const FollowUp = require("../models/FollowUp");
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");

// Helper: resolve the logged-in hospital_admin's hospital
const getMyHospitalOrThrow = async (userId) => {
  const hospital = await Hospital.findOne({ user: userId });
  if (!hospital) {
    const err = new Error("Hospital profile not found");
    err.status = 404;
    throw err;
  }
  return hospital;
};

// ---------- Staff ----------

// @desc  Add a staff member
// @route POST /api/clinic/staff
// @access Private (hospital_admin)
const addStaff = asyncHandler(async (req, res) => {
  const hospital = await getMyHospitalOrThrow(req.user._id);
  const { name, role, department, phone, email, shift } = req.body;

  if (!name || !role) {
    res.status(400);
    throw new Error("name and role are required");
  }

  const staff = await Staff.create({ hospital: hospital._id, name, role, department, phone, email, shift });

  hospital.staffMembers += 1;
  await hospital.save();

  res.status(201).json({ success: true, staff });
});

// @desc  List staff
// @route GET /api/clinic/staff
// @access Private (hospital_admin)
const getStaff = asyncHandler(async (req, res) => {
  const hospital = await getMyHospitalOrThrow(req.user._id);
  const staff = await Staff.find({ hospital: hospital._id }).sort("-createdAt");
  res.json({ success: true, count: staff.length, staff });
});

// @desc  Update a staff member (status, shift, department etc.)
// @route PUT /api/clinic/staff/:id
// @access Private (hospital_admin)
const updateStaff = asyncHandler(async (req, res) => {
  const hospital = await getMyHospitalOrThrow(req.user._id);
  const staff = await Staff.findOne({ _id: req.params.id, hospital: hospital._id });

  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  const fields = ["name", "role", "department", "phone", "email", "shift", "status"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) staff[f] = req.body[f];
  });

  await staff.save();
  res.json({ success: true, staff });
});

// ---------- Expenses ----------

// @desc  Log an expense
// @route POST /api/clinic/expenses
// @access Private (hospital_admin)
const addExpense = asyncHandler(async (req, res) => {
  const hospital = await getMyHospitalOrThrow(req.user._id);
  const { category, description, amount, date } = req.body;

  if (!category || amount === undefined) {
    res.status(400);
    throw new Error("category and amount are required");
  }

  const expense = await Expense.create({
    hospital: hospital._id,
    category,
    description,
    amount,
    date,
    recordedBy: req.user._id,
  });

  res.status(201).json({ success: true, expense });
});

// @desc  List expenses (optional ?month=9&year=2026 filter)
// @route GET /api/clinic/expenses
// @access Private (hospital_admin)
const getExpenses = asyncHandler(async (req, res) => {
  const hospital = await getMyHospitalOrThrow(req.user._id);
  const query = { hospital: hospital._id };

  if (req.query.month && req.query.year) {
    const start = new Date(req.query.year, req.query.month - 1, 1);
    const end = new Date(req.query.year, req.query.month, 0, 23, 59, 59);
    query.date = { $gte: start, $lte: end };
  }

  const expenses = await Expense.find(query).sort("-date");
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  res.json({ success: true, count: expenses.length, total, expenses });
});

// ---------- Billing ----------

// @desc  Create a bill for a patient
// @route POST /api/clinic/billing
// @access Private (hospital_admin)
const createBill = asyncHandler(async (req, res) => {
  const hospital = await getMyHospitalOrThrow(req.user._id);
  const { patientId, appointmentId, items, paymentMethod } = req.body;

  if (!patientId || !items || !items.length) {
    res.status(400);
    throw new Error("patientId and items[] are required");
  }

  const totalAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0);

  const bill = await Bill.create({
    hospital: hospital._id,
    patient: patientId,
    appointment: appointmentId,
    items,
    totalAmount,
    paymentMethod,
  });

  res.status(201).json({ success: true, bill });
});

// @desc  List bills (optional ?status=Pending)
// @route GET /api/clinic/billing
// @access Private (hospital_admin)
const getBills = asyncHandler(async (req, res) => {
  const hospital = await getMyHospitalOrThrow(req.user._id);
  const query = { hospital: hospital._id };
  if (req.query.status) query.status = req.query.status;

  const bills = await Bill.find(query)
    .populate({ path: "patient", populate: { path: "user", select: "name" } })
    .sort("-createdAt");

  res.json({ success: true, count: bills.length, bills });
});

// @desc  Mark a bill as paid
// @route PUT /api/clinic/billing/:id/pay
// @access Private (hospital_admin)
const markBillPaid = asyncHandler(async (req, res) => {
  const hospital = await getMyHospitalOrThrow(req.user._id);
  const bill = await Bill.findOne({ _id: req.params.id, hospital: hospital._id });

  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }

  bill.status = "Paid";
  bill.paidAt = new Date();
  if (req.body.paymentMethod) bill.paymentMethod = req.body.paymentMethod;

  await bill.save();
  res.json({ success: true, bill });
});

// ---------- Follow-ups ----------

// @desc  Doctor schedules a follow-up for a patient
// @route POST /api/clinic/followups
// @access Private (doctor)
const createFollowUp = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const { patientId, fromAppointment, scheduledDate, notes } = req.body;

  if (!patientId || !scheduledDate) {
    res.status(400);
    throw new Error("patientId and scheduledDate are required");
  }

  const followUp = await FollowUp.create({
    patient: patientId,
    doctor: doctor._id,
    fromAppointment,
    scheduledDate,
    notes,
  });

  res.status(201).json({ success: true, followUp });
});

// @desc  Doctor's follow-up list
// @route GET /api/clinic/followups/mine
// @access Private (doctor)
const getMyFollowUps = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const followUps = await FollowUp.find({ doctor: doctor._id })
    .populate({ path: "patient", populate: { path: "user", select: "name" } })
    .sort("scheduledDate");

  res.json({ success: true, count: followUps.length, followUps });
});

// @desc  Update follow-up status (Done/Missed)
// @route PUT /api/clinic/followups/:id/status
// @access Private (doctor)
const updateFollowUpStatus = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const followUp = await FollowUp.findOne({ _id: req.params.id, doctor: doctor._id });

  if (!followUp) {
    res.status(404);
    throw new Error("Follow-up not found");
  }

  followUp.status = req.body.status;
  await followUp.save();
  res.json({ success: true, followUp });
});

module.exports = {
  addStaff,
  getStaff,
  updateStaff,
  addExpense,
  getExpenses,
  createBill,
  getBills,
  markBillPaid,
  createFollowUp,
  getMyFollowUps,
  updateFollowUpStatus,
};
