const express = require("express");
const { getMyProfile, updateMyProfile, getPatientById } = require("../controllers/patientController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.get("/me", protect, authorize("patient"), getMyProfile);
router.put("/me", protect, authorize("patient"), updateMyProfile);
router.get("/:id", protect, authorize("doctor", "hospital_admin"), getPatientById);

module.exports = router;
