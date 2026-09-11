const express = require("express");
const {
  addOwnRecord,
  addRecordForPatient,
  getMyRecords,
  getRecordsForDoctor,
  createGrant,
  revokeGrant,
  getMyGrants,
} = require("../controllers/recordController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

// Medical passport
router.post("/", protect, authorize("patient"), addOwnRecord);
router.get("/mine", protect, authorize("patient"), getMyRecords);
router.post("/for/:patientId", protect, authorize("doctor"), addRecordForPatient);
router.get("/patient/:patientId", protect, authorize("doctor"), getRecordsForDoctor);

// Patient Controlled Access grants
router.post("/grants", protect, authorize("patient"), createGrant);
router.put("/grants/:id/revoke", protect, authorize("patient"), revokeGrant);
router.get("/grants/mine", protect, authorize("patient"), getMyGrants);

module.exports = router;
