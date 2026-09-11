const express = require("express");
const {
  addFamilyContact,
  getMyFamilyContacts,
  revokeFamilyContact,
} = require("../controllers/familyContactController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect, authorize("patient"));

router.post("/", addFamilyContact);
router.get("/mine", getMyFamilyContacts);
router.put("/:id/revoke", revokeFamilyContact);

module.exports = router;
