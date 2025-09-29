import mongoose from "mongoose";

const ClassroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  timeSlot: { type: String, enum: ["8AM-3PM", "10AM-5PM"], default: "8AM-3PM" },
  assignedYear: { type: String, enum: ["SE", "TE", "BE"], required: true },
  floor: { type: Number, default: 1 },
  amenities: [String]
});

export default mongoose.model("Classroom", ClassroomSchema);
