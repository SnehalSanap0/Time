import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import facultyRoutes from "./routes/facultyRoutes";
import subjectRoutes from "./routes/subjectRoutes";
import classroomRoutes from "./routes/classroomRoutes";
import labRoutes from "./routes/labRoutes";
import timetableRoutes from "./routes/timetableRoutes";
import timetableSlotsRouter from "./routes/timetableSlots";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/faculty", facultyRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/timetable-slots", timetableSlotsRouter);

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(3001, () => console.log("🚀 Server running at http://localhost:3001"));
  })
  .catch(err => console.error(err));
