const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    items: [
      {
        label: String, // e.g. "Consultation Fee", "Blood Test"
        amount: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Paid", "Cancelled"], default: "Pending" },
    paidAt: Date,
    paymentMethod: { type: String, enum: ["Cash", "Card", "UPI", "Insurance"], default: "Cash" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);
