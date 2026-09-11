const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const generateToken = require("../utils/generateToken");
const { setTokenCookie, clearTokenCookie } = require("../utils/cookieUtils");

// @desc  Register a new user (patient / doctor / hospital_admin)
// @route POST /api/auth/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, profile } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Name, email, password and role are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  const user = await User.create({ name, email, phone, password, role });

  // Create role-specific profile
  let profileDoc;
  if (role === "patient") {
    profileDoc = await Patient.create({
      user: user._id,
      age: profile?.age,
      gender: profile?.gender,
      bloodGroup: profile?.bloodGroup,
      location: profile?.location,
    });
    user.profileModel = "Patient";
  } else if (role === "doctor") {
    profileDoc = await Doctor.create({
      user: user._id,
      qualification: profile?.qualification,
      specialization: profile?.specialization,
      experienceYears: profile?.experienceYears,
      hospital: profile?.hospital,
    });
    user.profileModel = "Doctor";
  } else if (role === "hospital_admin") {
    profileDoc = await Hospital.create({
      user: user._id,
      name: profile?.name || name,
      type: profile?.type,
      accreditation: profile?.accreditation,
      location: profile?.location,
      departments: profile?.departments,
    });
    user.profileModel = "Hospital";
  } else {
    res.status(400);
    throw new Error("Invalid role");
  }

  user.profileId = profileDoc._id;
  await user.save();

  const token = generateToken(user._id, user.role);
  setTokenCookie(res, token);

  res.status(201).json({
    success: true,
    // Also returned in the body so Postman/mobile clients (which don't auto-handle
    // cookies) can still grab it and use it as a Bearer token.
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileId: profileDoc._id,
    },
  });
});

// @desc  Login user
// @route POST /api/auth/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id, user.role);
  setTokenCookie(res, token);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileId: user.profileId,
    },
  });
});

// @desc  Logout - clears the auth cookie
// @route POST /api/auth/logout
// @access Private
const logoutUser = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: "Logged out" });
});

// @desc  Get logged-in user's own data
// @route GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { registerUser, loginUser, logoutUser, getMe };
