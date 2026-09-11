const express = require("express");
const {
  addMedicine,
  getMyMedicines,
  getTodaysDoses,
  markDose,
} = require("../controllers/medicationController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.post("/for/:patientId", protect, authorize("patient", "doctor"), addMedicine);
router.get("/mine", protect, authorize("patient"), getMyMedicines);
router.get("/mine/doses/today", protect, authorize("patient"), getTodaysDoses);
router.put("/doses/:doseId/mark", protect, authorize("patient"), markDose);

module.exports = router;
