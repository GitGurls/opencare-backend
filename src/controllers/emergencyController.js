const asyncHandler = require("express-async-handler");
const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const BloodBank = require("../models/BloodBank");
const Pharmacy = require("../models/Pharmacy");

// All endpoints take ?lng=&lat=&maxDistanceKm= (default 10km)
const parseGeoQuery = (req, res) => {
  const { lng, lat, maxDistanceKm } = req.query;
  if (!lng || !lat) {
    res.status(400);
    throw new Error("lng and lat query params are required");
  }
  return {
    coordinates: [parseFloat(lng), parseFloat(lat)],
    maxDistance: (parseFloat(maxDistanceKm) || 10) * 1000, // metres
  };
};

// @desc  Find nearby hospitals with live bed/ICU/emergency capacity
// @route GET /api/emergency/hospitals?lng=&lat=&maxDistanceKm=
// @access Private
const nearbyHospitals = asyncHandler(async (req, res) => {
  const { coordinates, maxDistance } = parseGeoQuery(req, res);

  const hospitals = await Hospital.find({
    "location.coordinates": {
      $near: { $geometry: { type: "Point", coordinates }, $maxDistance: maxDistance },
    },
    "emergency.hasEmergencyDept": true,
  }).select("name location beds emergency accreditation");

  res.json({ success: true, count: hospitals.length, hospitals });
});

// @desc  Find nearby available ambulances
// @route GET /api/emergency/ambulances?lng=&lat=&maxDistanceKm=
// @access Private
const nearbyAmbulances = asyncHandler(async (req, res) => {
  const { coordinates, maxDistance } = parseGeoQuery(req, res);

  const ambulances = await Ambulance.find({
    location: {
      $near: { $geometry: { type: "Point", coordinates }, $maxDistance: maxDistance },
    },
    status: "Available",
  }).populate("hospital", "name");

  res.json({ success: true, count: ambulances.length, ambulances });
});

// @desc  Find nearby blood banks (optionally filter by bloodGroup availability)
// @route GET /api/emergency/blood-banks?lng=&lat=&maxDistanceKm=&bloodGroup=
// @access Private
const nearbyBloodBanks = asyncHandler(async (req, res) => {
  const { coordinates, maxDistance } = parseGeoQuery(req, res);
  const { bloodGroup } = req.query;

  const query = {
    "location.coordinates": {
      $near: { $geometry: { type: "Point", coordinates }, $maxDistance: maxDistance },
    },
  };
  if (bloodGroup) {
    query[`stock.${bloodGroup}`] = { $gt: 0 };
  }

  const bloodBanks = await BloodBank.find(query);
  res.json({ success: true, count: bloodBanks.length, bloodBanks });
});

// @desc  Find nearby pharmacies
// @route GET /api/emergency/pharmacies?lng=&lat=&maxDistanceKm=
// @access Private
const nearbyPharmacies = asyncHandler(async (req, res) => {
  const { coordinates, maxDistance } = parseGeoQuery(req, res);

  const pharmacies = await Pharmacy.find({
    "location.coordinates": {
      $near: { $geometry: { type: "Point", coordinates }, $maxDistance: maxDistance },
    },
  });

  res.json({ success: true, count: pharmacies.length, pharmacies });
});

module.exports = { nearbyHospitals, nearbyAmbulances, nearbyBloodBanks, nearbyPharmacies };
