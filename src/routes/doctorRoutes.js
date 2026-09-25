// const express = require("express");
// const {
//   getMyProfile,
//   updateMyProfile,
//   getMyPatients,
//   getMyAppointments,
// } = require("../controllers/doctorController");
// const { protect } = require("../middleware/auth");
// const { authorize } = require("../middleware/role");

// const router = express.Router();

// router.use(protect, authorize("doctor"));

// router.get("/me", getMyProfile);
// router.put("/me", updateMyProfile);
// router.get("/my-patients", getMyPatients);
// router.get("/my-appointments", getMyAppointments);

// module.exports = router;





const express = require("express");
const {
  listDoctors,
  getMyProfile,
  updateMyProfile,
  getMyPatients,
  getMyAppointments,
} = require("../controllers/doctorController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

// Open to any logged-in role (patients need this to browse doctors for booking)
router.get("/", protect, listDoctors);

router.use(protect, authorize("doctor"));

router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.get("/my-patients", getMyPatients);
router.get("/my-appointments", getMyAppointments);

module.exports = router;