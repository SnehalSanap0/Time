import { Request, Response } from 'express';
import { TimetableSlotModel } from '../models/TimetableModels';

export const getAllTimetableSlots = async (req: Request, res: Response) => {
  try {
    const { year, semester, faculty, batch } = req.query;
    let query: any = {};
    
    if (year) query.year = year;
    if (semester) query.semester = parseInt(semester as string);
    if (faculty) query.faculty = faculty;
    if (batch) query.batch = batch;
    
    const slots = await TimetableSlotModel.find(query).sort({ day: 1, time: 1 });
    res.json(slots);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTimetableSlot = async (req: Request, res: Response) => {
  try {
    const slot = new TimetableSlotModel(req.body);
    const savedSlot = await slot.save();
    res.status(201).json(savedSlot);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createBatchTimetableSlots = async (req: Request, res: Response) => {
  try {
    const slots = await TimetableSlotModel.insertMany(req.body);
    res.status(201).json(slots);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAllTimetableSlots = async (req: Request, res: Response) => {
  try {
    await TimetableSlotModel.deleteMany({});
    res.json({ message: 'All timetable slots cleared successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTimetableSlot = async (req: Request, res: Response) => {
  try {
    const slot = await TimetableSlotModel.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Timetable slot not found' });
    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
