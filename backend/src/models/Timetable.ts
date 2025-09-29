import mongoose from "mongoose";

const TimetableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: String, enum: ["SE", "TE", "BE"], required: true },
  slots: [
    {
      day: String,
      start: String,
      end: String,
      subject: String,
      faculty: String,
      room: String,
      lab: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Timetable", TimetableSchema);
