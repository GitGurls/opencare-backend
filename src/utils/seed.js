require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const BloodBank = require("../models/BloodBank");
const Pharmacy = require("../models/Pharmacy");

const run = async () => {
  await connectDB();
  console.log("Clearing existing demo collections...");
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Hospital.deleteMany({}),
    Ambulance.deleteMany({}),
    BloodBank.deleteMany({}),
    Pharmacy.deleteMany({}),
  ]);

  // Bhopal coordinates, matching the PPT mock data locations
  const bhopalCoords = [77.4126, 23.2599];

  // --- Hospital: CityCare Hospital ---
  const hospitalUser = await User.create({
    name: "CityCare Admin",
    email: "admin@citycare.com",
    phone: "9800000001",
    password: "password123",
    role: "hospital_admin",
  });

  const hospital = await Hospital.create({
    user: hospitalUser._id,
    name: "CityCare Hospital",
    type: "Multi-speciality Hospital",
    accreditation: "NABH Accredited",
    location: {
      city: "Bhopal, India",
      address: "MP Nagar, Bhopal",
      coordinates: { type: "Point", coordinates: bhopalCoords },
    },
    departments: ["Cardiology", "Neurology", "Orthopedics", "General Medicine"],
    staffMembers: 240,
    beds: { total: 350, occupied: 273, icuTotal: 40, icuOccupied: 30 },
    emergency: { hasEmergencyDept: true, capacityAvailable: 77 },
    pharmacyAvailable: true,
    labsAvailable: true,
  });

  hospitalUser.profileId = hospital._id;
  hospitalUser.profileModel = "Hospital";
  await hospitalUser.save();

  // --- Doctor: Dr. Arjun Mehta ---
  const doctorUser = await User.create({
    name: "Dr. Arjun Mehta",
    email: "arjun.mehta@citycare.com",
    phone: "9800000002",
    password: "password123",
    role: "doctor",
  });

  const doctor = await Doctor.create({
    user: doctorUser._id,
    qualification: "MBBS, MD (General Medicine)",
    specialization: "General Medicine",
    experienceYears: 6,
    hospital: hospital._id,
    availability: "Available",
    stats: { totalPatients: 842, todaysAppointments: 28 },
  });

  doctorUser.profileId = doctor._id;
  doctorUser.profileModel = "Doctor";
  await doctorUser.save();

  // --- Patient: Ananya Sharma ---
  const patientUser = await User.create({
    name: "Ananya Sharma",
    email: "ananya.sharma@gmail.com",
    phone: "9800000003",
    password: "password123",
    role: "patient",
  });

  const patient = await Patient.create({
    user: patientUser._id,
    age: 21,
    gender: "Female",
    bloodGroup: "B+",
    location: {
      city: "Bhopal, India",
      address: "Arera Colony, Bhopal",
      coordinates: { type: "Point", coordinates: bhopalCoords },
    },
    lastVisit: new Date("2025-04-12"),
    medicalPassportComplete: true,
  });

  patientUser.profileId = patient._id;
  patientUser.profileModel = "Patient";
  await patientUser.save();

  // --- Emergency resources near Bhopal ---
  await Ambulance.create({
    vehicleNumber: "MP04-AB-1234",
    driverName: "Ramesh Yadav",
    driverPhone: "9800000010",
    hospital: hospital._id,
    type: "ICU",
    status: "Available",
    location: { type: "Point", coordinates: [77.42, 23.255] },
  });

  await BloodBank.create({
    name: "CityCare Blood Bank",
    hospital: hospital._id,
    location: { address: "MP Nagar, Bhopal", coordinates: { type: "Point", coordinates: bhopalCoords } },
    contactPhone: "9800000020",
    stock: { "B+": 12, "O+": 20, "A+": 8, "AB+": 3 },
  });

  await Pharmacy.create({
    name: "CityCare 24x7 Pharmacy",
    hospital: hospital._id,
    location: { address: "MP Nagar, Bhopal", coordinates: { type: "Point", coordinates: bhopalCoords } },
    contactPhone: "9800000030",
    is24x7: true,
  });

  console.log("Seed complete. Demo logins (password: password123):");
  console.log(" hospital_admin -> admin@citycare.com");
  console.log(" doctor         -> arjun.mehta@citycare.com");
  console.log(" patient        -> ananya.sharma@gmail.com");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
