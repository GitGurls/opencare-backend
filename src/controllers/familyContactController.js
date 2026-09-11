const asyncHandler = require("express-async-handler");
const FamilyContact = require("../models/FamilyContact");
const Patient = require("../models/Patient");

// @desc  Patient adds a family member to receive medication updates (with permission)
// @route POST /api/family-contacts
// @access Private (patient)
const addFamilyContact = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const { name, relation, phone, email, notifyOn } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("name is required");
  }

  const contact = await FamilyContact.create({
    patient: patient._id,
    name,
    relation,
    phone,
    email,
    notifyOn,
  });

  res.status(201).json({ success: true, contact });
});

// @desc  Patient lists their connected-care contacts
// @route GET /api/family-contacts/mine
// @access Private (patient)
const getMyFamilyContacts = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const contacts = await FamilyContact.find({ patient: patient._id });
  res.json({ success: true, count: contacts.length, contacts });
});

// @desc  Patient revokes a family contact's access
// @route PUT /api/family-contacts/:id/revoke
// @access Private (patient)
const revokeFamilyContact = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const contact = await FamilyContact.findOne({ _id: req.params.id, patient: patient._id });

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  contact.status = "Revoked";
  await contact.save();
  res.json({ success: true, contact });
});

module.exports = { addFamilyContact, getMyFamilyContacts, revokeFamilyContact };
