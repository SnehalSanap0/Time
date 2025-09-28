import { Request, Response } from 'express';
import { FacultyModel } from '../models/TimetableModels';

export const getAllFaculty = async (req: Request, res: Response) => {
  try {
    const faculty = await FacultyModel.find().sort({ createdAt: -1 });
    res.json(faculty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createFaculty = async (req: Request, res: Response) => {
  try {
    const faculty = new FacultyModel(req.body);
    const savedFaculty = await faculty.save();
    res.status(201).json(savedFaculty);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateFaculty = async (req: Request, res: Response) => {
  try {
    const faculty = await FacultyModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    res.json(faculty);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteFaculty = async (req: Request, res: Response) => {
  try {
    const faculty = await FacultyModel.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
