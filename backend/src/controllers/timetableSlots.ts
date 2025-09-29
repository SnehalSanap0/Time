import { Request, Response } from "express";
import TimetableSlot from "../models/TimetableSlot";

// GET all timetable slots
export const getAllTimetableSlots = async (req: Request, res: Response) => {
  try {
    const slots = await TimetableSlot.find()
      .populate("subject")
      .populate("faculty");
    res.json(slots);
  } catch (err) {
    console.error("Error fetching timetable slots:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST a new slot
export const createTimetableSlot = async (req: Request, res: Response) => {
  try {
    const slot = new TimetableSlot(req.body);
    await slot.save();
    res.status(201).json(slot);
  } catch (err: any) {
    console.error("Error creating timetable slot:", err);
    res.status(400).json({ error: err.message });
  }
};

// DELETE all timetable slots
export const deleteAllTimetableSlots = async (req: Request, res: Response) => {
  try {
    await TimetableSlot.deleteMany({});
    res.json({ message: "All timetable slots cleared" });
  } catch (err) {
    console.error("Error clearing timetable slots:", err);
    res.status(500).json({ error: "Failed to clear timetable slots" });
  }
};

// POST /api/timetable-slots/batch
export const batchSaveTimetableSlots = async (req: Request, res: Response) => {
  try {
    const slots = req.body; // expect an array of slots
    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: "Request body must be an array" });
    }

    const savedSlots = await TimetableSlot.insertMany(slots);
    res.status(201).json(savedSlots);
  } catch (err: any) {
    console.error("Error batch saving timetable slots:", err);
    res.status(500).json({ error: "Failed to batch save timetable slots" });
  }
};
