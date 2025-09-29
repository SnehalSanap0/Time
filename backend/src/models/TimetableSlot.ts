import mongoose from "mongoose";

const TimetableSlotSchema = new mongoose.Schema({
  day: { type: String, enum: ["Monday","Tuesday","Wednesday","Thursday","Friday"], required: true },
  startTime: { type: String, required: true }, // e.g., "09:00"
  endTime: { type: String, required: true },   // e.g., "10:00"
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  classroom: { type: String, required: true },
  type: { type: String, enum: ["theory", "lab"], required: true },
  semester: { type: Number, required: true },
});

const TimetableSlot = mongoose.model("TimetableSlot", TimetableSlotSchema);

export default TimetableSlot;
