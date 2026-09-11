const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    category: {
      type: String,
      enum: ["Salaries", "Equipment", "Medicines", "Utilities", "Maintenance", "Other"],
      required: true,
    },
    description: String,
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
