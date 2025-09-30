import { Request, Response } from "express";
import TimetableSlot from "../models/TimetableSlot";

// GET all timetable slots
export const getAllTimetableSlots = async (req: Request, res: Response) => {
  try {
    const slots = await TimetableSlot.find();
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
    console.log("Received batch save request with data:", JSON.stringify(slots, null, 2));
    
    if (!Array.isArray(slots)) {
      console.error("Request body is not an array:", typeof slots);
      return res.status(400).json({ error: "Request body must be an array" });
    }

    if (slots.length === 0) {
      console.error("Empty slots array received");
      return res.status(400).json({ error: "Slots array cannot be empty" });
    }

    // Validate each slot has required fields
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const requiredFields = ['day', 'time', 'subject', 'faculty', 'room', 'type', 'year', 'duration', 'semester'];
      
      for (const field of requiredFields) {
        if (!slot[field]) {
          console.error(`Missing required field '${field}' in slot ${i}:`, slot);
          return res.status(400).json({ 
            error: `Missing required field '${field}' in slot ${i}`,
            slot: slot
          });
        }
      }
    }

    // Remove any 'id' fields from frontend and let MongoDB generate _id
    const cleanedSlots = slots.map(slot => {
      const { id, ...cleanSlot } = slot;
      return cleanSlot;
    });

    console.log("Cleaned slots for insertion:", JSON.stringify(cleanedSlots, null, 2));
    const savedSlots = await TimetableSlot.insertMany(cleanedSlots);
    console.log("Successfully saved slots:", savedSlots.length);
    res.status(201).json(savedSlots);
  } catch (err: any) {
    console.error("Error batch saving timetable slots:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      error: "Failed to batch save timetable slots",
      details: err.message 
    });
  }
};
