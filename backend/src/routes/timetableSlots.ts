import express from "express";
import { getAllTimetableSlots, createTimetableSlot, deleteAllTimetableSlots, batchSaveTimetableSlots } from "../controllers/timetableSlots";

const router = express.Router();

// GET /api/timetable-slots
router.get("/", getAllTimetableSlots);
router.post("/", createTimetableSlot);
router.delete("/", deleteAllTimetableSlots);
router.post("/batch", batchSaveTimetableSlots);

export default router;
