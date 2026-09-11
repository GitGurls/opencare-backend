const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const recordRoutes = require("./routes/recordRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const medicationRoutes = require("./routes/medicationRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const familyContactRoutes = require("./routes/familyContactRoutes");
const clinicRoutes = require("./routes/clinicRoutes");

const app = express();

// Security & core middleware
app.use(helmet());
app.use(
  cors({
    // NOTE: cookies require a concrete origin - "*" will NOT work once frontend sends credentials.
    // Set CLIENT_URL in .env to your frontend's exact URL (e.g. http://localhost:5173).
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Basic rate limiting (protects login/register from brute force during demo too)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "OpennCare API is running", time: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/medicines", medicationRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/family-contacts", familyContactRoutes);
app.use("/api/clinic", clinicRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
