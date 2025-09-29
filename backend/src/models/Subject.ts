import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  year: { type: String, enum: ["SE", "TE", "BE"], required: true },
  type: { type: String, enum: ["theory", "lab"], default: "theory" },
  labHours: { type: Number, default: 0 },
  theoryHours: { type: Number, default: 0 },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  semester: { type: Number, required: true }
});

export default mongoose.model("Subject", SubjectSchema);
