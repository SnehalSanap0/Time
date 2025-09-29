import mongoose from "mongoose";

const LabSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, default: 30 },
  type: { type: String, required: true }, // e.g. "Computer Lab"
  equipment: [String],
  floor: { type: Number, default: 1 },
  availableHours: [String] // e.g. ["8:00-9:00","9:00-10:00"]
});

export default mongoose.model("Lab", LabSchema);
