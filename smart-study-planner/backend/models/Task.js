const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, trim: true, default: "General" },
  description: { type: String, trim: true, default: "" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  estimatedTime: { type: Number, min: 0, default: 60 },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
