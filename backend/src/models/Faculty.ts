import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  department: String,
  subjects: [String], // subject codes
  maxHoursPerDay: { type: Number, default: 4 },
  preferredSlots: [String]
});

export default mongoose.model("Faculty", FacultySchema);
