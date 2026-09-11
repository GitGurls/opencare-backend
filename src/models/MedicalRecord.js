const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    type: {
      type: String,
      enum: ["Prescription", "Report", "Diagnosis", "VisitNote"],
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    // Doctor who created this entry, if any (null when patient self-uploads a report)
    createdByDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    // Prescription-specific
    medicines: [
      {
        name: String,
        dosage: String, // e.g. "500mg"
        frequency: String, // e.g. "2x daily"
        durationDays: Number,
      },
    ],
    // Report/file attachment reference (store as URL - S3/Cloudinary in real deployment)
    fileUrl: String,
    recordDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
