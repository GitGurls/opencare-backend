const express = require("express");
const {
  nearbyHospitals,
  nearbyAmbulances,
  nearbyBloodBanks,
  nearbyPharmacies,
} = require("../controllers/emergencyController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/hospitals", protect, nearbyHospitals);
router.get("/ambulances", protect, nearbyAmbulances);
router.get("/blood-banks", protect, nearbyBloodBanks);
router.get("/pharmacies", protect, nearbyPharmacies);

module.exports = router;
