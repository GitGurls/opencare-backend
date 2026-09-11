const express = require("express");
const {
  getMyHospital,
  updateMyHospital,
  updateBeds,
  getAnalytics,
  getMyDoctors,
  getHospitalById,
} = require("../controllers/hospitalController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.get("/me", protect, authorize("hospital_admin"), getMyHospital);
router.put("/me", protect, authorize("hospital_admin"), updateMyHospital);
router.put("/me/beds", protect, authorize("hospital_admin"), updateBeds);
router.get("/me/analytics", protect, authorize("hospital_admin"), getAnalytics);
router.get("/me/doctors", protect, authorize("hospital_admin"), getMyDoctors);

// Any logged-in role can view a hospital's public card (e.g. patient browsing hospitals)
router.get("/:id", protect, getHospitalById);

module.exports = router;
