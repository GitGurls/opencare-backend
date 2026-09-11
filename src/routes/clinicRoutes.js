const express = require("express");
const {
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
} = require("../controllers/clinicController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

// Staff (hospital_admin)
router.post("/staff", protect, authorize("hospital_admin"), addStaff);
router.get("/staff", protect, authorize("hospital_admin"), getStaff);
router.put("/staff/:id", protect, authorize("hospital_admin"), updateStaff);

// Expenses (hospital_admin)
router.post("/expenses", protect, authorize("hospital_admin"), addExpense);
router.get("/expenses", protect, authorize("hospital_admin"), getExpenses);

// Billing (hospital_admin)
router.post("/billing", protect, authorize("hospital_admin"), createBill);
router.get("/billing", protect, authorize("hospital_admin"), getBills);
router.put("/billing/:id/pay", protect, authorize("hospital_admin"), markBillPaid);

// Follow-ups (doctor)
router.post("/followups", protect, authorize("doctor"), createFollowUp);
router.get("/followups/mine", protect, authorize("doctor"), getMyFollowUps);
router.put("/followups/:id/status", protect, authorize("doctor"), updateFollowUpStatus);

module.exports = router;
