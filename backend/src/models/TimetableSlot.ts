import mongoose from "mongoose";

const TimetableSlotSchema = new mongoose.Schema({
  day: { type: String, enum: ["Monday","Tuesday","Wednesday","Thursday","Friday", "Saturday"], required: true },
  time: { type: String, required: true }, // e.g., "09:00-10:00"
  subject: { type: String, required: true }, // Changed to String to match frontend
  faculty: { type: String, required: true }, // Changed to String to match frontend
  room: { type: String, required: true }, // Changed from classroom to room
  type: { type: String, enum: ["theory", "lab"], required: true },
  year: { type: String, enum: ["SE", "TE", "BE"], required: true }, // Added year field
  batch: { type: String, enum: ["A", "B", "C"] }, // Optional batch field
  duration: { type: Number, required: true }, // Duration in hours
  semester: { type: Number, required: true },
});

const TimetableSlot = mongoose.model("TimetableSlot", TimetableSlotSchema);

export default TimetableSlot;
