const express = require("express");
const {
  bookAppointment,
  getMyAppointments,
  updateStatus,
  cancelAppointment,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.post("/", protect, authorize("patient"), bookAppointment);
router.get("/mine", protect, authorize("patient"), getMyAppointments);
router.put("/:id/cancel", protect, authorize("patient"), cancelAppointment);
router.put("/:id/status", protect, authorize("doctor", "hospital_admin"), updateStatus);

module.exports = router;
